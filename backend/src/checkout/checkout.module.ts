import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../cart/cart.entity';
import { CouponModule } from '../coupon/coupon.module';
import { OrderItem } from '../order/order-item.entity';
import { OrderStatusHistory } from '../order/order-status-history.entity';
import { Order } from '../order/order.entity';
import { Payment } from '../payment/payment.entity';
import { MockPaymentProvider } from '../payment/providers/mock-payment.provider';
import { Product } from '../product/product.entity';
import { Shipment } from '../shipment/shipment.entity';
import { User } from '../user/user.entity';
import { CheckoutSession } from './checkout-session.entity';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CheckoutSession,
      Product,
      Order,
      OrderItem,
      OrderStatusHistory,
      Payment,
      Shipment,
      User,
      Cart,
    ]),
    CouponModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService, MockPaymentProvider],
  exports: [CheckoutService],
})
export class CheckoutModule {}
