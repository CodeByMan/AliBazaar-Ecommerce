import { BadRequestException } from '@nestjs/common';
import { MockPaymentProvider } from './mock-payment.provider';

describe('MockPaymentProvider', () => {
  const provider = new MockPaymentProvider();

  it('accepts the documented FYP success card without storing sensitive data', () => {
    const result = provider.authorize({
      cardNumber: '4242 4242 4242 4242',
      expiryMonth: 12,
      expiryYear: 2035,
      cvc: '123',
      cardholderName: 'Muhammad Ali Nawaz',
    });
    expect(result.lastFour).toBe('4242');
    expect(result.reference).toMatch(/^MOCK-PAY-/);
    expect(result).not.toHaveProperty('cardNumber');
    expect(result).not.toHaveProperty('cvc');
  });

  it('simulates a declined payment', () => {
    expect(() =>
      provider.authorize({
        cardNumber: '4000 0000 0000 0002',
        expiryMonth: 12,
        expiryYear: 2035,
        cvc: '123',
        cardholderName: 'Muhammad Ali Nawaz',
      }),
    ).toThrow(BadRequestException);
  });
});
