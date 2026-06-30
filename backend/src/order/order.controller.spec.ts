import { OrderController } from './order.controller';
import type { OrderService } from './order.service';

describe('OrderController', () => {
  it('should be defined', () => {
    const service = {
      trackOrder: jest.fn(),
      getUserOrders: jest.fn(),
      getAdminOrders: jest.fn(),
      getAdminOrder: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as OrderService;
    const controller = new OrderController(service);
    expect(controller).toBeDefined();
  });
});
