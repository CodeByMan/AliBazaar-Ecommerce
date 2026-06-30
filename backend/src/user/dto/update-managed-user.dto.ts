import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateManagedUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 50)
  @Matches(/^[A-Za-z0-9_.-]+$/)
  username?: string;

  @IsOptional()
  @IsString()
  @Length(8, 72)
  password?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9][0-9\s-]{8,19}$/)
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(16)
  @Max(100)
  age?: number;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  role?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
