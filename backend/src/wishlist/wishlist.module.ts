import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { WishList } from './wishlist.entity';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([WishList, User, Product])],
  providers: [WishlistService],
  controllers: [WishlistController],
})
export class WishlistModule {}
