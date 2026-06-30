import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreatePaymentIntentDto } from './create-payment-intent.dto';
import { MockCardDto } from './mock-card.dto';

export class CompleteMockCheckoutDto extends CreatePaymentIntentDto {
  @ValidateNested()
  @Type(() => MockCardDto)
  card: MockCardDto;
}
