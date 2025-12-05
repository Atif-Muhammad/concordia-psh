import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateReportCardTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  htmlContent?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
