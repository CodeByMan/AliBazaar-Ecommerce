import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
