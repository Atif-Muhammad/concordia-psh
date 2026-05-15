import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateClosingDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @IsOptional()
  totalIncome: number;

  @IsNumber()
  @IsOptional()
  totalExpense: number;

  @IsNumber()
  @IsOptional()
  netBalance: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}
