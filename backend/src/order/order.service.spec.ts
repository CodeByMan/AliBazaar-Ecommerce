import { BadRequestException } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import type { OrderStatusHistory } from './order-status-history.entity';
import { OrderStatus, PaymentStatus } from './order-status.enum';
import type { Order } from './order.entity';
import { OrderService } from './order.service';

function createOrder(): Order {
  return {
    id: 1,
    orderNumber: 'ALI-2026-000001',
    user: null,
    customerFullName: 'Muhammad Ali Nawaz',
    customerEmail: 'muhammad@example.com',
    customerPhone: '+923001234567',
    address: '12 Main Boulevard Lahore',
    city: 'Lahore',
    stateProvince: 'Punjab',
    postalCode: '54000',
    country: 'Pakistan',
    notes: null,
    subtotal: 2500,
    deliveryCharge: 250,
    discount: 0,
    total: 2750,
    currency: 'PKR',
    couponCode: null,
    status: OrderStatus.DISPATCHED,
    cancellationReason: null,
    cancelledAt: null,
    cancelledByAuthId: null,
    stockRestored: false,
    createdAt: new Date('2026-06-28T00:00:00.000Z'),
    updatedAt: new Date('2026-06-28T00:00:00.000Z'),
    statusHistory: [],
    items: [
      {
        id: 1,
        productId: 7,
        productName: 'Test Product',
        productImage: 'test.jpg',
        unitPrice: 2500,
        quantity: 1,
        lineTotal: 2500,
      },
    ],
    payment: {
      id: 1,
      provider: 'mock',
      status: PaymentStatus.SUCCEEDED,
      amount: 2750,
      currency: 'PKR',
      paymentIntentId: 'MOCK-PAY-1',
      chargeId: 'MOCK-CH-1',
      paymentMethodType: 'card',
      cardLastFour: '4242',
      cardBrand: 'Visa Test',
      isTest: true,
      lastError: null,
      paidAt: new Date('2026-06-28T00:00:00.000Z'),
      createdAt: new Date('2026-06-28T00:00:00.000Z'),
      updatedAt: new Date('2026-06-28T00:00:00.000Z'),
    },
    shipment: {
      id: 1,
      status: OrderStatus.DISPATCHED,
      estimatedDeliveryAt: new Date('2026-07-02T00:00:00.000Z'),
      dispatchedAt: new Date('2026-06-29T00:00:00.000Z'),
      deliveredAt: null,
      createdAt: new Date('2026-06-28T00:00:00.000Z'),
      updatedAt: new Date('2026-06-28T00:00:00.000Z'),
    },
  } as unknown as Order;
}

describe('OrderService tracking', () => {
  it('rejects malformed order IDs before querying the database', async () => {
    const findOne = jest.fn();
    const service = new OrderService(
      { findOne } as unknown as Repository<Order>,
      {} as Repository<OrderStatusHistory>,
      {} as DataSource,
    );

    await expect(service.trackOrder('not-an-order')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(findOne).not.toHaveBeenCalled();
  });

  it('returns masked public tracking details', async () => {
    const order = createOrder();
    const repository = {
      findOne: jest.fn().mockResolvedValue(order),
    } as unknown as Repository<Order>;
    const service = new OrderService(
      repository,
      {} as Repository<OrderStatusHistory>,
      {} as DataSource,
    );

    const result = await service.trackOrder('ali-2026-000001');

    expect(result.orderNumber).toBe('ALI-2026-000001');
    expect(result.customer.phone).toBe('*********4567');
    expect(result.delivery.address).toBe('12 Main •••');
    expect(result.payment?.status).toBe(PaymentStatus.SUCCEEDED);
    expect(result.total).toBe(2750);
  });
});
