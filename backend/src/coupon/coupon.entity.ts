import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CouponKind, CouponType } from './coupon.enums';
import { UserCoupon } from './user-coupon.entity';
import { CouponRedemption } from './coupon-redemption.entity';

@Entity('coupon_table')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({ type: 'enum', enum: CouponKind, default: CouponKind.DISCOUNT })
  kind: CouponKind;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: number;

  @Column({
    name: 'minimum_order_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  minimumOrderAmount: number;

  @Column({
    name: 'maximum_discount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  maximumDiscount: number | null;

  @Column({ name: 'starts_at', type: 'timestamp', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'usage_limit', type: 'int', nullable: true })
  usageLimit: number | null;

  @Column({ name: 'per_user_limit', type: 'int', default: 1 })
  perUserLimit: number;

  @Column({ name: 'used_count', type: 'int', default: 0 })
  usedCount: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by_auth_id', type: 'int', nullable: true })
  createdByAuthId: number | null;

  @OneToMany(() => UserCoupon, (assignment) => assignment.coupon)
  assignments: UserCoupon[];

  @OneToMany(() => CouponRedemption, (redemption) => redemption.coupon)
  redemptions: CouponRedemption[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
