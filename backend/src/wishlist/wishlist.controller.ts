import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('toggle')
  toggleLike(
    @Body() body: ToggleWishlistDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.wishlistService.toggleLike(body.productId, request.user.id);
  }

  @Get()
  getUserWishlist(@Req() request: AuthenticatedRequest) {
    return this.wishlistService.getUserWishlist(request.user.id);
  }
}
