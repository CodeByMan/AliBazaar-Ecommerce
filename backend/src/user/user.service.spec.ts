import type { JwtService } from '@nestjs/jwt';
import type { DataSource, Repository } from 'typeorm';
import type { Auth } from '../auth/auth.entity';
import type { Order } from '../order/order.entity';
import type { Review } from '../review/review.entity';
import type { Role } from '../role/role.entity';
import type { User } from './user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  it('should be defined', () => {
    expect(
      new UserService(
        {} as Repository<User>,
        {} as Repository<Review>,
        {} as Repository<Order>,
        {} as Repository<Auth>,
        {} as Repository<Role>,
        { sign: jest.fn() } as unknown as JwtService,
        {} as DataSource,
      ),
    ).toBeDefined();
  });
});
