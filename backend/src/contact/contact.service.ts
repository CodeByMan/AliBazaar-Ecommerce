import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { connect as connectNet, type Socket } from 'node:net';
import { connect as connectTls, type TLSSocket } from 'node:tls';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

type SmtpSocket = Socket | TLSSocket;

type SmtpResponse = {
  code: number;
  lines: string[];
};

const sanitizeHeader = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

const encodeHeader = (value: string) =>
  `=?UTF-8?B?${Buffer.from(sanitizeHeader(value), 'utf8').toString('base64')}?=`;

const waitForResponse = (socket: SmtpSocket): Promise<SmtpResponse> =>
  new Promise((resolve, reject) => {
    let buffer = '';
    const lines: string[] = [];

    const cleanup = () => {
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('close', onClose);
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onClose = () => {
      cleanup();
      reject(new Error('SMTP connection closed unexpectedly'));
    };

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      let lineEnd = buffer.indexOf('\r\n');

      while (lineEnd >= 0) {
        const line = buffer.slice(0, lineEnd);
        buffer = buffer.slice(lineEnd + 2);
        lines.push(line);

        const match = line.match(/^(\d{3})\s/);
        if (match) {
          cleanup();
          resolve({ code: Number(match[1]), lines });
          return;
        }
        lineEnd = buffer.indexOf('\r\n');
      }
    };

    socket.on('data', onData);
    socket.on('error', onError);
    socket.on('close', onClose);
  });

const command = async (socket: SmtpSocket, value: string) => {
  const response = waitForResponse(socket);
  socket.write(`${value}\r\n`);
  return response;
};

const expectCode = (response: SmtpResponse, accepted: number[]) => {
  if (!accepted.includes(response.code)) {
    throw new Error(
      `SMTP ${response.code}: ${response.lines.join(' ').slice(0, 500)}`,
    );
  }
};

const waitForConnect = (
  socket: SmtpSocket,
  event: 'connect' | 'secureConnect',
) =>
  new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      socket.off(event, onConnect);
      socket.off('error', onError);
    };
    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    socket.once(event, onConnect);
    socket.once('error', onError);
  });

@Injectable()
export class ContactService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async sendMessage(authId: number, dto: CreateContactMessageDto) {
    const user = await this.userRepo.findOne({
      where: { auth: { id: authId } },
      relations: ['auth'],
    });
    if (!user) throw new NotFoundException('Customer account was not found');

    const to = this.config.get<string>(
      'CONTACT_TO_EMAIL',
      'info@alibazaar.com',
    );
    const fromAddress =
      this.config.get<string>('SMTP_FROM_EMAIL') ||
      this.config.get<string>('SMTP_USER');
    if (!fromAddress) {
      throw new ServiceUnavailableException(
        'Contact email is not configured. Set SMTP_FROM_EMAIL or SMTP_USER in backend/.env.',
      );
    }

    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const subject = sanitizeHeader(dto.subject);
    const phone = dto.phone?.trim() || user.phone;
    const message = dto.message.trim();
    const body = [
      'New AliBazaar contact message',
      '',
      `Account: ${user.name}`,
      `Submitted name: ${firstName} ${lastName}`,
      `Email: ${user.email}`,
      `Phone: ${phone}`,
      `Username: ${user.auth.username}`,
      `Subject: ${subject}`,
      '',
      message,
    ].join('\n');

    try {
      await this.sendSmtpMail({
        from: fromAddress,
        to,
        replyTo: user.email,
        subject: `[AliBazaar Contact] ${subject}`,
        body,
      });
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'Unknown mail error';
      throw new ServiceUnavailableException(
        `Unable to send the contact email. Check the SMTP settings. ${detail}`,
      );
    }

    return { message: `Your message has been sent to ${to}.` };
  }

  private async sendSmtpMail(mail: {
    from: string;
    to: string;
    replyTo: string;
    subject: string;
    body: string;
  }) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const secure = this.config.get<string>('SMTP_SECURE', 'false') === 'true';
    const startTls =
      this.config.get<string>('SMTP_STARTTLS', secure ? 'false' : 'true') ===
      'true';
    const rejectUnauthorized =
      this.config.get<string>('SMTP_REJECT_UNAUTHORIZED', 'true') !== 'false';

    if (!host || !user || !pass || !Number.isFinite(port)) {
      throw new Error(
        'Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in backend/.env.',
      );
    }

    let socket: SmtpSocket;
    if (secure) {
      const tlsSocket = connectTls({
        host,
        port,
        servername: host,
        rejectUnauthorized,
      });
      socket = tlsSocket;
      await waitForConnect(socket, 'secureConnect');
    } else {
      const netSocket = connectNet({ host, port });
      socket = netSocket;
      await waitForConnect(socket, 'connect');
    }

    socket.setTimeout(20_000, () =>
      socket.destroy(new Error('SMTP connection timed out')),
    );

    try {
      expectCode(await waitForResponse(socket), [220]);

      let response = await command(socket, 'EHLO alibazaar.com');
      if (response.code !== 250) {
        response = await command(socket, 'HELO alibazaar.com');
      }
      expectCode(response, [250]);

      if (!secure && startTls) {
        expectCode(await command(socket, 'STARTTLS'), [220]);
        const upgradedSocket = connectTls({
          socket: socket as Socket,
          servername: host,
          rejectUnauthorized,
        });
        await waitForConnect(upgradedSocket, 'secureConnect');
        socket = upgradedSocket;
        expectCode(await command(socket, 'EHLO alibazaar.com'), [250]);
      }

      expectCode(await command(socket, 'AUTH LOGIN'), [334]);
      expectCode(await command(socket, Buffer.from(user).toString('base64')), [
        334,
      ]);
      expectCode(await command(socket, Buffer.from(pass).toString('base64')), [
        235,
      ]);

      expectCode(await command(socket, `MAIL FROM:<${mail.from}>`), [250]);
      expectCode(await command(socket, `RCPT TO:<${mail.to}>`), [250, 251]);
      expectCode(await command(socket, 'DATA'), [354]);

      const normalizedBody = mail.body
        .replace(/\r?\n/g, '\r\n')
        .replace(/^\./gm, '..');
      const message = [
        `From: AliBazaar Contact <${sanitizeHeader(mail.from)}>`,
        `To: ${sanitizeHeader(mail.to)}`,
        `Reply-To: ${sanitizeHeader(mail.replyTo)}`,
        `Subject: ${encodeHeader(mail.subject)}`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: <${randomUUID()}@alibazaar.com>`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        normalizedBody,
        '.',
        '',
      ].join('\r\n');

      const dataResponse = waitForResponse(socket);
      socket.write(message);
      expectCode(await dataResponse, [250]);
      await command(socket, 'QUIT').catch(() => undefined);
    } finally {
      socket.end();
      socket.destroy();
    }
  }
}
