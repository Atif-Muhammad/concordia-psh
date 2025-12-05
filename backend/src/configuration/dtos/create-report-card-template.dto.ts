import { IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateReportCardTemplateDto {
  @IsNotEmpty({ message: 'Template name must be provided' })
  name: string;

  @IsNotEmpty({ message: 'HTML content must be provided' })
  htmlContent: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  createdBy?: string;
}
