import { Type } from 'class-transformer';
import { IsInt, IsString, Length, Matches, Max, Min } from 'class-validator';

export class MockCardDto {
  @IsString()
  @Matches(/^[0-9 ]{13,23}$/, {
    message: 'cardNumber must contain 13 to 19 digits',
  })
  cardNumber: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  expiryMonth: number;

  @Type(() => Number)
  @IsInt()
  @Min(2026)
  @Max(2100)
  expiryYear: number;

  @IsString()
  @Length(3, 4)
  @Matches(/^\d{3,4}$/)
  cvc: string;

  @IsString()
  @Length(2, 100)
  cardholderName: string;
}
