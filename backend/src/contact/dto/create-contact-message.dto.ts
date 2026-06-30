import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateContactMessageDto {
  @IsString()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @Length(2, 50)
  lastName: string;

  @IsString()
  @Length(3, 150)
  subject: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^\+?[0-9][0-9\s()-]{7,29}$/, {
    message: 'phone must be a valid phone number',
  })
  phone?: string;

  @IsString()
  @Length(10, 5000)
  message: string;
}
