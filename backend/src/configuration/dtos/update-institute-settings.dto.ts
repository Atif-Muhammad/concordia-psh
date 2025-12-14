import { IsOptional, IsEmail, IsString } from 'class-validator';

export class UpdateInstituteSettingsDto {
  @IsOptional()
  @IsString()
  instituteName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  logo?: string;
}
