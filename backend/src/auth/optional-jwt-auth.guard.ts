import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser>(
    _error: unknown,
    user: TUser | false | null | undefined,
  ): TUser {
    return (user || null) as TUser;
  }
}
