import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStudentIDCardTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  htmlContent: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
