import type { Repository } from 'typeorm';
import type { OrderItem } from '../order/order-item.entity';
import type { Product } from '../product/product.entity';
import type { User } from '../user/user.entity';
import type { Review } from './review.entity';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  it('should be defined', () => {
    expect(
      new ReviewService(
        {} as Repository<Review>,
        {} as Repository<Product>,
        {} as Repository<User>,
        {} as Repository<OrderItem>,
      ),
    ).toBeDefined();
  });
});
