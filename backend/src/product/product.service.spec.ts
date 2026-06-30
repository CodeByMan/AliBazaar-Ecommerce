import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { ProductService } from './product.service';
import type { Product } from './product.entity';
import type { ProductImage } from './product-image.entity';
import type { Review } from '../review/review.entity';
import type { WishList } from '../wishlist/wishlist.entity';
import type { Order } from '../order/order.entity';
import type { User } from '../user/user.entity';
import type { Cart } from '../cart/cart.entity';
import type { Category } from '../category/category.entity';
import type { CategoryService } from '../category/category.service';

const createService = (productRepo: Partial<Repository<Product>> = {}) => {
  const createMock = jest.fn((value: Partial<Product>) => value as Product);
  const saveMock = jest.fn((value: Product) => Promise.resolve(value));
  const removeMock = jest.fn();
  const cartDeleteMock = jest.fn().mockResolvedValue({ affected: 0 });
  const defaults = {
    create: createMock,
    save: saveMock,
    findOne: jest.fn(),
    remove: removeMock,
    createQueryBuilder: jest.fn(),
  } as Partial<Repository<Product>>;

  const repository = { ...defaults, ...productRepo } as Repository<Product>;
  const cartRepo = { delete: cartDeleteMock } as unknown as Repository<Cart>;
  const productImageRepo = {
    create: jest.fn((value: Partial<ProductImage>) => value as ProductImage),
    save: jest.fn((value: ProductImage | ProductImage[]) =>
      Promise.resolve(value),
    ),
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
  } as unknown as Repository<ProductImage>;
  const category = { id: 1, name: 'Accessories' } as Category;
  const categoryService = {
    findOrCreateByName: jest.fn().mockResolvedValue(category),
    getById: jest.fn().mockResolvedValue(category),
  } as unknown as CategoryService;

  return {
    repository,
    cartRepo,
    createMock,
    saveMock: (productRepo.save as jest.Mock | undefined) ?? saveMock,
    removeMock: (productRepo.remove as jest.Mock | undefined) ?? removeMock,
    cartDeleteMock,
    service: new ProductService(
      repository,
      productImageRepo,
      {} as Repository<Review>,
      {} as Repository<WishList>,
      {} as Repository<Order>,
      {} as Repository<User>,
      cartRepo,
      categoryService,
    ),
  };
};

describe('ProductService CRUD', () => {
  it('creates a normalized product', async () => {
    const { service, createMock } = createService();

    const result = await service.create({
      name: '  Mechanical Keyboard  ',
      description: '  Hot-swappable keyboard  ',
      category: '  Accessories  ',
      price: '2499' as unknown as number,
      stock: '10' as unknown as number,
      image: 'keyboard.jpg',
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mechanical Keyboard',
        description: 'Hot-swappable keyboard',
        category: 'Accessories',
        price: 2499,
        stock: 10,
      }),
    );
    expect(result.name).toBe('Mechanical Keyboard');
  });

  it('updates an existing product', async () => {
    const existing = {
      id: 7,
      name: 'Old name',
      description: 'Old description',
      category: 'Old category',
      price: 100,
      stock: 1,
      image: 'same.jpg',
      images: [{ id: 1, image: 'same.jpg', sortOrder: 0 } as ProductImage],
    } as Product;
    const { service, saveMock } = createService({
      findOne: jest.fn().mockResolvedValue(existing),
    });

    const result = await service.update(7, {
      name: 'Updated name',
      description: 'Updated description',
      category: 'Accessories',
      price: 150,
      stock: 3,
      image: 'same.jpg',
    });

    expect(saveMock).toHaveBeenCalled();
    expect(result.name).toBe('Updated name');
    expect(result.stock).toBe(3);
  });

  it('keeps the product relation synchronized when adding multiple images', async () => {
    const existing = {
      id: 8,
      name: 'Existing product',
      description: 'Existing description',
      category: 'Accessories',
      price: 100,
      stock: 2,
      image: 'existing.jpg',
      images: [{ id: 10, image: 'existing.jpg', sortOrder: 0 } as ProductImage],
    } as Product;
    const { service } = createService({
      findOne: jest.fn().mockResolvedValue(existing),
    });

    await service.update(
      8,
      {
        name: 'Existing product',
        description: 'Existing description',
        category: 'Accessories',
        price: 100,
        stock: 2,
      },
      ['new-one.jpg', 'new-two.jpg'],
      [10],
    );

    expect(existing.images.map((image) => image.image)).toEqual([
      'existing.jpg',
      'new-one.jpg',
      'new-two.jpg',
    ]);
    expect(existing.image).toBe('existing.jpg');
  });

  it('deletes dependent cart rows before deleting the product', async () => {
    const product = {
      id: 9,
      name: 'Mouse',
      description: 'Wireless mouse',
      category: 'Accessories',
      price: 1000,
      stock: 4,
      image: 'missing-test-image.jpg',
      images: [
        {
          id: 2,
          image: 'missing-test-image.jpg',
          sortOrder: 0,
        } as ProductImage,
      ],
    } as Product;
    const { service, removeMock, cartDeleteMock } = createService({
      findOne: jest.fn().mockResolvedValue(product),
      remove: jest.fn().mockResolvedValue(product),
    });

    await expect(service.remove(9)).resolves.toEqual({
      message: 'Product deleted successfully',
    });
    expect(cartDeleteMock).toHaveBeenCalledWith({ product: { id: 9 } });
    expect(removeMock).toHaveBeenCalledWith(product);
  });

  it('returns 404 for a missing product', async () => {
    const { service } = createService({
      findOne: jest.fn().mockResolvedValue(null),
    });

    await expect(service.findOne(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
