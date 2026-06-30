import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request';
import { clearAuthCookie, setAuthCookie } from './auth-cookie';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

type OptionalAuthenticatedRequest = Request & {
  user?: AuthenticatedUser | null;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body.username, body.password);
    setAuthCookie(response, result.token);
    return result;
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('session')
  getSession(@Req() request: OptionalAuthenticatedRequest) {
    if (!request.user) {
      return {
        authenticated: false,
        role: null,
        username: null,
        user: null,
      };
    }

    return this.authService.getSession(request.user.id);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response) {
    clearAuthCookie(response);
    return { message: 'Logged out successfully' };
  }
}
