import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../order/order.entity';
import { PaymentStatus } from '../order/order-status.enum';

@Entity('payment_table')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Order, (order) => order.payment, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'varchar', length: 30, default: 'mock' })
  provider: string;

  @Column({
    name: 'payment_intent_id',
    type: 'varchar',
    length: 255,
    unique: true,
  })
  paymentIntentId: string;

  @Column({ name: 'charge_id', type: 'varchar', length: 255, nullable: true })
  chargeId: string | null;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'PKR' })
  currency: string;

  @Column({
    name: 'payment_method_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethodType: string | null;

  @Column({
    name: 'card_last_four',
    type: 'varchar',
    length: 4,
    nullable: true,
  })
  cardLastFour: string | null;

  @Column({ name: 'card_brand', type: 'varchar', length: 30, nullable: true })
  cardBrand: string | null;

  @Column({ name: 'is_test', type: 'boolean', default: true })
  isTest: boolean;

  @Column({ name: 'last_error', type: 'varchar', length: 500, nullable: true })
  lastError: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
