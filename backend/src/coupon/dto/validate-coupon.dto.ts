import { Type } from 'class-transformer';
import { IsNumber, IsString, Matches, Min } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @Matches(/^[A-Za-z0-9-]{4,50}$/)
  code: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;
}
