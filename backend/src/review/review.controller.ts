import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

const reviewImageInterceptor = FileInterceptor('image', {
  storage: diskStorage({
    destination: './uploads',
    filename: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      const stem = file.originalname
        .slice(0, -extension.length)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-');
      callback(null, `${Date.now()}-${stem}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) {
      callback(
        new BadRequestException('Only JPEG, PNG, and WebP images are allowed'),
        false,
      );
      return;
    }
    callback(null, true);
  },
});

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @UseInterceptors(reviewImageInterceptor)
  createReview(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: CreateReviewDto,
  ) {
    return this.reviewService.addReview(request.user.id, body, file?.filename);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @UseInterceptors(reviewImageInterceptor)
  editReview(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UpdateReviewDto,
  ) {
    return this.reviewService.editReview(
      id,
      request.user.id,
      body,
      file?.filename,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  deleteReview(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reviewService.deleteReview(id, request.user.id);
  }

  @Get('testimonials')
  getTestimonials(@Query('limit') limit?: string) {
    return this.reviewService.getPublicTestimonials(Number(limit));
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminReviews() {
    return this.reviewService.getAdminReviews();
  }

  @Patch('admin/:id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  moderate(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ModerateReviewDto,
  ) {
    return this.reviewService.moderate(id, body.isVisible);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  adminDelete(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.adminDelete(id);
  }
}
