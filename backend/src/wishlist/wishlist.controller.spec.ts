import { WishlistController } from './wishlist.controller';
import type { WishlistService } from './wishlist.service';

describe('WishlistController', () => {
  it('should be defined', () => {
    const service = {
      toggleLike: jest.fn(),
      getUserWishlist: jest.fn(),
    } as unknown as WishlistService;
    const controller = new WishlistController(service);
    expect(controller).toBeDefined();
  });
});
