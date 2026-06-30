import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { MockCardDto } from '../../checkout/dto/mock-card.dto';

export interface MockPaymentResult {
  reference: string;
  chargeId: string;
  lastFour: string;
  brand: string;
  methodType: string;
}

@Injectable()
export class MockPaymentProvider {
  authorize(card: MockCardDto): MockPaymentResult {
    const cardNumber = card.cardNumber.replace(/\s+/g, '');
    if (!this.luhn(cardNumber)) {
      throw new BadRequestException('Demo card number is invalid');
    }
    const now = new Date();
    const expiration = new Date(card.expiryYear, card.expiryMonth, 1);
    if (expiration <= new Date(now.getFullYear(), now.getMonth(), 1)) {
      throw new BadRequestException('Demo card has expired');
    }
    if (cardNumber === '4000000000000002') {
      throw new BadRequestException('Demo payment was declined');
    }
    if (cardNumber !== '4242424242424242') {
      throw new BadRequestException(
        'Use the FYP success card 4242 4242 4242 4242 or decline card 4000 0000 0000 0002',
      );
    }

    const token = randomBytes(6).toString('hex').toUpperCase();
    return {
      reference: `MOCK-PAY-${new Date().getFullYear()}-${token}`,
      chargeId: `MOCK-CH-${token}`,
      lastFour: cardNumber.slice(-4),
      brand: 'Visa Test',
      methodType: 'card',
    };
  }

  private luhn(value: string) {
    if (!/^\d{13,19}$/.test(value)) return false;
    let sum = 0;
    let double = false;
    for (let index = value.length - 1; index >= 0; index -= 1) {
      let digit = Number(value[index]);
      if (double) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      double = !double;
    }
    return sum % 10 === 0;
  }
}
