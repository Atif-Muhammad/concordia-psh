import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  expenseTitle?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
