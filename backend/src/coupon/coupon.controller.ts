import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request';
import { AssignCompensationDto } from './dto/assign-compensation.dto';
import { CreateCompensationDto } from './dto/create-compensation.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CouponService } from './coupon.service';

@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  listMine(@Req() request: AuthenticatedRequest) {
    return this.couponService.listForCustomer(request.user.id);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  validate(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ValidateCouponDto,
  ) {
    return this.couponService.validateForCustomer(
      request.user.id,
      dto.code,
      dto.subtotal,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listAdmin() {
    return this.couponService.listAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateCouponDto) {
    return this.couponService.create(dto, request.user.id);
  }

  @Post('compensation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createCompensation(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCompensationDto,
  ) {
    return this.couponService.createCompensation(dto, request.user.id);
  }

  @Post(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  assign(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignCompensationDto,
  ) {
    return this.couponService.assignCompensation(id, dto, request.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCouponDto) {
    return this.couponService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.remove(id);
  }
}
