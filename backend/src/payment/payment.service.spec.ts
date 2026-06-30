import type { Repository } from 'typeorm';
import { PaymentService } from './payment.service';
import type { Payment } from './payment.entity';

describe('PaymentService', () => {
  it('should be defined', () => {
    expect(new PaymentService({} as Repository<Payment>)).toBeDefined();
  });
});
