import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckoutService } from '../checkout/checkout.service';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly checkoutService: CheckoutService,
  ) {}

  @Post('webhook')
  async stripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature || !request.rawBody) {
      throw new BadRequestException(
        'Missing Stripe signature or raw request body',
      );
    }
    const event = this.checkoutService.constructWebhookEvent(
      request.rawBody,
      signature,
    );
    return this.checkoutService.handleWebhook(event);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @Get(':id')
  getPaymentByOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.paymentService.getPaymentByOrderId(orderId, request.user);
  }
}
