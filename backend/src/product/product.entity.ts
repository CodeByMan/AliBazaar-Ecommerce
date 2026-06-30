import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../category/category.entity';
import { ProductImage } from './product-image.entity';

@Entity('product_table')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 12, scale: 2 })
  price: number;

  @Column({ name: 'discount_enabled', type: 'boolean', default: false })
  discountEnabled: boolean;

  @Column('decimal', {
    name: 'discount_percentage',
    precision: 5,
    scale: 2,
    default: 0,
  })
  discountPercentage: number;

  @Column('int')
  stock: number;

  @Column()
  image: string;

  @Column('varchar')
  category: string;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  categoryEntity: Category | null;

  @OneToMany(() => ProductImage, (image) => image.product)
  images: ProductImage[];
}
