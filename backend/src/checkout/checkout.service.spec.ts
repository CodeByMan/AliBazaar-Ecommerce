import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { DataSource } from 'typeorm';
import type { CouponService } from '../coupon/coupon.service';
import { MockPaymentProvider } from '../payment/providers/mock-payment.provider';
import { CheckoutService } from './checkout.service';
import type { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

const dto = {
  checkoutReference: '7d901759-b8f1-4461-a3fe-3138d8bce091',
  customer: {
    fullName: 'Muhammad Ali Nawaz',
    email: 'muhammad@example.com',
    phone: '+923001234567',
    address: '12 Main Boulevard',
    city: 'Karachi',
    stateProvince: 'Sindh',
    postalCode: '75500',
    country: 'Pakistan',
  },
  items: [{ productId: 1, quantity: 1 }],
} as CreatePaymentIntentDto;

describe('CheckoutService configuration', () => {
  it('defaults to mock checkout for the FYP', () => {
    const config = {
      get: jest.fn((_key: string, fallback?: string) => fallback),
    } as unknown as ConfigService;
    const service = new CheckoutService(
      config,
      {} as DataSource,
      {} as CouponService,
      new MockPaymentProvider(),
    );
    expect(service.getPublicConfig()).toEqual(
      expect.objectContaining({
        currency: 'PKR',
        country: 'Pakistan',
        paymentProvider: 'mock',
      }),
    );
  });

  it('rejects Stripe endpoint while mock provider is selected', async () => {
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'PAYMENT_PROVIDER') return 'mock';
        return fallback;
      }),
    } as unknown as ConfigService;
    const service = new CheckoutService(
      config,
      {} as DataSource,
      {} as CouponService,
      new MockPaymentProvider(),
    );
    await expect(service.createPaymentIntent(dto, 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('requires a Stripe key when stripe provider is selected', async () => {
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'PAYMENT_PROVIDER') return 'stripe';
        if (key === 'STRIPE_SECRET_KEY') return undefined;
        return fallback;
      }),
    } as unknown as ConfigService;
    const service = new CheckoutService(
      config,
      {} as DataSource,
      {} as CouponService,
      new MockPaymentProvider(),
    );
    await expect(service.createPaymentIntent(dto, 1)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
