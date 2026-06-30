import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { WishList } from './wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishList)
    private readonly wishlistRepo: Repository<WishList>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async addToWishlist(user: User, product: Product) {
    const exists = await this.isInWishlist(user.id, product.id);
    if (exists) return exists;

    return this.wishlistRepo.save(this.wishlistRepo.create({ user, product }));
  }

  removeFromWishlist(user: User, product: Product) {
    return this.wishlistRepo.delete({
      user: { id: user.id },
      product: { id: product.id },
    });
  }

  async isInWishlist(userId: number, productId: number) {
    return Boolean(
      await this.wishlistRepo.findOne({
        where: { user: { id: userId }, product: { id: productId } },
      }),
    );
  }

  async getUserWishlist(authId: number) {
    const items = await this.wishlistRepo.find({
      where: { user: { auth: { id: authId } } },
      relations: ['product'],
      order: { created_at: 'DESC' },
    });
    return items.map(({ product }) => product);
  }

  async toggleLike(productId: number, authId: number) {
    const [user, product] = await Promise.all([
      this.userRepo.findOne({ where: { auth: { id: authId } } }),
      this.productRepo.findOne({ where: { id: productId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.wishlistRepo.findOne({
      where: { product: { id: product.id }, user: { id: user.id } },
    });

    if (existing) {
      await this.wishlistRepo.remove(existing);
      return { liked: false };
    }

    await this.wishlistRepo.save(this.wishlistRepo.create({ product, user }));
    return { liked: true };
  }
}
