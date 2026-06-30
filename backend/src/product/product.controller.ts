import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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
import { ProductInputDto } from './dto/product-input.dto';
import { ProductService } from './product.service';

type ProductUploadFields = {
  images?: Express.Multer.File[];
  image?: Express.Multer.File[];
};

const productImagesUpload = FileFieldsInterceptor(
  [
    { name: 'images', maxCount: 5 },
    { name: 'image', maxCount: 1 },
  ],
  {
    storage: createImageStorage('products', 'product'),
    limits: { fileSize: IMAGE_UPLOAD_MAX_BYTES, files: 5 },
    fileFilter: imageFileFilter('Product image'),
  },
);

const flattenFiles = (files?: ProductUploadFields) => [
  ...(files?.images || []),
  ...(files?.image || []),
];

const parseKeepImageIds = (value?: string) => {
  if (value === undefined) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    return parsed.map(Number).filter((id) => Number.isInteger(id) && id > 0);
  } catch {
    throw new BadRequestException('keepImageIds must be a JSON array of IDs');
  }
};

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Get('user')
  UsergetProducts(
    @Request() request: { user: { id: number } },
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.productService.UsergetProducts(
      request.user.id,
      search,
      category,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Get('user/details/:id')
  getProductDetailsForUser(
    @Param('id', ParseIntPipe) productId: number,
    @Request() request: { user: { id: number } },
  ) {
    return this.productService.getProductDetailsForUser(
      productId,
      request.user.id,
    );
  }

  @Get('details/:id')
  getProductDetails(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getProductWithReviews(id);
  }

  @Get()
  getProducts(
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.productService.findAll(search, category);
  }

  @Get(':id')
  getProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @UseInterceptors(productImagesUpload)
  async addProduct(
    @UploadedFiles() uploaded: ProductUploadFields,
    @Body() body: ProductInputDto,
  ) {
    const files = flattenFiles(uploaded);
    if (files.length === 0) {
      throw new BadRequestException('Select at least one product image');
    }
    if (files.length > 5) {
      await removeUploadedFiles(files);
      throw new BadRequestException('A product can have a maximum of 5 images');
    }

    try {
      const productData = { ...body };
      delete productData.image;
      delete productData.keepImageIds;
      return await this.productService.create(
        productData,
        files.map((file) => storedImagePath('products', file)),
      );
    } catch (error) {
      await removeUploadedFiles(files);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  @UseInterceptors(productImagesUpload)
  async editProduct(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() uploaded: ProductUploadFields,
    @Body() body: ProductInputDto,
  ) {
    const files = flattenFiles(uploaded);
    if (files.length > 5) {
      await removeUploadedFiles(files);
      throw new BadRequestException('A product can have a maximum of 5 images');
    }

    try {
      const keepImageIds = parseKeepImageIds(body.keepImageIds);
      const productData = { ...body };
      delete productData.image;
      delete productData.keepImageIds;
      return await this.productService.update(
        id,
        productData,
        files.map((file) => storedImagePath('products', file)),
        keepImageIds,
      );
    } catch (error) {
      await removeUploadedFiles(files);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
