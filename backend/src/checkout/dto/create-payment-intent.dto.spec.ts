import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePaymentIntentDto } from './create-payment-intent.dto';

describe('CreatePaymentIntentDto', () => {
  it('accepts a valid Pakistan checkout request', async () => {
    const dto = plainToInstance(CreatePaymentIntentDto, {
      checkoutReference: '7d901759-b8f1-4461-a3fe-3138d8bce091',
      items: [{ productId: 1, quantity: 2 }],
      customer: {
        fullName: 'Muhammad Ali Nawaz',
        email: 'muhammad@example.com',
        phone: '+923001234567',
        address: '12 Main Boulevard, Lahore',
        city: 'Lahore',
        stateProvince: 'Punjab',
        postalCode: '54000',
        country: 'Pakistan',
      },
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid quantities and customer details', async () => {
    const dto = plainToInstance(CreatePaymentIntentDto, {
      checkoutReference: 'invalid',
      items: [{ productId: 0, quantity: 100 }],
      customer: {
        fullName: '',
        email: 'invalid',
        phone: '1',
        address: 'x',
        city: '',
        stateProvince: '',
        postalCode: '?',
        country: '',
      },
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
