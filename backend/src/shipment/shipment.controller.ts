import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ShipmentService } from './shipment.service';

@Controller('shipment')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/:orderId')
  getAdminShipmentByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.shipmentService.getAdminShipmentByOrder(orderId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Get('order/:orderId')
  getShipmentByOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Req() req: { user: { id: number } },
  ) {
    return this.shipmentService.getShipmentByOrder(orderId, req.user.id);
  }
}
