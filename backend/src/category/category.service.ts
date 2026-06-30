import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/product.entity';
import { removeStoredImage } from '../common/uploads/image-upload';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  findPublic() {
    return this.categoryRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findAdmin() {
    const categories = await this.categoryRepo.find({ order: { name: 'ASC' } });
    const counts = await this.productRepo
      .createQueryBuilder('product')
      .select('product.category_id', 'categoryId')
      .addSelect('COUNT(product.id)', 'count')
      .where('product.category_id IS NOT NULL')
      .groupBy('product.category_id')
      .getRawMany<{ categoryId: string; count: string }>();
    const countMap = new Map(
      counts.map((item) => [Number(item.categoryId), Number(item.count)]),
    );
    return categories.map((category) => ({
      ...category,
      productCount: countMap.get(category.id) || 0,
    }));
  }

  async create(dto: CreateCategoryDto) {
    const name = this.normalizeName(dto.name);
    const slug = await this.uniqueSlug(name);
    const existing = await this.categoryRepo.findOne({ where: { name } });
    if (existing) throw new ConflictException('Category already exists');

    return this.categoryRepo.save(
      this.categoryRepo.create({
        name,
        slug,
        description: dto.description?.trim() || null,
        image: dto.image?.trim() || 'defaults/category-placeholder.svg',
        isActive: true,
      }),
    );
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.getById(id);
    if (dto.name !== undefined) {
      const name = this.normalizeName(dto.name);
      if (name.toLowerCase() !== category.name.toLowerCase()) {
        const existing = await this.categoryRepo.findOne({ where: { name } });
        if (existing) throw new ConflictException('Category already exists');
        category.name = name;
        category.slug = await this.uniqueSlug(name, category.id);
        await this.productRepo
          .createQueryBuilder()
          .update(Product)
          .set({ category: name })
          .where('category_id = :categoryId', { categoryId: category.id })
          .execute();
      }
    }
    if (dto.description !== undefined) {
      category.description = dto.description.trim() || null;
    }
    const previousImage = category.image;
    if (dto.image !== undefined) {
      category.image = dto.image.trim() || 'defaults/category-placeholder.svg';
    }
    if (dto.isActive !== undefined) category.isActive = dto.isActive;
    const saved = await this.categoryRepo.save(category);
    if (dto.image !== undefined && previousImage !== saved.image) {
      await removeStoredImage(previousImage);
    }
    return saved;
  }

  async remove(id: number) {
    const category = await this.getById(id);
    const productCount = await this.productRepo.count({
      where: { categoryEntity: { id } },
    });
    if (productCount > 0) {
      throw new ConflictException(
        `Category contains ${productCount} product(s). Move or delete those products first.`,
      );
    }
    await this.categoryRepo.remove(category);
    await removeStoredImage(category.image);
    return { message: 'Category deleted successfully' };
  }

  async findOrCreateByName(name: string) {
    const normalized = this.normalizeName(name);
    let category = await this.categoryRepo.findOne({
      where: { name: normalized },
    });
    if (!category) {
      category = await this.categoryRepo.save(
        this.categoryRepo.create({
          name: normalized,
          slug: await this.uniqueSlug(normalized),
          description: null,
          image: 'defaults/category-placeholder.svg',
          isActive: true,
        }),
      );
    }
    return category;
  }

  async getById(id: number) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  private normalizeName(name: string) {
    return name.trim().replace(/\s+/g, ' ');
  }

  private baseSlug(value: string) {
    return (
      value
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'category'
    );
  }

  private async uniqueSlug(name: string, excludeId?: number) {
    const base = this.baseSlug(name);
    let slug = base;
    let suffix = 2;
    while (true) {
      const existing = await this.categoryRepo.findOne({ where: { slug } });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${suffix++}`;
    }
  }
}
