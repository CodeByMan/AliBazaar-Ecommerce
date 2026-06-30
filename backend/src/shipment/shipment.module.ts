import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipment } from './shipment.entity';
import { ShipmentController } from './shipment.controller';
import { ShipmentService } from './shipment.service';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment])],
  providers: [ShipmentService, RolesGuard],
  controllers: [ShipmentController],
})
export class ShipmentModule {}
