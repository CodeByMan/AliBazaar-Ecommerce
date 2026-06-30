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
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { setAuthCookie } from '../auth/auth-cookie';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request';
import {
  createImageStorage,
  IMAGE_UPLOAD_MAX_BYTES,
  imageFileFilter,
  removeUploadedFiles,
  storedImagePath,
} from '../common/uploads/image-upload';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateManagedUserDto } from './dto/update-managed-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

const profileImageUpload = FileInterceptor('image', {
  storage: createImageStorage('users', 'profile'),
  limits: { fileSize: IMAGE_UPLOAD_MAX_BYTES },
  fileFilter: imageFileFilter('Profile image'),
});

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('check-username')
  checkUsername(@Query('username') username = '') {
    return this.userService.checkUsernameAvailability(username);
  }

  @Post('register')
  async register(
    @Body() body: RegisterUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.userService.register(body);
    setAuthCookie(response, result.token);
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Get('profile')
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.userService.getProfile(request.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Patch('update/profile')
  @UseInterceptors(profileImageUpload)
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() data: UpdateProfileDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    try {
      return await this.userService.updateProfile(
        request.user.id,
        data,
        image ? storedImagePath('users', image) : undefined,
      );
    } catch (error) {
      await removeUploadedFiles([image]);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Delete('profile-image')
  resetProfileImage(@Req() request: AuthenticatedRequest) {
    return this.userService.resetProfileImage(request.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  @Patch('change-password')
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() data: ChangePasswordDto,
  ) {
    return this.userService.changePassword(
      request.user.id,
      data.currentPassword,
      data.newPassword,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getUsers(@Query('search') search?: string) {
    return this.userService.getUsers(search);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createManagedUser(@Body() dto: CreateManagedUserDto) {
    return this.userService.createManagedUser(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateManagedUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateManagedUserDto,
  ) {
    return this.userService.updateManagedUser(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteManagedUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteManagedUser(id);
  }

  @Get(':id/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getUserOrderDetails(@Param('id', ParseIntPipe) id: number) {
    if (id <= 0) throw new BadRequestException('Invalid user ID');
    return this.userService.getUserOrderDetails(id);
  }
}
