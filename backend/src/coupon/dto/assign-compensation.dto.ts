import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AssignCompensationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sourceOrderId?: number;

  @IsString()
  @MaxLength(500)
  reason: string;
}
