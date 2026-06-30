import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request';
import { Role } from '../role/role.entity';
import { Auth } from './auth.entity';
import { getAuthCookieName } from './auth-cookie';

interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

const extractCookieToken = (request?: Request): string | null => {
  const cookieHeader = request?.headers.cookie;
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (rawName === getAuthCookieName()) {
      return decodeURIComponent(rawValue.join('='));
    }
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(Auth)
    private readonly authRepo: Repository<Auth>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractCookieToken,
      ]),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const auth = await this.authRepo.findOne({ where: { id: payload.id } });
    if (!auth || !auth.isActive) {
      throw new UnauthorizedException(
        'Account is disabled or no longer exists',
      );
    }
    const role = await this.roleRepo.findOne({
      where: { name: auth.role, isActive: true },
    });
    if (!role) throw new UnauthorizedException('Account role is inactive');

    return {
      id: auth.id,
      username: auth.username,
      role: auth.role,
    };
  }
}
