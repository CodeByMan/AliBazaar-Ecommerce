import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  createImageStorage,
  IMAGE_UPLOAD_MAX_BYTES,
  imageFileFilter,
  removeUploadedFiles,
  storedImagePath,
} from '../common/uploads/image-upload';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const categoryImageUpload = FileInterceptor('image', {
  storage: createImageStorage('categories', 'category'),
  limits: { fileSize: IMAGE_UPLOAD_MAX_BYTES },
  fileFilter: imageFileFilter('Category image'),
});

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findPublic() {
    return this.categoryService.findPublic();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAdmin() {
    return this.categoryService.findAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(categoryImageUpload)
  async create(
    @Body() dto: CreateCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    try {
      return await this.categoryService.create({
        ...dto,
        image: image
          ? storedImagePath('categories', image)
          : 'defaults/category-placeholder.svg',
      });
    } catch (error) {
      await removeUploadedFiles([image]);
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(categoryImageUpload)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    try {
      const categoryData = { ...dto };
      delete categoryData.image;
      return await this.categoryService.update(id, {
        ...categoryData,
        ...(image ? { image: storedImagePath('categories', image) } : {}),
      });
    } catch (error) {
      await removeUploadedFiles([image]);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
