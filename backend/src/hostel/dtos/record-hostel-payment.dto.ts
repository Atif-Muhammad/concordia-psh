import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class RecordHostelPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  paymentMode: string;

  @IsString()
  paidDate: string; // ISO date string

  @IsString()
  @IsOptional()
  remarks?: string;
}
