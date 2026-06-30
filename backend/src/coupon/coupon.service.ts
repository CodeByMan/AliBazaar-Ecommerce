import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import { Order } from '../order/order.entity';
import { User } from '../user/user.entity';
import { AssignCompensationDto } from './dto/assign-compensation.dto';
import { CreateCompensationDto } from './dto/create-compensation.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponRedemption } from './coupon-redemption.entity';
import { Coupon } from './coupon.entity';
import { CouponKind, CouponType } from './coupon.enums';
import { UserCoupon } from './user-coupon.entity';

export interface CouponCalculation {
  coupon: Coupon;
  discount: number;
  assignment: UserCoupon | null;
}

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
    @InjectRepository(UserCoupon)
    private readonly userCouponRepo: Repository<UserCoupon>,
    @InjectRepository(CouponRedemption)
    private readonly redemptionRepo: Repository<CouponRedemption>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async listAdmin() {
    return this.couponRepo.find({
      relations: ['assignments', 'assignments.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateCouponDto, authId: number) {
    this.validateValue(dto.type, dto.value);
    this.validateDates(dto.startsAt, dto.expiresAt);
    const code = await this.uniqueCode(
      dto.code,
      dto.kind || CouponKind.DISCOUNT,
    );
    return this.couponRepo.save(
      this.couponRepo.create({
        code,
        type: dto.type,
        kind: dto.kind || CouponKind.DISCOUNT,
        value: this.money(dto.value),
        minimumOrderAmount: this.money(dto.minimumOrderAmount || 0),
        maximumDiscount:
          dto.maximumDiscount !== undefined
            ? this.money(dto.maximumDiscount)
            : null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        usageLimit: dto.usageLimit || null,
        perUserLimit: dto.perUserLimit || 1,
        usedCount: 0,
        isActive: true,
        createdByAuthId: authId,
      }),
    );
  }

  async update(id: number, dto: UpdateCouponDto) {
    const coupon = await this.getById(id);
    const nextValue = dto.value ?? Number(coupon.value);
    this.validateValue(coupon.type, nextValue);
    this.validateDates(
      dto.startsAt === null
        ? undefined
        : dto.startsAt || coupon.startsAt?.toISOString(),
      dto.expiresAt === null
        ? undefined
        : dto.expiresAt || coupon.expiresAt?.toISOString(),
    );

    if (dto.value !== undefined) coupon.value = this.money(dto.value);
    if (dto.minimumOrderAmount !== undefined) {
      coupon.minimumOrderAmount = this.money(dto.minimumOrderAmount);
    }
    if (dto.maximumDiscount !== undefined) {
      coupon.maximumDiscount =
        dto.maximumDiscount === null ? null : this.money(dto.maximumDiscount);
    }
    if (dto.startsAt !== undefined) {
      coupon.startsAt = dto.startsAt === null ? null : new Date(dto.startsAt);
    }
    if (dto.expiresAt !== undefined) {
      coupon.expiresAt =
        dto.expiresAt === null ? null : new Date(dto.expiresAt);
    }
    if (dto.usageLimit !== undefined) coupon.usageLimit = dto.usageLimit;
    if (dto.perUserLimit !== undefined) coupon.perUserLimit = dto.perUserLimit;
    if (dto.isActive !== undefined) coupon.isActive = dto.isActive;
    return this.couponRepo.save(coupon);
  }

  async remove(id: number) {
    const coupon = await this.getById(id);
    const [assignments, redemptions] = await Promise.all([
      this.userCouponRepo.count({ where: { coupon: { id } } }),
      this.redemptionRepo.count({ where: { coupon: { id } } }),
    ]);
    if (assignments > 0 || redemptions > 0) {
      coupon.isActive = false;
      await this.couponRepo.save(coupon);
      return {
        message: 'Coupon has history and was disabled instead of deleted',
      };
    }
    await this.couponRepo.remove(coupon);
    return { message: 'Coupon deleted successfully' };
  }

  async assignCompensation(
    couponId: number,
    dto: AssignCompensationDto,
    authId: number,
  ) {
    const [coupon, user] = await Promise.all([
      this.getById(couponId),
      this.userRepo.findOne({ where: { id: dto.userId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (coupon.kind !== CouponKind.COMPENSATION) {
      throw new BadRequestException(
        'Only compensation coupons can be assigned to a specific customer',
      );
    }
    const existing = await this.userCouponRepo.findOne({
      where: { coupon: { id: coupon.id }, user: { id: user.id } },
    });
    if (existing) throw new ConflictException('Coupon is already assigned');

    const sourceOrder = dto.sourceOrderId
      ? await this.orderRepo.findOne({ where: { id: dto.sourceOrderId } })
      : null;
    if (dto.sourceOrderId && !sourceOrder) {
      throw new NotFoundException('Source order not found');
    }

    return this.userCouponRepo.save(
      this.userCouponRepo.create({
        coupon,
        user,
        sourceOrder,
        reason: dto.reason.trim(),
        assignedByAuthId: authId,
        usedAt: null,
      }),
    );
  }

  async createCompensation(dto: CreateCompensationDto, authId: number) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (dto.expiresInDays || 60));
    const coupon = await this.create(
      {
        type: CouponType.FIXED,
        kind: CouponKind.COMPENSATION,
        value: dto.amount,
        minimumOrderAmount: 0,
        usageLimit: 1,
        perUserLimit: 1,
        expiresAt: expiresAt.toISOString(),
      },
      authId,
    );
    const assignment = await this.assignCompensation(
      coupon.id,
      {
        userId: dto.userId,
        sourceOrderId: dto.sourceOrderId,
        reason: dto.reason,
      },
      authId,
    );
    return { coupon, assignment };
  }

  async listForCustomer(authId: number) {
    const user = await this.findUserByAuthId(authId);
    const assignments = await this.userCouponRepo.find({
      where: { user: { id: user.id } },
      relations: ['coupon', 'sourceOrder'],
      order: { createdAt: 'DESC' },
    });
    return assignments.map((assignment) => ({
      id: assignment.id,
      code: assignment.coupon.code,
      type: assignment.coupon.type,
      value: Number(assignment.coupon.value),
      minimumOrderAmount: Number(assignment.coupon.minimumOrderAmount),
      maximumDiscount:
        assignment.coupon.maximumDiscount === null
          ? null
          : Number(assignment.coupon.maximumDiscount),
      expiresAt: assignment.coupon.expiresAt,
      isActive: assignment.coupon.isActive,
      usedAt: assignment.usedAt,
      reason: assignment.reason,
      sourceOrderNumber: assignment.sourceOrder?.orderNumber || null,
    }));
  }

  async validateForCustomer(authId: number, code: string, subtotal: number) {
    const user = await this.findUserByAuthId(authId);
    const result = await this.calculateDiscount(code, user.id, subtotal);
    if (!result) throw new BadRequestException('Coupon code is required');
    return {
      valid: true,
      code: result.coupon.code,
      discount: result.discount,
      totalAfterDiscount: this.money(Math.max(0, subtotal - result.discount)),
      type: result.coupon.type,
      kind: result.coupon.kind,
    };
  }

  async calculateDiscount(
    code: string | undefined,
    userId: number,
    subtotal: number,
    manager?: EntityManager,
    lock = false,
  ): Promise<CouponCalculation | null> {
    if (!code?.trim()) return null;
    const normalizedCode = code.trim().toUpperCase();
    const couponRepository = manager
      ? manager.getRepository(Coupon)
      : this.couponRepo;
    let query = couponRepository
      .createQueryBuilder('coupon')
      .where('UPPER(coupon.code) = :code', { code: normalizedCode });
    if (lock) query = query.setLock('pessimistic_write');
    const coupon = await query.getOne();
    if (!coupon) throw new NotFoundException('Coupon not found');

    const now = new Date();
    if (!coupon.isActive) throw new BadRequestException('Coupon is inactive');
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException('Coupon is not active yet');
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestException('Coupon has expired');
    }
    if (subtotal < Number(coupon.minimumOrderAmount)) {
      throw new BadRequestException(
        `Minimum order amount is PKR ${Number(coupon.minimumOrderAmount).toFixed(2)}`,
      );
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit has been reached');
    }

    const redemptionRepository = manager
      ? manager.getRepository(CouponRedemption)
      : this.redemptionRepo;
    const customerUsage = await redemptionRepository.count({
      where: { coupon: { id: coupon.id }, user: { id: userId } },
    });
    if (customerUsage >= coupon.perUserLimit) {
      throw new BadRequestException('You have already used this coupon');
    }

    const assignmentRepository = manager
      ? manager.getRepository(UserCoupon)
      : this.userCouponRepo;
    let assignment: UserCoupon | null = null;
    if (coupon.kind === CouponKind.COMPENSATION) {
      assignment = await assignmentRepository.findOne({
        where: { coupon: { id: coupon.id }, user: { id: userId } },
      });
      if (!assignment) {
        throw new BadRequestException(
          'This compensation coupon is not assigned to you',
        );
      }
      if (assignment.usedAt) {
        throw new BadRequestException(
          'This compensation coupon has already been used',
        );
      }
    }

    let discount =
      coupon.type === CouponType.PERCENTAGE
        ? (subtotal * Number(coupon.value)) / 100
        : Number(coupon.value);
    if (coupon.maximumDiscount !== null) {
      discount = Math.min(discount, Number(coupon.maximumDiscount));
    }
    discount = this.money(Math.min(discount, subtotal));
    return { coupon, discount, assignment };
  }

  async redeem(
    calculation: CouponCalculation | null,
    user: User,
    order: Order,
    manager: EntityManager,
  ) {
    if (!calculation) return;
    const couponRepo = manager.getRepository(Coupon);
    const redemptionRepo = manager.getRepository(CouponRedemption);
    const assignmentRepo = manager.getRepository(UserCoupon);

    calculation.coupon.usedCount += 1;
    await couponRepo.save(calculation.coupon);
    await redemptionRepo.save(
      redemptionRepo.create({
        coupon: calculation.coupon,
        user,
        order,
        discountAmount: calculation.discount,
      }),
    );
    if (calculation.assignment) {
      calculation.assignment.usedAt = new Date();
      await assignmentRepo.save(calculation.assignment);
    }
  }

  private async getById(id: number) {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  private async findUserByAuthId(authId: number) {
    const user = await this.userRepo.findOne({
      where: { auth: { id: authId } },
    });
    if (!user) throw new NotFoundException('Customer account not found');
    return user;
  }

  private async uniqueCode(requested: string | undefined, kind: CouponKind) {
    if (requested) {
      const code = requested.trim().toUpperCase();
      const existing = await this.couponRepo.findOne({ where: { code } });
      if (existing) throw new ConflictException('Coupon code already exists');
      return code;
    }
    const prefix = kind === CouponKind.COMPENSATION ? 'COMP' : 'ALI';
    while (true) {
      const code = `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`;
      const existing = await this.couponRepo.findOne({ where: { code } });
      if (!existing) return code;
    }
  }

  private validateValue(type: CouponType, value: number) {
    if (type === CouponType.PERCENTAGE && value > 100) {
      throw new BadRequestException('Percentage coupon cannot exceed 100');
    }
  }

  private validateDates(startsAt?: string, expiresAt?: string) {
    if (startsAt && expiresAt && new Date(startsAt) >= new Date(expiresAt)) {
      throw new BadRequestException(
        'Coupon expiry must be after its start date',
      );
    }
  }

  private money(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
