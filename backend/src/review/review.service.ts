import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '../order/order-item.entity';
import { OrderStatus } from '../order/order-status.enum';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './review.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  async addReview(authId: number, dto: CreateReviewDto, image?: string) {
    const user = await this.userRepo.findOne({
      where: { auth: { id: authId } },
    });
    if (!user) throw new NotFoundException('Customer account not found');
    if (!dto.orderItemId && !dto.productId) {
      throw new BadRequestException('orderItemId or productId is required');
    }

    const orderItem = await this.findDeliveredOrderItem(
      user.id,
      dto.orderItemId,
      dto.productId,
    );
    const existing = await this.reviewRepo.findOne({
      where: { orderItem: { id: orderItem.id } },
    });
    if (existing) {
      throw new ConflictException(
        'This delivered item has already been reviewed',
      );
    }

    const review = this.reviewRepo.create({
      user,
      product:
        orderItem.product || (await this.requireProduct(orderItem.productId)),
      orderItem,
      review: dto.text.trim(),
      feedback: dto.feedback?.trim() || null,
      rating: dto.rating,
      image: image || null,
      isVisible: true,
    });
    return this.reviewRepo.save(review);
  }

  async editReview(
    reviewId: number,
    authId: number,
    dto: UpdateReviewDto,
    image?: string,
  ) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, user: { auth: { id: authId } } },
    });
    if (!review) throw new NotFoundException('Review not found');
    review.review = dto.text.trim();
    review.feedback = dto.feedback?.trim() || null;
    review.rating = dto.rating;
    if (image) review.image = image;
    review.isVisible = true;
    return this.reviewRepo.save(review);
  }

  async deleteReview(reviewId: number, authId: number) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, user: { auth: { id: authId } } },
    });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviewRepo.remove(review);
    return { message: 'Review deleted successfully' };
  }

  getReviewsForProduct(productId: number) {
    return this.reviewRepo.find({
      where: { product: { id: productId }, isVisible: true },
      relations: ['user'],
      order: { reviewed_at: 'DESC' },
    });
  }

  async getPublicTestimonials(limit = 12) {
    const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 30);
    return this.reviewRepo.find({
      where: { isVisible: true },
      relations: ['user', 'product'],
      order: { reviewed_at: 'DESC' },
      take: safeLimit,
    });
  }

  getAdminReviews() {
    return this.reviewRepo.find({
      relations: ['user', 'product', 'orderItem'],
      order: { reviewed_at: 'DESC' },
    });
  }

  async moderate(reviewId: number, isVisible: boolean) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    review.isVisible = isVisible;
    return this.reviewRepo.save(review);
  }

  async adminDelete(reviewId: number) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviewRepo.remove(review);
    return { message: 'Review deleted successfully' };
  }

  private async findDeliveredOrderItem(
    userId: number,
    orderItemId?: number,
    productId?: number,
  ) {
    const query = this.orderItemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.order', 'orders')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoin('orders.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('orders.status = :status', { status: OrderStatus.DELIVERED });
    if (orderItemId) query.andWhere('item.id = :orderItemId', { orderItemId });
    if (productId) {
      query.andWhere('item.productId = :productId', { productId });
    }
    const item = await query.orderBy('orders.createdAt', 'DESC').getOne();
    if (!item) {
      throw new BadRequestException(
        'You can review a product only after an order containing it is delivered',
      );
    }
    return item;
  }

  private async requireProduct(productId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product no longer exists');
    return product;
  }
}
