import { CartController } from './cart.controller';
import type { CartService } from './cart.service';

describe('CartController', () => {
  it('should be defined', () => {
    const service = {
      addToCart: jest.fn(),
      getCart: jest.fn(),
      updateQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
    } as unknown as CartService;
    const controller = new CartController(service);
    expect(controller).toBeDefined();
  });
});
