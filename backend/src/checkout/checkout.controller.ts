import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request';
import { CheckoutService } from './checkout.service';
import { CompleteMockCheckoutDto } from './dto/complete-mock-checkout.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get('config')
  getConfig() {
    return this.checkoutService.getPublicConfig();
  }

  @Post('mock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  completeMockCheckout(
    @Req() request: AuthenticatedRequest,
    @Body() body: CompleteMockCheckoutDto,
  ) {
    return this.checkoutService.completeMockCheckout(body, request.user.id);
  }

  @Post('payment-intent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  createPaymentIntent(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreatePaymentIntentDto,
  ) {
    return this.checkoutService.createPaymentIntent(body, request.user.id);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  confirmPayment(
    @Req() request: AuthenticatedRequest,
    @Body() body: ConfirmPaymentDto,
  ) {
    return this.checkoutService.finalizePayment(
      body.paymentIntentId,
      request.user.id,
    );
  }
}
