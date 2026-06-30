import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  paymentIntentId: string;
}
