import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-z][a-z0-9_-]*$/, {
    message:
      'Role name must start with a letter and contain lowercase letters, numbers, hyphens, or underscores only',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
