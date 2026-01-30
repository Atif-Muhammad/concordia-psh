import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFeeChallanTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  htmlContent: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateFeeChallanTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  htmlContent?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
