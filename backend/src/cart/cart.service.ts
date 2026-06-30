import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../product/product.entity';
import { getProductSalePrice } from '../product/product-pricing';
import { User } from '../user/user.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async addToCart(userId: number, productId: number, quantity = 1) {
    this.validateQuantity(quantity);
    const user = await this.userRepo.findOne({
      where: { auth: { id: userId } },
    });
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!user || !product)
      throw new NotFoundException('User or product not found');
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Only ${product.stock} unit(s) are available`,
      );
    }

    const existing = await this.cartRepo.findOne({
      where: { user: { auth: { id: userId } }, product: { id: productId } },
      relations: ['product', 'user'],
    });

    if (existing) {
      const nextQuantity = existing.quantity + quantity;
      if (product.stock < nextQuantity) {
        throw new BadRequestException(
          `Only ${product.stock} unit(s) are available`,
        );
      }
      existing.quantity = nextQuantity;
      existing.total = this.money(nextQuantity * getProductSalePrice(product));
      return this.cartRepo.save(existing);
    }

    return this.cartRepo.save(
      this.cartRepo.create({
        user,
        product,
        quantity,
        total: this.money(quantity * getProductSalePrice(product)),
      }),
    );
  }

  async getCart(userId: number) {
    const cartItems = await this.cartRepo.find({
      where: { user: { auth: { id: userId } } },
      relations: ['product'],
    });
    const items = cartItems.map((item) => ({
      ...item,
      total: this.money(getProductSalePrice(item.product) * item.quantity),
    }));
    return {
      items,
      subtotal: this.money(items.reduce((sum, item) => sum + item.total, 0)),
    };
  }

  async removeItem(cartId: number, userId: number) {
    const cartItem = await this.cartRepo.findOne({
      where: { id: cartId, user: { auth: { id: userId } } },
    });
    if (!cartItem) throw new NotFoundException('Cart item not found');
    await this.cartRepo.remove(cartItem);
    return { message: 'Cart item removed' };
  }

  async clearCart(userId: number) {
    await this.cartRepo.delete({ user: { auth: { id: userId } } });
    return { message: 'Cart cleared' };
  }

  async updateQuantity(cartId: number, quantity: number, userId: number) {
    this.validateQuantity(quantity);
    const item = await this.cartRepo.findOne({
      where: { id: cartId, user: { auth: { id: userId } } },
      relations: ['product'],
    });
    if (!item) throw new NotFoundException('Cart item not found');
    if (item.product.stock < quantity) {
      throw new BadRequestException(
        `Only ${item.product.stock} unit(s) are available`,
      );
    }
    item.quantity = quantity;
    item.total = this.money(quantity * getProductSalePrice(item.product));
    return this.cartRepo.save(item);
  }

  private validateQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new BadRequestException(
        'Quantity must be an integer between 1 and 99',
      );
    }
  }

  private money(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
