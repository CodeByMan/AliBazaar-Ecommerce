import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './shipment.entity';

@Injectable()
export class ShipmentService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
  ) {}

  async getShipmentByOrder(orderId: number, userId: number) {
    const shipment = await this.shipmentRepo.findOne({
      where: { order: { id: orderId, user: { auth: { id: userId } } } },
      relations: ['order'],
    });
    if (!shipment)
      throw new NotFoundException('Shipment not found or access denied');
    return shipment;
  }

  async getAdminShipmentByOrder(orderId: number) {
    const shipment = await this.shipmentRepo.findOne({
      where: { order: { id: orderId } },
      relations: ['order', 'order.items', 'order.payment'],
    });
    if (!shipment)
      throw new NotFoundException('Shipment not found for this order');
    return shipment;
  }
}
