import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../product/product.entity';
import { Shipment } from '../shipment/shipment.entity';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatusHistory } from './order-status-history.entity';
import { OrderStatus } from './order-status.enum';
import { Order } from './order.entity';

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
  [OrderStatus.DISPATCHED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepo: Repository<OrderStatusHistory>,
    private readonly dataSource: DataSource,
  ) {}

  async trackOrder(orderNumber: string) {
    const order = await this.findByOrderNumber(orderNumber);
    return this.serializeOrder(order, false);
  }

  async getUserOrders(authId: number) {
    const orders = await this.orderRepo.find({
      where: { user: { auth: { id: authId } } },
      relations: ['items', 'payment', 'shipment', 'statusHistory'],
      order: { createdAt: 'DESC', statusHistory: { createdAt: 'ASC' } },
    });
    return orders.map((order) => this.serializeOrder(order, true));
  }

  async getUserOrder(authId: number, orderNumber: string) {
    const order = await this.findByOrderNumber(orderNumber, true);
    if (order.user?.auth?.id !== authId) {
      throw new ForbiddenException(
        'This order does not belong to your account',
      );
    }
    return this.serializeOrder(order, true);
  }

  async getAdminOrders(query: AdminOrderQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const qb = this.orderRepo
      .createQueryBuilder('orders')
      .leftJoinAndSelect('orders.payment', 'payment')
      .leftJoinAndSelect('orders.shipment', 'shipment')
      .leftJoinAndSelect('orders.items', 'items')
      .leftJoinAndSelect('orders.statusHistory', 'statusHistory')
      .distinct(true)
      .orderBy('orders.createdAt', 'DESC')
      .addOrderBy('statusHistory.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        '(orders.orderNumber LIKE :search OR orders.customerFullName LIKE :search OR orders.customerEmail LIKE :search OR orders.customerPhone LIKE :search)',
        { search },
      );
    }
    if (query.status)
      qb.andWhere('orders.status = :status', { status: query.status });
    if (query.paymentStatus) {
      qb.andWhere('payment.status = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }

    const [orders, total] = await qb.getManyAndCount();
    return {
      data: orders.map((order) => this.serializeOrder(order, true)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getAdminOrder(orderNumber: string) {
    return this.serializeOrder(
      await this.findByOrderNumber(orderNumber, true),
      true,
    );
  }

  async updateStatus(
    orderNumber: string,
    dto: UpdateOrderStatusDto,
    actorAuthId: number,
  ) {
    const orderId = await this.dataSource.transaction(
      'SERIALIZABLE',
      async (manager) => {
        const orderRepo = manager.getRepository(Order);
        const order = await orderRepo
          .createQueryBuilder('orders')
          .leftJoinAndSelect('orders.items', 'items')
          .leftJoinAndSelect('orders.shipment', 'shipment')
          .leftJoinAndSelect('orders.payment', 'payment')
          .setLock('pessimistic_write')
          .where('UPPER(orders.orderNumber) = :orderNumber', {
            orderNumber: this.normalizeOrderNumber(orderNumber),
          })
          .getOne();

        if (!order) throw new NotFoundException('Order not found');
        if (order.status === dto.status) return order.id;
        const allowed = STATUS_TRANSITIONS[order.status] || [];
        if (!allowed.includes(dto.status)) {
          throw new BadRequestException(
            `Order cannot move from ${order.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`,
          );
        }
        if (dto.status === OrderStatus.CANCELLED && !dto.reason?.trim()) {
          throw new BadRequestException('Cancellation reason is required');
        }

        const oldStatus = order.status;
        order.status = dto.status;
        if (dto.status === OrderStatus.CANCELLED) {
          order.cancellationReason = dto.reason!.trim();
          order.cancelledAt = new Date();
          order.cancelledByAuthId = actorAuthId;
          if (!order.stockRestored) {
            const productRepo = manager.getRepository(Product);
            for (const item of order.items) {
              if (item.productId) {
                await productRepo.increment(
                  { id: item.productId },
                  'stock',
                  item.quantity,
                );
              }
            }
            order.stockRestored = true;
          }
        }

        if (order.shipment) {
          order.shipment.status = dto.status;
          if (dto.status === OrderStatus.DISPATCHED) {
            order.shipment.dispatchedAt = new Date();
          }
          if (dto.status === OrderStatus.DELIVERED) {
            order.shipment.deliveredAt = new Date();
          }
          await manager.getRepository(Shipment).save(order.shipment);
        }

        await orderRepo.save(order);
        await manager.getRepository(OrderStatusHistory).save(
          manager.getRepository(OrderStatusHistory).create({
            order,
            oldStatus,
            newStatus: dto.status,
            reason: dto.reason?.trim() || null,
            changedByAuthId: actorAuthId,
          }),
        );
        return order.id;
      },
    );

    const updated = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: [
        'items',
        'payment',
        'shipment',
        'statusHistory',
        'user',
        'user.auth',
      ],
    });
    if (!updated) throw new NotFoundException('Order not found');
    return this.serializeOrder(updated, true);
  }

  async addInitialHistory(order: Order, manager = this.dataSource.manager) {
    await manager.getRepository(OrderStatusHistory).save(
      manager.getRepository(OrderStatusHistory).create({
        order,
        oldStatus: null,
        newStatus: OrderStatus.PENDING,
        reason: 'Order placed',
        changedByAuthId: order.user?.auth?.id || null,
      }),
    );
  }

  private async findByOrderNumber(orderNumber: string, includeUser = false) {
    const normalized = this.normalizeOrderNumber(orderNumber);
    const relations = [
      'items',
      'payment',
      'shipment',
      'statusHistory',
      ...(includeUser ? ['user', 'user.auth'] : []),
    ];
    const order = await this.orderRepo.findOne({
      where: { orderNumber: normalized },
      relations,
      order: { statusHistory: { createdAt: 'ASC' } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private normalizeOrderNumber(orderNumber: string) {
    const normalized = orderNumber.trim().toUpperCase();
    if (!/^ALI-\d{4}-\d{6,}$/.test(normalized)) {
      throw new BadRequestException(
        'Enter a valid order ID, for example ALI-2026-000001',
      );
    }
    return normalized;
  }

  private serializeOrder(order: Order, includeSensitive: boolean) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        fullName: order.customerFullName,
        email: includeSensitive
          ? order.customerEmail
          : this.maskEmail(order.customerEmail),
        phone: includeSensitive
          ? order.customerPhone
          : this.maskPhone(order.customerPhone),
      },
      delivery: {
        address: includeSensitive
          ? order.address
          : this.maskAddress(order.address),
        city: order.city,
        province: order.stateProvince,
        postalCode: order.postalCode,
        country: order.country,
        notes: includeSensitive ? order.notes : undefined,
        estimatedDeliveryAt: order.shipment?.estimatedDeliveryAt || null,
        dispatchedAt: order.shipment?.dispatchedAt || null,
        deliveredAt: order.shipment?.deliveredAt || null,
      },
      status: order.status,
      availableTransitions: STATUS_TRANSITIONS[order.status] || [],
      cancellationReason: order.cancellationReason,
      cancelledAt: order.cancelledAt,
      subtotal: Number(order.subtotal),
      deliveryCharge: Number(order.deliveryCharge),
      discount: Number(order.discount),
      couponCode: order.couponCode,
      total: Number(order.total),
      currency: order.currency,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      statusHistory: (order.statusHistory || []).map((history) => ({
        id: history.id,
        oldStatus: history.oldStatus,
        newStatus: history.newStatus,
        reason: history.reason,
        createdAt: history.createdAt,
      })),
      items: (order.items || []).map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
        canReview: order.status === OrderStatus.DELIVERED,
      })),
      payment: order.payment
        ? {
            provider: order.payment.provider,
            status: order.payment.status,
            amount: Number(order.payment.amount),
            currency: order.payment.currency,
            paymentReference: includeSensitive
              ? order.payment.paymentIntentId
              : undefined,
            paymentMethodType: order.payment.paymentMethodType,
            cardLastFour: order.payment.cardLastFour,
            cardBrand: order.payment.cardBrand,
            isTest: order.payment.isTest,
            paidAt: order.payment.paidAt,
          }
        : null,
    };
  }

  private maskEmail(value: string) {
    const [name, domain] = value.split('@');
    if (!domain) return '***';
    return `${name.slice(0, 2)}***@${domain}`;
  }

  private maskPhone(value: string) {
    const compact = value.replace(/\s/g, '');
    if (compact.length <= 4) return '****';
    return `${'*'.repeat(Math.max(4, compact.length - 4))}${compact.slice(-4)}`;
  }

  private maskAddress(value: string) {
    const parts = value.trim().split(/\s+/);
    if (parts.length <= 2) return 'Address on file';
    return `${parts.slice(0, 2).join(' ')} •••`;
  }
}
