import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { CartService } from './cart.service';
import type { Cart } from './cart.entity';
import type { Product } from '../product/product.entity';
import type { User } from '../user/user.entity';

describe('CartService', () => {
  const user = { id: 1 } as User;
  const product = { id: 2, name: 'Keyboard', price: 2500, stock: 5 } as Product;

  it('adds a product and calculates the line total', async () => {
    const cartRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: Partial<Cart>) => value),
      save: jest.fn((value: Partial<Cart>) =>
        Promise.resolve({ id: 1, ...value }),
      ),
    } as unknown as Repository<Cart>;
    const productRepo = {
      findOne: jest.fn().mockResolvedValue(product),
    } as unknown as Repository<Product>;
    const userRepo = {
      findOne: jest.fn().mockResolvedValue(user),
    } as unknown as Repository<User>;

    const service = new CartService(cartRepo, productRepo, userRepo);
    const result = await service.addToCart(1, 2, 2);

    expect(result.quantity).toBe(2);
    expect(Number(result.total)).toBe(5000);
  });

  it('rejects quantities above available stock', async () => {
    const service = new CartService(
      { findOne: jest.fn() } as unknown as Repository<Cart>,
      {
        findOne: jest.fn().mockResolvedValue(product),
      } as unknown as Repository<Product>,
      {
        findOne: jest.fn().mockResolvedValue(user),
      } as unknown as Repository<User>,
    );

    await expect(service.addToCart(1, 2, 6)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
