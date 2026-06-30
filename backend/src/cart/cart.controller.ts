import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  addToCart(
    @Body() body: { productId: number; quantity?: number },
    @Req() req: { user: { id: number } },
  ) {
    return this.cartService.addToCart(
      req.user.id,
      Number(body.productId),
      Number(body.quantity ?? 1),
    );
  }

  @Get()
  getCart(@Req() req: { user: { id: number } }) {
    return this.cartService.getCart(req.user.id);
  }

  @Put('update/:id')
  updateQuantity(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { quantity: number },
    @Req() req: { user: { id: number } },
  ) {
    return this.cartService.updateQuantity(
      id,
      Number(body.quantity),
      req.user.id,
    );
  }

  @Delete('remove/:id')
  removeFromCart(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { id: number } },
  ) {
    return this.cartService.removeItem(id, req.user.id);
  }

  @Delete('clear')
  clearCart(@Req() req: { user: { id: number } }) {
    return this.cartService.clearCart(req.user.id);
  }
}
