import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from '../payment/payment.entity';
import { Shipment } from '../shipment/shipment.entity';
import { OrderStatus } from './order-status.enum';
import { OrderStatusHistory } from './order-status-history.entity';

@Entity('order_table')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'order_number',
    type: 'varchar',
    length: 32,
    unique: true,
    nullable: true,
  })
  orderNumber: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'customer_full_name', type: 'varchar', length: 100 })
  customerFullName: string;

  @Column({ name: 'customer_email', type: 'varchar', length: 150 })
  customerEmail: string;

  @Column({ name: 'customer_phone', type: 'varchar', length: 30 })
  customerPhone: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 80 })
  city: string;

  @Column({ name: 'state_province', type: 'varchar', length: 80 })
  stateProvince: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20 })
  postalCode: string;

  @Column({ type: 'varchar', length: 80, default: 'Pakistan' })
  country: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

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

  @Column({ name: 'coupon_code', type: 'varchar', length: 50, nullable: true })
  couponCode: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({
    name: 'cancellation_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  cancellationReason: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancelled_by_auth_id', type: 'int', nullable: true })
  cancelledByAuthId: number | null;

  @Column({ name: 'stock_restored', type: 'boolean', default: false })
  stockRestored: boolean;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history) => history.order, {
    cascade: true,
  })
  statusHistory: OrderStatusHistory[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;

  @OneToOne(() => Shipment, (shipment) => shipment.order)
  shipment: Shipment;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
