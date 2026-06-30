import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, EntityManager, In, LessThan } from 'typeorm';
import Stripe from 'stripe';
import { Cart } from '../cart/cart.entity';
import { CouponCalculation, CouponService } from '../coupon/coupon.service';
import { OrderItem } from '../order/order-item.entity';
import { OrderStatusHistory } from '../order/order-status-history.entity';
import { OrderStatus, PaymentStatus } from '../order/order-status.enum';
import { Order } from '../order/order.entity';
import { Payment } from '../payment/payment.entity';
import { MockPaymentProvider } from '../payment/providers/mock-payment.provider';
import { Product } from '../product/product.entity';
import { getProductSalePrice } from '../product/product-pricing';
import { Shipment } from '../shipment/shipment.entity';
import { User } from '../user/user.entity';
import { CheckoutSession } from './checkout-session.entity';
import { CompleteMockCheckoutDto } from './dto/complete-mock-checkout.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

interface PaymentRecordInput {
  provider: string;
  reference: string;
  chargeId: string | null;
  methodType: string;
  cardLastFour: string | null;
  cardBrand: string | null;
  isTest: boolean;
}

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private readonly stripe: Stripe | null;
  private readonly currency = 'pkr';

  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly couponService: CouponService,
    private readonly mockPaymentProvider: MockPaymentProvider,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    this.stripe = secretKey ? new Stripe(secretKey) : null;
    if (!this.stripe) {
      this.logger.warn(
        'Stripe is not configured. Mock checkout remains available when PAYMENT_PROVIDER=mock.',
      );
    }
  }

  private get stripeClient(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'Stripe is not configured. Set STRIPE_SECRET_KEY in backend/.env.',
      );
    }
    return this.stripe;
  }

  private get paymentProvider() {
    const provider = this.config
      .get<string>('PAYMENT_PROVIDER', 'mock')
      .trim()
      .toLowerCase();
    return provider === 'stripe' ? 'stripe' : 'mock';
  }

  getPublicConfig() {
    return {
      currency: 'PKR',
      country: 'Pakistan',
      paymentProvider: this.paymentProvider,
      deliveryCharge: this.deliveryCharge,
      freeDeliveryThreshold: this.freeDeliveryThreshold,
      reservationMinutes: this.reservationMinutes,
      mockPayment:
        this.paymentProvider === 'mock'
          ? {
              successCard: '4242 4242 4242 4242',
              declineCard: '4000 0000 0000 0002',
              expiry: 'Any future month and year',
              cvc: 'Any 3 or 4 digits',
            }
          : null,
    };
  }

  async completeMockCheckout(dto: CompleteMockCheckoutDto, authId: number) {
    if (this.paymentProvider !== 'mock') {
      throw new BadRequestException(
        'Mock checkout is disabled. Set PAYMENT_PROVIDER=mock for the FYP demonstration.',
      );
    }
    const customer = await this.findCustomerByAuthId(authId);
    const existing = await this.findExistingCheckout(
      dto.checkoutReference,
      customer.id,
    );
    if (existing) return existing;

    const paymentResult = this.mockPaymentProvider.authorize(dto.card);
    try {
      const orderId = await this.dataSource.transaction(
        'SERIALIZABLE',
        async (manager) => {
          const duplicate = await manager
            .getRepository(CheckoutSession)
            .findOne({
              where: { checkoutReference: dto.checkoutReference },
            });
          if (duplicate?.consumed && duplicate.orderId)
            return duplicate.orderId;
          if (duplicate) {
            throw new ConflictException(
              'This checkout request is already being processed',
            );
          }

          const prepared = await this.prepareCheckout(
            dto,
            customer,
            manager,
            false,
          );
          const order = await this.createOrderRecords(
            manager,
            customer,
            dto,
            prepared.items,
            prepared.productMap,
            prepared.subtotal,
            prepared.deliveryCharge,
            prepared.couponCalculation,
            {
              provider: 'mock',
              reference: paymentResult.reference,
              chargeId: paymentResult.chargeId,
              methodType: paymentResult.methodType,
              cardLastFour: paymentResult.lastFour,
              cardBrand: paymentResult.brand,
              isTest: true,
            },
          );

          await manager.getRepository(CheckoutSession).save(
            manager.getRepository(CheckoutSession).create({
              checkoutReference: dto.checkoutReference,
              paymentIntentId: paymentResult.reference,
              paymentProvider: 'mock',
              customer: this.customerSnapshot(customer, dto),
              items: prepared.items,
              subtotal: prepared.subtotal,
              deliveryCharge: prepared.deliveryCharge,
              discount: prepared.couponCalculation?.discount || 0,
              total: this.money(
                prepared.subtotal +
                  prepared.deliveryCharge -
                  (prepared.couponCalculation?.discount || 0),
              ),
              currency: 'PKR',
              couponId: prepared.couponCalculation?.coupon.id || null,
              couponCode: prepared.couponCalculation?.coupon.code || null,
              consumed: true,
              stockReleased: false,
              orderId: order.id,
              expiresAt: new Date(
                Date.now() + this.reservationMinutes * 60_000,
              ),
              consumedAt: new Date(),
              stockReleasedAt: null,
            }),
          );
          return order.id;
        },
      );
      return this.serializeOrder(await this.findOrderById(orderId));
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
        const completed = await this.findExistingCheckout(
          dto.checkoutReference,
          customer.id,
        );
        if (completed) return completed;
      }
      throw error;
    }
  }

  async createPaymentIntent(dto: CreatePaymentIntentDto, authId: number) {
    if (this.paymentProvider !== 'stripe') {
      throw new BadRequestException(
        'Stripe checkout is disabled. Use POST /checkout/mock or set PAYMENT_PROVIDER=stripe.',
      );
    }
    const stripe = this.stripeClient;
    const customer = await this.findCustomerByAuthId(authId);
    const existing = await this.dataSource
      .getRepository(CheckoutSession)
      .findOne({
        where: { checkoutReference: dto.checkoutReference },
      });

    if (existing) {
      if (existing.customer.userId !== customer.id) {
        throw new ConflictException(
          'This checkout reference belongs to another customer account.',
        );
      }
      if (existing.consumed && existing.orderId) {
        return {
          alreadyCompleted: true,
          order: this.serializeOrder(
            await this.findOrderById(existing.orderId),
          ),
        };
      }
      if (existing.stockReleased) {
        throw new ConflictException(
          'This checkout attempt expired. Please start checkout again.',
        );
      }
      if (existing.paymentIntentId) {
        const intent = await stripe.paymentIntents.retrieve(
          existing.paymentIntentId,
        );
        if (!intent.client_secret) {
          throw new ServiceUnavailableException(
            'Stripe did not return a client secret',
          );
        }
        return this.paymentIntentResponse(existing, intent.client_secret);
      }
    }

    let checkoutSession: CheckoutSession;
    try {
      checkoutSession = await this.dataSource.transaction(
        'SERIALIZABLE',
        async (manager) => {
          const prepared = await this.prepareCheckout(
            dto,
            customer,
            manager,
            true,
          );
          for (const item of prepared.items) {
            const product = prepared.productMap.get(item.productId)!;
            product.stock -= item.quantity;
            await manager.getRepository(Product).save(product);
          }
          return manager.getRepository(CheckoutSession).save(
            manager.getRepository(CheckoutSession).create({
              checkoutReference: dto.checkoutReference,
              paymentIntentId: null,
              paymentProvider: 'stripe',
              customer: this.customerSnapshot(customer, dto),
              items: prepared.items,
              subtotal: prepared.subtotal,
              deliveryCharge: prepared.deliveryCharge,
              discount: prepared.couponCalculation?.discount || 0,
              total: this.money(
                prepared.subtotal +
                  prepared.deliveryCharge -
                  (prepared.couponCalculation?.discount || 0),
              ),
              currency: 'PKR',
              couponId: prepared.couponCalculation?.coupon.id || null,
              couponCode: prepared.couponCalculation?.coupon.code || null,
              expiresAt: new Date(
                Date.now() + this.reservationMinutes * 60_000,
              ),
              consumed: false,
              stockReleased: false,
              orderId: null,
              consumedAt: null,
              stockReleasedAt: null,
            }),
          );
        },
      );
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'This checkout request is already being processed',
        );
      }
      throw error;
    }

    try {
      const intent = await stripe.paymentIntents.create(
        {
          amount: this.toStripeAmount(Number(checkoutSession.total)),
          currency: this.currency,
          automatic_payment_methods: { enabled: true },
          receipt_email: checkoutSession.customer.email,
          description: `AliBazaar checkout ${checkoutSession.checkoutReference}`,
          shipping: {
            name: checkoutSession.customer.fullName,
            phone: checkoutSession.customer.phone,
            address: {
              line1: checkoutSession.customer.address,
              city: checkoutSession.customer.city,
              state: checkoutSession.customer.stateProvince,
              postal_code: checkoutSession.customer.postalCode,
              country: 'PK',
            },
          },
          metadata: {
            checkout_session_id: checkoutSession.id,
            checkout_reference: checkoutSession.checkoutReference,
            customer_user_id: String(checkoutSession.customer.userId),
          },
        },
        { idempotencyKey: checkoutSession.checkoutReference },
      );
      if (!intent.client_secret) {
        throw new ServiceUnavailableException(
          'Stripe did not return a client secret',
        );
      }
      checkoutSession.paymentIntentId = intent.id;
      await this.dataSource
        .getRepository(CheckoutSession)
        .save(checkoutSession);
      return this.paymentIntentResponse(checkoutSession, intent.client_secret);
    } catch (error) {
      await this.releaseReservation(checkoutSession.id);
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error(
        'Stripe PaymentIntent creation failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException(
        'Unable to initialize payment. Please try again.',
      );
    }
  }

  async finalizePayment(paymentIntentId: string, authId?: number) {
    const intent =
      await this.stripeClient.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      throw new HttpException(
        `Payment is not complete. Current status: ${intent.status}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    const session = await this.dataSource
      .getRepository(CheckoutSession)
      .findOne({
        where: { paymentIntentId },
      });
    if (!session) throw new NotFoundException('Checkout session not found');
    if (!session.customer.userId) {
      throw new UnauthorizedException('Checkout is not linked to a customer');
    }
    if (authId !== undefined) {
      const customer = await this.findCustomerByAuthId(authId);
      if (customer.id !== session.customer.userId) {
        throw new UnauthorizedException(
          'This payment does not belong to the signed-in customer.',
        );
      }
    }
    const expectedAmount = this.toStripeAmount(Number(session.total));
    if (
      intent.amount_received !== expectedAmount ||
      intent.currency.toLowerCase() !== this.currency
    ) {
      throw new BadRequestException(
        'Payment amount or currency does not match this checkout',
      );
    }

    const orderId = await this.dataSource.transaction(
      'SERIALIZABLE',
      async (manager) => {
        const sessionRepo = manager.getRepository(CheckoutSession);
        const lockedSession = await sessionRepo
          .createQueryBuilder('session')
          .setLock('pessimistic_write')
          .where('session.id = :id', { id: session.id })
          .getOne();
        if (!lockedSession)
          throw new NotFoundException('Checkout session not found');
        if (lockedSession.consumed && lockedSession.orderId) {
          return lockedSession.orderId;
        }

        const customer = await manager.getRepository(User).findOne({
          where: { id: lockedSession.customer.userId },
          relations: ['auth'],
        });
        if (!customer)
          throw new UnauthorizedException('Customer account no longer exists');

        const productIds = lockedSession.items.map((item) => item.productId);
        const products = await manager.getRepository(Product).findBy({
          id: In(productIds),
        });
        const productMap = new Map(
          products.map((product) => [product.id, product]),
        );
        if (lockedSession.stockReleased) {
          const lockedProducts = await manager
            .getRepository(Product)
            .createQueryBuilder('product')
            .setLock('pessimistic_write')
            .where('product.id IN (:...productIds)', { productIds })
            .getMany();
          const lockedMap = new Map(
            lockedProducts.map((product) => [product.id, product]),
          );
          for (const item of lockedSession.items) {
            const product = lockedMap.get(item.productId);
            if (!product || product.stock < item.quantity) {
              throw new ConflictException(
                `Payment succeeded but ${item.productName} is no longer available. Contact support with payment ID ${paymentIntentId}.`,
              );
            }
            product.stock -= item.quantity;
            await manager.getRepository(Product).save(product);
          }
        }

        const couponCalculation = lockedSession.couponCode
          ? await this.couponService.calculateDiscount(
              lockedSession.couponCode,
              customer.id,
              Number(lockedSession.subtotal),
              manager,
              true,
            )
          : null;
        if (
          this.money(couponCalculation?.discount || 0) !==
          this.money(Number(lockedSession.discount))
        ) {
          throw new ConflictException(
            'Coupon value changed before payment completion. Contact support with the payment ID.',
          );
        }

        const chargeId =
          typeof intent.latest_charge === 'string'
            ? intent.latest_charge
            : intent.latest_charge?.id || null;
        const order = await this.createOrderRecords(
          manager,
          customer,
          {
            checkoutReference: lockedSession.checkoutReference,
            customer: lockedSession.customer,
            items: lockedSession.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            couponCode: lockedSession.couponCode || undefined,
          },
          lockedSession.items,
          productMap,
          Number(lockedSession.subtotal),
          Number(lockedSession.deliveryCharge),
          couponCalculation,
          {
            provider: 'stripe',
            reference: intent.id,
            chargeId,
            methodType: intent.payment_method_types?.[0] || 'card',
            cardLastFour: null,
            cardBrand: null,
            isTest: !this.config
              .get<string>('STRIPE_SECRET_KEY')
              ?.startsWith('sk_live_'),
          },
        );
        lockedSession.consumed = true;
        lockedSession.consumedAt = new Date();
        lockedSession.orderId = order.id;
        await sessionRepo.save(lockedSession);
        return order.id;
      },
    );
    return this.serializeOrder(await this.findOrderById(orderId));
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new InternalServerErrorException(
        'Stripe webhook is not configured',
      );
    }
    try {
      return this.stripeClient.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }
  }

  async handleWebhook(event: Stripe.Event) {
    if (event.type === 'payment_intent.succeeded') {
      await this.finalizePayment(event.data.object.id);
    }
    if (event.type === 'payment_intent.canceled') {
      const session = await this.dataSource
        .getRepository(CheckoutSession)
        .findOne({
          where: { paymentIntentId: event.data.object.id },
        });
      if (session) await this.releaseReservation(session.id);
    }
    return { received: true };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async releaseExpiredReservations() {
    const sessions = await this.dataSource.getRepository(CheckoutSession).find({
      where: {
        paymentProvider: 'stripe',
        consumed: false,
        stockReleased: false,
        expiresAt: LessThan(new Date()),
      },
      take: 100,
      order: { createdAt: 'ASC' },
    });
    for (const session of sessions) {
      try {
        if (session.paymentIntentId && this.stripe) {
          const intent = await this.stripe.paymentIntents.retrieve(
            session.paymentIntentId,
          );
          if (intent.status === 'succeeded') {
            await this.finalizePayment(intent.id);
            continue;
          }
          if (!['canceled', 'succeeded'].includes(intent.status)) {
            await this.stripe.paymentIntents
              .cancel(intent.id)
              .catch(() => undefined);
          }
        }
        await this.releaseReservation(session.id);
      } catch (error) {
        this.logger.error(
          `Failed to release checkout reservation ${session.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  private async prepareCheckout(
    dto: CreatePaymentIntentDto,
    customer: User,
    manager: EntityManager,
    lockCoupon: boolean,
  ) {
    const normalizedItems = this.normalizeItems(dto.items);
    const productIds = normalizedItems.map((item) => item.productId);
    const products = await manager
      .getRepository(Product)
      .createQueryBuilder('product')
      .setLock('pessimistic_write')
      .where('product.id IN (:...productIds)', { productIds })
      .getMany();
    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products no longer exist');
    }
    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );
    const items = normalizedItems.map(({ productId, quantity }) => {
      const product = productMap.get(productId)!;
      if (product.stock < quantity) {
        throw new BadRequestException(
          product.stock <= 0
            ? `${product.name} is out of stock`
            : `Only ${product.stock} unit(s) of ${product.name} are available`,
        );
      }
      const unitPrice = getProductSalePrice(product);
      return {
        productId: product.id,
        productName: product.name,
        productImage: product.image || null,
        unitPrice,
        quantity,
        lineTotal: this.money(unitPrice * quantity),
      };
    });
    const subtotal = this.money(
      items.reduce((sum, item) => sum + item.lineTotal, 0),
    );
    const couponCalculation = await this.couponService.calculateDiscount(
      dto.couponCode,
      customer.id,
      subtotal,
      manager,
      lockCoupon,
    );
    return {
      items,
      productMap,
      subtotal,
      deliveryCharge: this.calculateDeliveryCharge(subtotal),
      couponCalculation,
    };
  }

  private async createOrderRecords(
    manager: EntityManager,
    customer: User,
    dto: CreatePaymentIntentDto,
    items: CheckoutSession['items'],
    productMap: Map<number, Product>,
    subtotal: number,
    deliveryCharge: number,
    couponCalculation: CouponCalculation | null,
    paymentInput: PaymentRecordInput,
  ) {
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product)
        throw new NotFoundException(`${item.productName} no longer exists`);
      if (paymentInput.provider === 'mock') {
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Only ${product.stock} unit(s) of ${product.name} are available`,
          );
        }
        product.stock -= item.quantity;
        await manager.getRepository(Product).save(product);
      }
    }

    const discount = couponCalculation?.discount || 0;
    const total = this.money(subtotal + deliveryCharge - discount);
    const orderRepo = manager.getRepository(Order);
    const order = await orderRepo.save(
      orderRepo.create({
        orderNumber: null,
        user: customer,
        customerFullName: dto.customer.fullName.trim(),
        customerEmail: dto.customer.email.trim().toLowerCase(),
        customerPhone: dto.customer.phone.trim(),
        address: dto.customer.address.trim(),
        city: dto.customer.city.trim(),
        stateProvince: dto.customer.stateProvince.trim(),
        postalCode: dto.customer.postalCode.trim(),
        country: dto.customer.country.trim(),
        notes: dto.customer.notes?.trim() || null,
        subtotal,
        deliveryCharge,
        discount,
        total,
        currency: 'PKR',
        couponCode: couponCalculation?.coupon.code || null,
        status: OrderStatus.PENDING,
        cancellationReason: null,
        cancelledAt: null,
        cancelledByAuthId: null,
        stockRestored: false,
        items: [],
        statusHistory: [],
      }),
    );
    order.orderNumber = `ALI-${new Date().getFullYear()}-${String(order.id).padStart(6, '0')}`;
    await orderRepo.save(order);

    await manager.getRepository(OrderItem).save(
      items.map((item) =>
        manager.getRepository(OrderItem).create({
          order,
          product: productMap.get(item.productId) || null,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        }),
      ),
    );

    await manager.getRepository(Payment).save(
      manager.getRepository(Payment).create({
        order,
        provider: paymentInput.provider,
        paymentIntentId: paymentInput.reference,
        chargeId: paymentInput.chargeId,
        status: PaymentStatus.SUCCEEDED,
        amount: total,
        currency: 'PKR',
        paymentMethodType: paymentInput.methodType,
        cardLastFour: paymentInput.cardLastFour,
        cardBrand: paymentInput.cardBrand,
        isTest: paymentInput.isTest,
        lastError: null,
        paidAt: new Date(),
      }),
    );

    const estimatedDeliveryAt = new Date();
    estimatedDeliveryAt.setDate(
      estimatedDeliveryAt.getDate() + this.deliveryEstimateDays,
    );
    await manager.getRepository(Shipment).save(
      manager.getRepository(Shipment).create({
        order,
        address: dto.customer.address.trim(),
        city: dto.customer.city.trim(),
        state: dto.customer.stateProvince.trim(),
        country: dto.customer.country.trim(),
        zip: dto.customer.postalCode.trim(),
        status: OrderStatus.PENDING,
        estimatedDeliveryAt,
        dispatchedAt: null,
        deliveredAt: null,
      }),
    );
    await manager.getRepository(OrderStatusHistory).save(
      manager.getRepository(OrderStatusHistory).create({
        order,
        oldStatus: null,
        newStatus: OrderStatus.PENDING,
        reason: 'Order placed',
        changedByAuthId: customer.auth?.id || null,
      }),
    );
    await this.couponService.redeem(
      couponCalculation,
      customer,
      order,
      manager,
    );
    await manager.getRepository(Cart).delete({ user: { id: customer.id } });
    return order;
  }

  private customerSnapshot(customer: User, dto: CreatePaymentIntentDto) {
    return {
      userId: customer.id,
      fullName: dto.customer.fullName.trim(),
      email: dto.customer.email.trim().toLowerCase(),
      phone: dto.customer.phone.trim(),
      address: dto.customer.address.trim(),
      city: dto.customer.city.trim(),
      stateProvince: dto.customer.stateProvince.trim(),
      postalCode: dto.customer.postalCode.trim(),
      country: dto.customer.country.trim(),
      notes: dto.customer.notes?.trim() || undefined,
    };
  }

  private async findExistingCheckout(reference: string, userId: number) {
    const existing = await this.dataSource
      .getRepository(CheckoutSession)
      .findOne({
        where: { checkoutReference: reference },
      });
    if (!existing) return null;
    if (existing.customer.userId !== userId) {
      throw new ConflictException(
        'This checkout reference belongs to another customer',
      );
    }
    if (existing.consumed && existing.orderId) {
      return this.serializeOrder(await this.findOrderById(existing.orderId));
    }
    throw new ConflictException(
      'This checkout request is already being processed',
    );
  }

  private async releaseReservation(sessionId: string) {
    await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const sessionRepo = manager.getRepository(CheckoutSession);
      const session = await sessionRepo
        .createQueryBuilder('session')
        .setLock('pessimistic_write')
        .where('session.id = :sessionId', { sessionId })
        .getOne();
      if (!session || session.consumed || session.stockReleased) return;
      for (const item of session.items) {
        await manager
          .getRepository(Product)
          .increment({ id: item.productId }, 'stock', item.quantity);
      }
      session.stockReleased = true;
      session.stockReleasedAt = new Date();
      await sessionRepo.save(session);
    });
  }

  private normalizeItems(items: CreatePaymentIntentDto['items']) {
    const quantities = new Map<number, number>();
    for (const item of items) {
      quantities.set(
        item.productId,
        (quantities.get(item.productId) || 0) + item.quantity,
      );
    }
    return Array.from(quantities, ([productId, quantity]) => {
      if (quantity > 99) {
        throw new BadRequestException('Maximum quantity per product is 99');
      }
      return { productId, quantity };
    });
  }

  private paymentIntentResponse(
    session: CheckoutSession,
    clientSecret: string,
  ) {
    return {
      alreadyCompleted: false,
      clientSecret,
      paymentIntentId: session.paymentIntentId,
      expiresAt: session.expiresAt,
      breakdown: {
        subtotal: Number(session.subtotal),
        deliveryCharge: Number(session.deliveryCharge),
        discount: Number(session.discount),
        total: Number(session.total),
        currency: session.currency,
        couponCode: session.couponCode,
      },
    };
  }

  private async findCustomerByAuthId(authId: number) {
    const user = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.auth', 'auth')
      .where('auth.id = :authId', { authId })
      .andWhere('auth.isActive = :isActive', { isActive: true })
      .getOne();
    if (!user || user.auth.role !== 'user') {
      throw new UnauthorizedException(
        'A signed-in customer account is required for checkout.',
      );
    }
    return user;
  }

  private async findOrderById(id: number) {
    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id },
      relations: ['items', 'payment', 'shipment', 'statusHistory'],
      order: { statusHistory: { createdAt: 'ASC' } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private serializeOrder(order: Order) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: Number(order.subtotal),
      deliveryCharge: Number(order.deliveryCharge),
      discount: Number(order.discount),
      couponCode: order.couponCode,
      total: Number(order.total),
      currency: order.currency,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
      })),
      payment: order.payment
        ? {
            provider: order.payment.provider,
            paymentReference: order.payment.paymentIntentId,
            status: order.payment.status,
            amount: Number(order.payment.amount),
            currency: order.payment.currency,
            cardLastFour: order.payment.cardLastFour,
            cardBrand: order.payment.cardBrand,
            isTest: order.payment.isTest,
            paidAt: order.payment.paidAt,
          }
        : null,
      shipment: order.shipment
        ? {
            status: order.shipment.status,
            estimatedDeliveryAt: order.shipment.estimatedDeliveryAt,
          }
        : null,
      statusHistory: (order.statusHistory || []).map((history) => ({
        oldStatus: history.oldStatus,
        newStatus: history.newStatus,
        reason: history.reason,
        createdAt: history.createdAt,
      })),
    };
  }

  private calculateDeliveryCharge(subtotal: number) {
    if (
      this.freeDeliveryThreshold > 0 &&
      subtotal >= this.freeDeliveryThreshold
    ) {
      return 0;
    }
    return this.deliveryCharge;
  }

  private toStripeAmount(amount: number) {
    return Math.round(this.money(amount) * 100);
  }

  private money(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private get deliveryCharge() {
    return this.nonNegativeNumber('DELIVERY_CHARGE_PKR', 250);
  }

  private get freeDeliveryThreshold() {
    return this.nonNegativeNumber('FREE_DELIVERY_THRESHOLD_PKR', 5000);
  }

  private get reservationMinutes() {
    return Math.max(
      5,
      Math.floor(this.nonNegativeNumber('CHECKOUT_RESERVATION_MINUTES', 30)),
    );
  }

  private get deliveryEstimateDays() {
    return Math.max(
      1,
      Math.floor(this.nonNegativeNumber('DELIVERY_ESTIMATE_DAYS', 4)),
    );
  }

  private nonNegativeNumber(key: string, fallback: number) {
    const parsed = Number(this.config.get<string>(key) ?? fallback);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }
}
