import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import type { Cart } from '../src/cart/cart.entity';
import type { Order } from '../src/order/order.entity';
import { ProductController } from '../src/product/product.controller';
import { Product } from '../src/product/product.entity';
import { ProductService } from '../src/product/product.service';
import type { Review } from '../src/review/review.entity';
import type { User } from '../src/user/user.entity';
import type { WishList } from '../src/wishlist/wishlist.entity';
import { Category } from '../src/category/category.entity';
import type { CategoryService } from '../src/category/category.service';

type QueryState = {
  search?: string;
  category?: string;
  categoriesOnly: boolean;
};

const createProductRepository = () => {
  let sequence = 0;
  let products: Product[] = [];

  const repository = {
    create: (data: Partial<Product>) => Object.assign(new Product(), data),
    save: (product: Product) => {
      if (!product.id) product.id = ++sequence;
      const index = products.findIndex((item) => item.id === product.id);
      if (index >= 0) products[index] = product;
      else products.push(product);
      return Promise.resolve(product);
    },
    findOne: (options: { where: { id: number } }) =>
      Promise.resolve(
        products.find((item) => item.id === options.where.id) || null,
      ),
    remove: (product: Product) => {
      products = products.filter((item) => item.id !== product.id);
      return Promise.resolve(product);
    },
    createQueryBuilder: () => {
      const state: QueryState = { categoriesOnly: false };
      const builder = {
        andWhere: (clause: string, params: Record<string, string>) => {
          if (clause.includes('category')) state.category = params.category;
          if (clause.includes('search')) {
            state.search = params.search?.replaceAll('%', '').toLowerCase();
          }
          return builder;
        },
        leftJoinAndSelect: () => builder,
        select: () => {
          state.categoriesOnly = true;
          return builder;
        },
        where: () => builder,
        orderBy: () => builder,
        getMany: () =>
          Promise.resolve(
            products
              .filter(
                (item) => !state.category || item.category === state.category,
              )
              .filter(
                (item) =>
                  !state.search ||
                  item.name.toLowerCase().includes(state.search) ||
                  item.description.toLowerCase().includes(state.search),
              )
              .sort((a, b) => b.id - a.id),
          ),
        getRawMany: () =>
          Promise.resolve(
            Array.from(new Set(products.map((item) => item.category)))
              .sort()
              .map((category) => ({ category })),
          ),
      };
      return builder;
    },
  };

  return repository as unknown as Repository<Product>;
};

describe('Product CRUD API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const productRepository = createProductRepository();
    const productService = new ProductService(
      productRepository,
      { find: () => Promise.resolve([]) } as unknown as Repository<Review>,
      {} as Repository<WishList>,
      {} as Repository<Order>,
      {} as Repository<User>,
      {
        delete: () => Promise.resolve({ raw: [], affected: 0 }),
      } as unknown as Repository<Cart>,
      {
        findOrCreateByName: (name: string) =>
          Promise.resolve(Object.assign(new Category(), { id: 1, name })),
        getById: (id: number) =>
          Promise.resolve(
            Object.assign(new Category(), { id, name: 'Accessories' }),
          ),
      } as unknown as CategoryService,
    );

    const moduleFixture = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: productService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, lists, reads, updates, and deletes a product', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n2sAAAAASUVORK5CYII=',
      'base64',
    );

    const created = await request(app.getHttpServer())
      .post('/products')
      .field('name', 'Mechanical Keyboard')
      .field('description', 'Hot-swappable mechanical keyboard')
      .field('price', '2499')
      .field('stock', '12')
      .field('category', 'Accessories')
      .attach('image', png, {
        filename: 'keyboard.png',
        contentType: 'image/png',
      })
      .expect(201);

    const createdBody = created.body as unknown as Product;
    expect(createdBody).toEqual(
      expect.objectContaining({
        id: 1,
        name: 'Mechanical Keyboard',
        price: 2499,
        stock: 12,
        category: 'Accessories',
      }),
    );
    expect(createdBody.image).toMatch(/keyboard\.png$/);

    const list = await request(app.getHttpServer())
      .get('/products')
      .expect(200);
    const listBody = list.body as unknown as {
      products: Product[];
      categories: string[];
    };
    expect(listBody.products).toHaveLength(1);
    expect(listBody.categories).toEqual(['Accessories']);

    const read = await request(app.getHttpServer())
      .get('/products/1')
      .expect(200);
    const readBody = read.body as unknown as Product;
    expect(readBody.name).toBe('Mechanical Keyboard');

    const updated = await request(app.getHttpServer())
      .patch('/products/1')
      .field('name', 'Mechanical Keyboard Pro')
      .field('description', 'Updated hot-swappable mechanical keyboard')
      .field('price', '2999')
      .field('stock', '8')
      .field('category', 'Accessories')
      .expect(200);
    const updatedBody = updated.body as unknown as Product;
    expect(updatedBody.name).toBe('Mechanical Keyboard Pro');
    expect(updatedBody.price).toBe(2999);
    expect(updatedBody.stock).toBe(8);
    expect(updatedBody.image).toBe(createdBody.image);

    await request(app.getHttpServer()).delete('/products/1').expect(200);
    await request(app.getHttpServer()).get('/products/1').expect(404);

    const finalList = await request(app.getHttpServer())
      .get('/products')
      .expect(200);
    const finalListBody = finalList.body as unknown as { products: Product[] };
    expect(finalListBody.products).toEqual([]);
  });

  it('rejects invalid product data and unsupported image types', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .field('name', 'X')
      .field('description', 'bad')
      .field('price', '-1')
      .field('stock', '-2')
      .field('category', 'A')
      .attach('image', Buffer.from('not-an-image'), {
        filename: 'product.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });
});
