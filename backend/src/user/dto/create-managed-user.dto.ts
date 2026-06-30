import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateManagedUserDto {
  @IsString()
  @Length(3, 50)
  @Matches(/^[A-Za-z0-9_.-]+$/)
  username: string;

  @IsString()
  @Length(8, 72)
  password: string;

  @IsString()
  @Length(2, 50)
  name: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @Matches(/^\+?[0-9][0-9\s-]{8,19}$/)
  phone: string;

  @Type(() => Number)
  @IsInt()
  @Min(16)
  @Max(100)
  age: number;

  @IsString()
  @Length(2, 50)
  role: string;
}
