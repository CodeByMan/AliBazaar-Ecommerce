import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { Auth } from '../auth/auth.entity';
import { Cart } from '../cart/cart.entity';
import { Order } from '../order/order.entity';
import { Review } from '../review/review.entity';
import { Role } from '../role/role.entity';
import { WishList } from '../wishlist/wishlist.entity';
import { removeStoredImage } from '../common/uploads/image-upload';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateManagedUserDto } from './dto/update-managed-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Auth)
    private readonly authRepo: Repository<Auth>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async getUsers(search?: string) {
    const query = this.authRepo
      .createQueryBuilder('auth')
      .leftJoinAndSelect('auth.user', 'user')
      .orderBy('auth.id', 'ASC');
    if (search?.trim()) {
      query.where(
        '(auth.username LIKE :search OR auth.role LIKE :search OR user.name LIKE :search OR user.email LIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }
    const accounts = await query.getMany();
    return accounts.map((auth) => this.serializeManagedAccount(auth));
  }

  async getUserOrderDetails(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['auth'],
    });
    if (!user) throw new NotFoundException('User not found');

    const [orders, reviews] = await Promise.all([
      this.orderRepo.find({
        where: { user: { id: userId } },
        relations: ['items', 'payment', 'shipment', 'statusHistory'],
        order: { createdAt: 'DESC' },
      }),
      this.reviewRepo.find({
        where: { user: { id: userId } },
        relations: ['product', 'orderItem'],
      }),
    ]);

    return {
      user: this.serializeManagedAccount(user.auth),
      orders: orders.map((order) => ({
        ...order,
        subtotal: Number(order.subtotal),
        deliveryCharge: Number(order.deliveryCharge),
        discount: Number(order.discount),
        total: Number(order.total),
        items: order.items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
        })),
        payment: order.payment
          ? { ...order.payment, amount: Number(order.payment.amount) }
          : null,
      })),
      reviews,
    };
  }

  async createManagedUser(dto: CreateManagedUserDto) {
    const role = await this.requireAssignableRole(dto.role);
    const username = dto.username.trim();
    const email = dto.email.trim().toLowerCase();
    await this.ensureUnique(username, email);

    return this.dataSource.transaction(async (manager) => {
      const authRepo = manager.getRepository(Auth);
      const userRepo = manager.getRepository(User);
      const auth = await authRepo.save(
        authRepo.create({
          username,
          password: await bcrypt.hash(dto.password, 12),
          role: role.name,
          isActive: true,
        }),
      );
      const user = await userRepo.save(
        userRepo.create({
          name: dto.name.trim(),
          email,
          phone: dto.phone.trim(),
          age: dto.age,
          auth,
        }),
      );
      auth.user = user;
      return this.serializeManagedAccount(auth);
    });
  }

  async updateManagedUser(userId: number, dto: UpdateManagedUserDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['auth'],
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.auth.role === 'admin') {
      throw new BadRequestException(
        'The seeded administrator cannot be edited here',
      );
    }

    if (dto.username && dto.username.trim() !== user.auth.username) {
      const existing = await this.authRepo.findOne({
        where: { username: dto.username.trim() },
      });
      if (existing) throw new ConflictException('Username already exists');
      user.auth.username = dto.username.trim();
    }
    if (dto.email && dto.email.trim().toLowerCase() !== user.email) {
      const existing = await this.userRepo.findOne({
        where: { email: dto.email.trim().toLowerCase() },
      });
      if (existing) throw new ConflictException('Email already exists');
      user.email = dto.email.trim().toLowerCase();
    }
    if (dto.role)
      user.auth.role = (await this.requireAssignableRole(dto.role)).name;
    if (dto.password) user.auth.password = await bcrypt.hash(dto.password, 12);
    if (dto.isActive !== undefined) user.auth.isActive = dto.isActive;
    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.phone !== undefined) user.phone = dto.phone.trim();
    if (dto.age !== undefined) user.age = dto.age;

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Auth).save(user.auth);
      await manager.getRepository(User).save(user);
    });
    return this.serializeManagedAccount(user.auth);
  }

  async deleteManagedUser(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['auth'],
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.auth.role === 'admin') {
      throw new BadRequestException(
        'The seeded administrator cannot be deleted',
      );
    }

    const orderCount = await this.orderRepo.count({
      where: { user: { id: user.id } },
    });
    if (orderCount > 0) {
      user.auth.isActive = false;
      await this.authRepo.save(user.auth);
      return {
        message:
          'User has order history and was disabled instead of permanently deleted',
        archived: true,
      };
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Cart).delete({ user: { id: user.id } });
      await manager.getRepository(WishList).delete({ user: { id: user.id } });
      await manager.getRepository(Review).delete({ user: { id: user.id } });
      await manager.getRepository(User).remove(user);
      await manager.getRepository(Auth).delete(user.auth.id);
    });
    await removeStoredImage(user.profileImage);
    return { message: 'User deleted successfully', archived: false };
  }

  async checkUsernameAvailability(username: string) {
    const normalized = username.trim();
    if (normalized.length < 3) {
      return { username: normalized, available: false };
    }
    const existing = await this.authRepo.findOne({
      where: { username: normalized },
      select: { id: true },
    });
    return { username: normalized, available: !existing };
  }

  async register(body: RegisterUserDto) {
    await this.ensureSystemRole('user');
    const username = body.username.trim();
    const email = body.email.trim().toLowerCase();
    await this.ensureUnique(username, email);

    const auth = await this.authRepo.save(
      this.authRepo.create({
        username,
        password: await bcrypt.hash(body.password, 12),
        role: 'user',
        isActive: true,
      }),
    );

    try {
      const user = await this.userRepo.save(
        this.userRepo.create({
          name: body.name.trim(),
          email,
          phone: body.phone.trim(),
          age: body.age,
          auth,
        }),
      );
      const token = this.jwtService.sign({
        id: auth.id,
        username: auth.username,
        role: auth.role,
      });
      return {
        message: 'Account created successfully',
        token,
        role: auth.role,
        username: auth.username,
        user: this.serializeCustomer(user, auth),
      };
    } catch (error) {
      await this.authRepo.delete(auth.id);
      throw error;
    }
  }

  async getProfile(authId: number) {
    const user = await this.userRepo.findOne({
      where: { auth: { id: authId } },
      relations: ['auth'],
    });
    if (!user) throw new UnauthorizedException('User not found');
    return this.serializeCustomer(user, user.auth);
  }

  async updateProfile(
    authId: number,
    updateData: UpdateProfileDto,
    profileImage?: string,
  ) {
    const user = await this.userRepo.findOne({
      where: { auth: { id: authId } },
      relations: ['auth'],
    });
    if (!user) throw new UnauthorizedException('User not found');

    if (updateData.email && updateData.email.toLowerCase() !== user.email) {
      const existingEmail = await this.userRepo.findOne({
        where: { email: updateData.email.toLowerCase() },
      });
      if (existingEmail) throw new ConflictException('Email already exists');
    }
    if (updateData.username && updateData.username !== user.auth.username) {
      const existingUsername = await this.authRepo.findOne({
        where: { username: updateData.username },
      });
      if (existingUsername)
        throw new ConflictException('Username already exists');
      user.auth.username = updateData.username.trim();
      await this.authRepo.save(user.auth);
    }

    const previousImage = user.profileImage;
    if (updateData.name !== undefined) user.name = updateData.name.trim();
    if (updateData.email !== undefined)
      user.email = updateData.email.trim().toLowerCase();
    if (updateData.phone !== undefined) user.phone = updateData.phone.trim();
    if (updateData.age !== undefined) user.age = updateData.age;
    if (profileImage) user.profileImage = profileImage;
    await this.userRepo.save(user);
    if (profileImage && previousImage !== profileImage) {
      await removeStoredImage(previousImage);
    }
    return this.serializeCustomer(user, user.auth);
  }

  async resetProfileImage(authId: number) {
    const user = await this.userRepo.findOne({
      where: { auth: { id: authId } },
      relations: ['auth'],
    });
    if (!user) throw new UnauthorizedException('User not found');
    const previousImage = user.profileImage;
    user.profileImage = 'defaults/user-avatar.svg';
    await this.userRepo.save(user);
    await removeStoredImage(previousImage);
    return this.serializeCustomer(user, user.auth);
  }

  async changePassword(
    authId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }
    const user = await this.userRepo.findOne({
      where: { auth: { id: authId } },
      relations: ['auth'],
    });
    if (!user) throw new UnauthorizedException('User not found');
    const valid = await bcrypt.compare(currentPassword, user.auth.password);
    if (!valid)
      throw new UnauthorizedException('Current password is incorrect');
    user.auth.password = await bcrypt.hash(newPassword, 12);
    await this.authRepo.save(user.auth);
    return { message: 'Password changed successfully' };
  }

  private async requireAssignableRole(roleName: string) {
    const name = roleName.trim().toLowerCase();
    if (name === 'admin') {
      throw new BadRequestException(
        'Only the seeded administrator can use the admin role',
      );
    }
    const role = await this.roleRepo.findOne({
      where: { name, isActive: true },
    });
    if (!role) throw new BadRequestException('Selected role is not available');
    return role;
  }

  private async ensureSystemRole(name: string) {
    const role = await this.roleRepo.findOne({
      where: { name, isActive: true },
    });
    if (!role)
      throw new BadRequestException(
        `Required system role ${name} is unavailable`,
      );
  }

  private async ensureUnique(username: string, email: string) {
    const [existingAuth, existingUser] = await Promise.all([
      this.authRepo.findOne({ where: { username } }),
      this.userRepo.findOne({ where: { email } }),
    ]);
    if (existingAuth) throw new ConflictException('Username already exists');
    if (existingUser) throw new ConflictException('Email already exists');
  }

  private serializeCustomer(user: User, auth: Auth) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      age: user.age,
      username: auth.username,
      role: auth.role,
      isActive: auth.isActive,
      profileImage: user.profileImage || 'defaults/user-avatar.svg',
    };
  }

  private serializeManagedAccount(auth: Auth) {
    const profile = auth.user
      ? {
          id: auth.user.id,
          name: auth.user.name,
          email: auth.user.email,
          phone: auth.user.phone,
          age: auth.user.age,
          profileImage: auth.user.profileImage || 'defaults/user-avatar.svg',
        }
      : null;

    return {
      // Flat profile fields preserve compatibility with the existing dashboard.
      id: profile?.id ?? null,
      name: profile?.name ?? auth.username,
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      age: profile?.age ?? null,
      profileImage: profile?.profileImage ?? 'defaults/user-avatar.svg',
      auth: {
        id: auth.id,
        username: auth.username,
        role: auth.role,
        isActive: auth.isActive,
      },
      // Explicit account fields support the expanded role/user management UI.
      authId: auth.id,
      username: auth.username,
      role: auth.role,
      isActive: auth.isActive,
      createdAt: auth.createdAt,
      user: profile,
    };
  }
}
