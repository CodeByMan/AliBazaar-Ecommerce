import { ReviewController } from './review.controller';
import type { ReviewService } from './review.service';

describe('ReviewController', () => {
  it('should be defined', () => {
    const service = {
      addReview: jest.fn(),
      updateReview: jest.fn(),
      deleteReview: jest.fn(),
    } as unknown as ReviewService;
    const controller = new ReviewController(service);
    expect(controller).toBeDefined();
  });
});
