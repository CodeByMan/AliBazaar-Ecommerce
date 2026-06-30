import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/order.entity';
import { User } from '../user/user.entity';
import { CouponController } from './coupon.controller';
import { CouponRedemption } from './coupon-redemption.entity';
import { Coupon } from './coupon.entity';
import { CouponService } from './coupon.service';
import { UserCoupon } from './user-coupon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Coupon,
      UserCoupon,
      CouponRedemption,
      User,
      Order,
    ]),
  ],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService, TypeOrmModule],
})
export class CouponModule {}
