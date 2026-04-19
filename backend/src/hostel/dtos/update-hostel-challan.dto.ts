import { IsOptional, IsString, IsNumber, IsDateString, Min } from 'class-validator';

export class UpdateHostelChallanDto {
  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsNumber() @Min(0)
  paidAmount?: number;

  @IsOptional() @IsDateString()
  paidDate?: string;

  @IsOptional() @IsDateString()
  dueDate?: string;

  @IsOptional() @IsNumber() @Min(0)
  fineAmount?: number;

  @IsOptional() @IsNumber() @Min(0)
  lateFeeFine?: number;

  @IsOptional() @IsNumber() @Min(0)
  discount?: number;

  @IsOptional() @IsString()
  remarks?: string;
}
