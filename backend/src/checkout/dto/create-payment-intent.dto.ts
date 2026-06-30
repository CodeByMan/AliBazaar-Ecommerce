import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CheckoutItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class CheckoutCustomerDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  fullName: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsString()
  @Matches(/^\+?[0-9][0-9\s-]{8,19}$/, {
    message: 'phone must be a valid phone number',
  })
  phone: string;

  @IsString()
  @Length(5, 255)
  address: string;

  @IsString()
  @Length(2, 80)
  city: string;

  @IsString()
  @Length(2, 80)
  stateProvince: string;

  @IsString()
  @Matches(/^[A-Za-z0-9 -]{3,20}$/)
  postalCode: string;

  @IsString()
  @Length(2, 80)
  country: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreatePaymentIntentDto {
  @IsUUID()
  checkoutReference: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ValidateNested()
  @Type(() => CheckoutCustomerDto)
  customer: CheckoutCustomerDto;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-]{4,50}$/)
  couponCode?: string;
}
