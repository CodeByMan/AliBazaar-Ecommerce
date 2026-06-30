import type { JwtService } from '@nestjs/jwt';
import type { Repository } from 'typeorm';
import type { Role } from '../role/role.entity';
import type { User } from '../user/user.entity';
import type { Auth } from './auth.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('should be defined', () => {
    const service = new AuthService(
      {} as Repository<Auth>,
      {} as Repository<User>,
      {} as Repository<Role>,
      { sign: jest.fn() } as unknown as JwtService,
    );
    expect(service).toBeDefined();
  });
});
