import type { Response } from 'express';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

describe('AuthController', () => {
  const customer = {
    id: 1,
    name: 'Customer',
    email: 'customer@example.com',
    phone: '+923001234567',
    age: 25,
    username: 'customer',
  };

  it('sets the HttpOnly customer session cookie after login', async () => {
    const service = {
      login: jest.fn().mockResolvedValue({
        message: 'Login successful',
        token: 'signed-token',
        role: 'user',
        username: 'customer',
        id: 1,
        user: customer,
      }),
    } as unknown as AuthService;
    const cookie = jest.fn();
    const response = { cookie } as unknown as Response;
    const controller = new AuthController(service);

    const result = await controller.login(
      { username: 'customer', password: 'Password123' },
      response,
    );

    expect(result.role).toBe('user');
    expect(cookie).toHaveBeenCalledWith(
      'alibazaar_session',
      'signed-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
  });

  it('clears the customer session cookie on logout', () => {
    const service = {} as AuthService;
    const clearCookie = jest.fn();
    const response = { clearCookie } as unknown as Response;
    const controller = new AuthController(service);

    expect(controller.logout(response)).toEqual({
      message: 'Logged out successfully',
    });
    expect(clearCookie).toHaveBeenCalledWith(
      'alibazaar_session',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
  });
});
