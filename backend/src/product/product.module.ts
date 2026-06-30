import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { Review } from '../review/review.entity';
import { WishList } from '../wishlist/wishlist.entity';
import { Order } from '../order/order.entity';
import { User } from '../user/user.entity';
import { Cart } from '../cart/cart.entity';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      Review,
      WishList,
      Order,
      User,
      Cart,
    ]),
    CategoryModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
