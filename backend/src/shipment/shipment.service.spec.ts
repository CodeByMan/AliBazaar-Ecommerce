import type { Repository } from 'typeorm';
import { ShipmentService } from './shipment.service';
import type { Shipment } from './shipment.entity';

describe('ShipmentService', () => {
  it('should be defined', () => {
    expect(new ShipmentService({} as Repository<Shipment>)).toBeDefined();
  });
});
