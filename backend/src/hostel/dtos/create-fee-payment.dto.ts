import { IsNotEmpty, IsString, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateFeePaymentDto {
  @IsNotEmpty()
  @IsString()
  month: string;

  @IsNotEmpty()
  @IsDateString()
  paidDate: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;
}
