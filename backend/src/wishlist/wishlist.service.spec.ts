import type { Repository } from 'typeorm';
import { WishlistService } from './wishlist.service';
import type { WishList } from './wishlist.entity';
import type { User } from '../user/user.entity';
import type { Product } from '../product/product.entity';

describe('WishlistService', () => {
  it('should be defined', () => {
    expect(
      new WishlistService(
        {} as Repository<WishList>,
        {} as Repository<User>,
        {} as Repository<Product>,
      ),
    ).toBeDefined();
  });
});
