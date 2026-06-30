import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role } from '../role/role.entity';
import { User } from '../user/user.entity';
import { Auth } from './auth.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Auth)
    private readonly authTable: Repository<Auth>,
    @InjectRepository(User)
    private readonly userTable: Repository<User>,
    @InjectRepository(Role)
    private readonly roleTable: Repository<Role>,
    private readonly jwtService: JwtService,
  ) {}

  async login(identifier: string, password: string) {
    const normalizedIdentifier = identifier?.trim();
    if (!normalizedIdentifier || !password) {
      throw new BadRequestException(
        'Username or email and password are required',
      );
    }

    let auth = await this.authTable.findOne({
      where: { username: normalizedIdentifier },
    });
    if (!auth) {
      const user = await this.userTable.findOne({
        where: { email: normalizedIdentifier.toLowerCase() },
        relations: ['auth'],
      });
      auth = user?.auth || null;
    }
    if (!auth) {
      throw new UnauthorizedException('Invalid username, email, or password');
    }
    if (!auth.isActive) {
      throw new ForbiddenException('This account has been disabled');
    }
    const role = await this.roleTable.findOne({ where: { name: auth.role } });
    if (!role || !role.isActive) {
      throw new ForbiddenException('This account role is inactive');
    }

    const isValidPassword = await bcrypt.compare(password, auth.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid username, email, or password');
    }

    const token = this.jwtService.sign({
      id: auth.id,
      username: auth.username,
      role: auth.role,
    });
    const user = await this.userTable.findOne({
      where: { auth: { id: auth.id } },
      relations: ['auth'],
    });

    return {
      message: 'Login successful',
      token,
      role: auth.role,
      username: auth.username,
      id: auth.id,
      user: user ? this.serializeUser(user) : null,
    };
  }

  async getSession(authId: number) {
    const auth = await this.authTable.findOne({ where: { id: authId } });
    if (!auth || !auth.isActive) {
      throw new UnauthorizedException('Session is no longer valid');
    }
    const role = await this.roleTable.findOne({ where: { name: auth.role } });
    if (!role?.isActive) {
      throw new UnauthorizedException('Session role is no longer active');
    }
    const user = await this.userTable.findOne({
      where: { auth: { id: auth.id } },
      relations: ['auth'],
    });
    if (auth.role === 'user' && !user) {
      throw new UnauthorizedException('Customer account was not found');
    }

    return {
      authenticated: true,
      role: auth.role,
      username: auth.username,
      user: user ? this.serializeUser(user) : null,
    };
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      age: user.age,
      username: user.auth.username,
      role: user.auth.role,
      profileImage: user.profileImage || 'defaults/user-avatar.svg',
    };
  }
}
