import type { Response } from 'express';
import { UserController } from './user.controller';
import type { UserService } from './user.service';

describe('UserController', () => {
  it('sets the customer session cookie after public registration', async () => {
    const service = {
      register: jest.fn().mockResolvedValue({
        message: 'Account created successfully',
        token: 'registration-token',
        role: 'user',
        username: 'newcustomer',
        user: {
          id: 2,
          name: 'New Customer',
          email: 'new@example.com',
          phone: '+923001234567',
          age: 22,
          username: 'newcustomer',
        },
      }),
    } as unknown as UserService;
    const cookie = jest.fn();
    const response = { cookie } as unknown as Response;
    const controller = new UserController(service);

    const result = await controller.register(
      {
        name: 'New Customer',
        username: 'newcustomer',
        email: 'new@example.com',
        phone: '+923001234567',
        age: 22,
        password: 'Password123',
      },
      response,
    );

    expect(result.role).toBe('user');
    expect(cookie).toHaveBeenCalledWith(
      'alibazaar_session',
      'registration-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
  });
});
