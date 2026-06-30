import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request';
import { Payment } from './payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async getPaymentByOrderId(orderId: number, account: AuthenticatedUser) {
    const payment = await this.paymentRepo.findOne({
      where: { order: { id: orderId } },
      relations: ['order', 'order.user', 'order.user.auth'],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    const ownsOrder = payment.order.user?.auth?.id === account.id;
    if (account.role !== 'admin' && !ownsOrder) {
      throw new ForbiddenException('You cannot view this payment');
    }
    return {
      id: payment.id,
      provider: payment.provider,
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentMethodType: payment.paymentMethodType,
      cardLastFour: payment.cardLastFour,
      cardBrand: payment.cardBrand,
      isTest: payment.isTest,
      paidAt: payment.paidAt,
    };
  }
}
