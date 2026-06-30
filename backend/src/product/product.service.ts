import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Cart } from '../cart/cart.entity';
import { Category } from '../category/category.entity';
import { CategoryService } from '../category/category.service';
import { removeStoredImage } from '../common/uploads/image-upload';
import { OrderStatus } from '../order/order-status.enum';
import { Order } from '../order/order.entity';
import { Review } from '../review/review.entity';
import { User } from '../user/user.entity';
import { WishList } from '../wishlist/wishlist.entity';
import { ProductImage } from './product-image.entity';
import { Product } from './product.entity';

interface RawCategory {
  category: string;
}

type ProductData = Partial<Product> & { categoryId?: number };

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepo: Repository<ProductImage>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(WishList)
    private readonly wishlistRepo: Repository<WishList>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    private readonly categoryService: CategoryService,
  ) {}

  async findAll(search?: string, category?: string) {
    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categoryEntity', 'categoryEntity')
      .leftJoinAndSelect('product.images', 'images');

    if (search) {
      query.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (category) {
      query.andWhere('product.category = :category', { category });
    }

    const [products, categoriesData, categoryItems, ratingSummaries] =
      await Promise.all([
        query
          .orderBy('product.id', 'DESC')
          .addOrderBy('images.sortOrder', 'ASC')
          .getMany(),
        this.getCategories(),
        this.categoryService.findPublic(),
        this.getRatingSummaries(),
      ]);

    return {
      products: products.map((product) => ({
        ...this.normalizeImages(product),
        ...(ratingSummaries.get(product.id) || {
          averageRating: 0,
          reviewCount: 0,
        }),
      })),
      categories: categoriesData.map(({ category: name }) => name),
      categoryItems,
    };
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['categoryEntity', 'images'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.normalizeImages(product);
  }

  async getProductWithReviews(id: number) {
    const product = await this.findOne(id);
    const reviews = await this.reviewRepo.find({
      where: { product: { id }, isVisible: true },
      relations: ['user'],
      order: { reviewed_at: 'DESC' },
    });
    return { product, reviews };
  }

  async create(data: ProductData, imagePaths?: string[]) {
    const paths = this.normalizeImagePaths(
      imagePaths?.length ? imagePaths : data.image ? [data.image] : [],
    );
    if (paths.length === 0) {
      throw new BadRequestException('Select at least one product image');
    }

    const category = await this.resolveCategory(data);
    const product = await this.productRepo.save(
      this.productRepo.create({
        ...this.normalizeProductData(data),
        image: paths[0],
        category: category.name,
        categoryEntity: category,
      }),
    );

    const savedImages = await this.productImageRepo.save(
      paths.map((image, sortOrder) =>
        this.productImageRepo.create({ image, sortOrder, product }),
      ),
    );
    product.images = Array.isArray(savedImages) ? savedImages : [savedImages];
    return this.normalizeImages(product);
  }

  async update(
    id: number,
    data: ProductData,
    newImagePaths: string[] = [],
    keepImageIds?: number[],
  ) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['categoryEntity', 'images'],
    });
    if (!product) throw new NotFoundException('Product not found');

    const currentImages = [...(product.images || [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const requestedKeepIds =
      keepImageIds === undefined
        ? currentImages.map((image) => image.id)
        : Array.from(new Set(keepImageIds));
    const keptImages = currentImages.filter((image) =>
      requestedKeepIds.includes(image.id),
    );
    const normalizedNewPaths = this.normalizeImagePaths(newImagePaths);

    if (keptImages.length + normalizedNewPaths.length === 0) {
      throw new BadRequestException('A product must keep at least one image');
    }
    if (keptImages.length + normalizedNewPaths.length > 5) {
      throw new BadRequestException('A product can have a maximum of 5 images');
    }

    const normalized = this.normalizeProductData(data);
    delete normalized.image;
    Object.assign(product, normalized);
    if (data.categoryId !== undefined || data.category !== undefined) {
      const category = await this.resolveCategory(data);
      product.category = category.name;
      product.categoryEntity = category;
    }

    const removedImages = currentImages.filter(
      (image) => !requestedKeepIds.includes(image.id),
    );
    if (removedImages.length) {
      await this.productImageRepo.delete({
        id: In(removedImages.map((image) => image.id)),
      });
    }

    for (const [index, image] of keptImages.entries()) {
      if (image.sortOrder !== index) {
        image.sortOrder = index;
        await this.productImageRepo.save(image);
      }
    }

    const createdImages = normalizedNewPaths.length
      ? await this.productImageRepo.save(
          normalizedNewPaths.map((image, index) =>
            this.productImageRepo.create({
              image,
              sortOrder: keptImages.length + index,
              product,
            }),
          ),
        )
      : [];

    const resultingImages = [...keptImages, ...createdImages].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    // Keep the loaded inverse relation in sync before saving the parent.
    // Otherwise TypeORM sees the newly-created image rows as missing from
    // product.images and tries to detach them by setting product_id to NULL.
    product.images = resultingImages;
    product.image = resultingImages[0].image;
    await this.productRepo.save(product);

    await Promise.all(
      removedImages.map((image) => removeStoredImage(image.image)),
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    const paths = Array.from(
      new Set([
        product.image,
        ...(product.images || []).map((item) => item.image),
      ]),
    );
    await this.cartRepo.delete({ product: { id } });
    await this.productRepo.remove(product);
    await Promise.all(paths.map((path) => removeStoredImage(path)));
    return { message: 'Product deleted successfully' };
  }

  async UsergetProducts(userId: number, search?: string, category?: string) {
    const query = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images');
    if (search) {
      query.andWhere('product.name LIKE :search', { search: `%${search}%` });
    }
    if (category) {
      query.andWhere('product.category = :category', { category });
    }

    const [
      products,
      categories,
      categoryItems,
      wishlistItems,
      ratingSummaries,
    ] = await Promise.all([
      query
        .orderBy('product.id', 'DESC')
        .addOrderBy('images.sortOrder', 'ASC')
        .getMany(),
      this.getCategories(),
      this.categoryService.findPublic(),
      this.wishlistRepo.find({
        where: { user: { auth: { id: userId } } },
        relations: ['product'],
      }),
      this.getRatingSummaries(),
    ]);

    const wishlistProductIds = new Set(
      wishlistItems.map((item) => item.product.id),
    );

    return {
      products: products.map((product) => ({
        ...this.normalizeImages(product),
        ...(ratingSummaries.get(product.id) || {
          averageRating: 0,
          reviewCount: 0,
        }),
        isInWishlist: wishlistProductIds.has(product.id),
      })),
      categories: categories.map(({ category: name }) => name),
      categoryItems,
    };
  }

  async getProductDetailsForUser(productId: number, authId: number) {
    const user = await this.userRepo.findOne({
      where: { auth: { id: authId } },
    });
    if (!user) throw new NotFoundException('User not found');

    const product = await this.findOne(productId);
    const [reviews, purchased, wishlistItem] = await Promise.all([
      this.reviewRepo.find({
        where: { product: { id: productId }, isVisible: true },
        relations: ['user'],
        order: { reviewed_at: 'DESC' },
      }),
      this.orderRepo
        .createQueryBuilder('orders')
        .innerJoin('orders.items', 'items')
        .where('orders.user_id = :userId', { userId: user.id })
        .andWhere('items.product_id_snapshot = :productId', { productId })
        .andWhere('orders.status = :delivered', {
          delivered: OrderStatus.DELIVERED,
        })
        .getCount(),
      this.wishlistRepo.findOne({
        where: { user: { id: user.id }, product: { id: productId } },
      }),
    ]);

    return {
      product,
      reviews: reviews.map((review) => ({
        ...review,
        canEdit: review.user.id === user.id,
      })),
      canReview: purchased > 0,
      isInWishlist: Boolean(wishlistItem),
    };
  }

  private async getRatingSummaries() {
    const rows = await this.reviewRepo
      .createQueryBuilder('review')
      .innerJoin('review.product', 'product')
      .select('product.id', 'productId')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .addSelect('AVG(review.rating)', 'averageRating')
      .where('review.isVisible = :isVisible', { isVisible: true })
      .groupBy('product.id')
      .getRawMany<{
        productId: string;
        reviewCount: string;
        averageRating: string;
      }>();

    return new Map(
      rows.map((row) => [
        Number(row.productId),
        {
          reviewCount: Number(row.reviewCount) || 0,
          averageRating: Number(row.averageRating) || 0,
        },
      ]),
    );
  }

  private normalizeProductData(data: ProductData): ProductData {
    const normalized: ProductData = {
      ...data,
      ...(typeof data.name === 'string' ? { name: data.name.trim() } : {}),
      ...(typeof data.description === 'string'
        ? { description: data.description.trim() }
        : {}),
      ...(typeof data.category === 'string'
        ? { category: data.category.trim() }
        : {}),
      ...(data.price !== undefined ? { price: Number(data.price) } : {}),
      ...(data.stock !== undefined ? { stock: Number(data.stock) } : {}),
    };

    const hasDiscountFlag = data.discountEnabled !== undefined;
    const hasDiscountPercentage = data.discountPercentage !== undefined;

    if (hasDiscountFlag || hasDiscountPercentage) {
      const discountEnabled = hasDiscountFlag
        ? this.toBoolean(data.discountEnabled)
        : Number(data.discountPercentage) > 0;
      const discountPercentage = discountEnabled
        ? Number(data.discountPercentage ?? 0)
        : 0;

      if (
        discountEnabled &&
        (!Number.isFinite(discountPercentage) ||
          discountPercentage <= 0 ||
          discountPercentage > 100)
      ) {
        throw new BadRequestException(
          'Discount percentage must be greater than 0 and at most 100',
        );
      }

      normalized.discountEnabled = discountEnabled;
      normalized.discountPercentage = discountPercentage;
    }

    return normalized;
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
    }
    return false;
  }

  private normalizeImagePaths(paths: string[]) {
    return Array.from(
      new Set(paths.map((path) => path.trim()).filter(Boolean)),
    ).slice(0, 5);
  }

  private normalizeImages(product: Product) {
    product.images = [...(product.images || [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    return product;
  }

  private async resolveCategory(data: ProductData): Promise<Category> {
    if (data.categoryId !== undefined) {
      return this.categoryService.getById(Number(data.categoryId));
    }
    if (typeof data.category === 'string' && data.category.trim()) {
      return this.categoryService.findOrCreateByName(data.category);
    }
    throw new NotFoundException('A valid category is required');
  }

  private getCategories(): Promise<RawCategory[]> {
    return this.productRepo
      .createQueryBuilder('product')
      .select('DISTINCT product.category', 'category')
      .where("product.category IS NOT NULL AND product.category <> ''")
      .orderBy('product.category', 'ASC')
      .getRawMany<RawCategory>();
  }
}
