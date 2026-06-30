import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CheckoutCustomerSnapshot = {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  notes?: string;
};

export type CheckoutItemSnapshot = {
  productId: number;
  productName: string;
  productImage: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

@Entity('checkout_session_table')
export class CheckoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'checkout_reference',
    type: 'varchar',
    length: 64,
    unique: true,
  })
  checkoutReference: string;

  @Column({
    name: 'payment_intent_id',
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: true,
  })
  paymentIntentId: string | null;

  @Column({ type: 'json' })
  customer: CheckoutCustomerSnapshot;

  @Column({ type: 'json' })
  items: CheckoutItemSnapshot[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({
    name: 'delivery_charge',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  deliveryCharge: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'varchar', length: 3, default: 'PKR' })
  currency: string;

  @Column({
    name: 'payment_provider',
    type: 'varchar',
    length: 30,
    default: 'stripe',
  })
  paymentProvider: string;

  @Column({ name: 'coupon_id', type: 'int', nullable: true })
  couponId: number | null;

  @Column({ name: 'coupon_code', type: 'varchar', length: 50, nullable: true })
  couponCode: string | null;

  @Column({ type: 'boolean', default: false })
  consumed: boolean;

  @Column({ name: 'stock_released', type: 'boolean', default: false })
  stockReleased: boolean;

  @Column({ name: 'order_id', type: 'int', nullable: true })
  orderId: number | null;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', type: 'timestamp', nullable: true })
  consumedAt: Date | null;

  @Column({ name: 'stock_released_at', type: 'timestamp', nullable: true })
  stockReleasedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
