import { ProductController } from './product.controller';
import type { ProductService } from './product.service';

describe('ProductController', () => {
  it('should be defined', () => {
    const service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      getProductWithReviews: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      UsergetProducts: jest.fn(),
      getProductDetailsForUser: jest.fn(),
    } as unknown as ProductService;
    const controller = new ProductController(service);
    expect(controller).toBeDefined();
  });
});
