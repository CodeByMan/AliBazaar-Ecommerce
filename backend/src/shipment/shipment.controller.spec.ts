import { ShipmentController } from './shipment.controller';
import type { ShipmentService } from './shipment.service';

describe('ShipmentController', () => {
  it('should be defined', () => {
    const service = {
      getShipmentByOrder: jest.fn(),
      getAdminShipmentByOrder: jest.fn(),
    } as unknown as ShipmentService;
    const controller = new ShipmentController(service);
    expect(controller).toBeDefined();
  });
});
