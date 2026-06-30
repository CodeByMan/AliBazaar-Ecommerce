import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('track/:orderNumber')
  trackOrder(@Param('orderNumber') orderNumber: string) {
    return this.orderService.trackOrder(orderNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Get()
  getUserOrders(@Req() request: AuthenticatedRequest) {
    return this.orderService.getUserOrders(request.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Get('mine/:orderNumber')
  getUserOrder(
    @Req() request: AuthenticatedRequest,
    @Param('orderNumber') orderNumber: string,
  ) {
    return this.orderService.getUserOrder(request.user.id, orderNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/list')
  getAdminOrders(@Query() query: AdminOrderQueryDto) {
    return this.orderService.getAdminOrders(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/:orderNumber')
  getAdminOrder(@Param('orderNumber') orderNumber: string) {
    return this.orderService.getAdminOrder(orderNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/:orderNumber/status')
  updateOrderStatus(
    @Req() request: AuthenticatedRequest,
    @Param('orderNumber') orderNumber: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(orderNumber, body, request.user.id);
  }
}
