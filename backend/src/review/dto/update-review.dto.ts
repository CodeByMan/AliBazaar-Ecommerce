import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateReviewDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  text: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
