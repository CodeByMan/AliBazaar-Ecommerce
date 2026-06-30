import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request';
import { CheckoutController } from './checkout.controller';
import type { CheckoutService } from './checkout.service';
import type { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

describe('CheckoutController', () => {
  it('passes the authenticated customer account ID to checkout', async () => {
    const createPaymentIntent = jest
      .fn()
      .mockResolvedValue({ clientSecret: 'secret' });
    const service = { createPaymentIntent } as unknown as CheckoutService;
    const controller = new CheckoutController(service);
    const request = {
      user: { id: 15, username: 'customer', role: 'user' },
    } as AuthenticatedRequest;
    const dto = {
      checkoutReference: '6f5145e0-1637-48b0-9532-306e4e3597da',
      customer: {
        fullName: 'Customer',
        email: 'customer@example.com',
        phone: '+923001234567',
        address: '12 Main Boulevard',
        city: 'Karachi',
        stateProvince: 'Sindh',
        postalCode: '75500',
        country: 'Pakistan',
      },
      items: [{ productId: 1, quantity: 1 }],
    } as CreatePaymentIntentDto;

    await controller.createPaymentIntent(request, dto);

    expect(createPaymentIntent).toHaveBeenCalledWith(dto, 15);
  });
});
