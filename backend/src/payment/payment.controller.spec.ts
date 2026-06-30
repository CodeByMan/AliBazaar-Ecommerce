import { PaymentController } from './payment.controller';
import type { PaymentService } from './payment.service';
import type { CheckoutService } from '../checkout/checkout.service';

describe('PaymentController', () => {
  it('should be defined', () => {
    const paymentService = {
      getPaymentByOrderId: jest.fn(),
    } as unknown as PaymentService;
    const checkoutService = {
      constructWebhookEvent: jest.fn(),
      handleWebhook: jest.fn(),
    } as unknown as CheckoutService;
    expect(
      new PaymentController(paymentService, checkoutService),
    ).toBeDefined();
  });
});
