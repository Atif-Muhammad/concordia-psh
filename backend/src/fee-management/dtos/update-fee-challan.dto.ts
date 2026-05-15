import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFeeChallanDto {
  @IsArray()
  @IsOptional()
  feeHeadIds?: number[];

  /**
   * Manual fine amount - maps to extraFine on the installment
   */
  @IsNumber()
  @IsOptional()
  fineAmount?: number;

  /**
   * Discount amount - stored as negative
   */
  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @IsOptional()
  arrearsSelections?: {
    id: number;
    installmentNumber: number;
    amount: number;
    lateFee: number;
  }[];

  @IsArray()
  @IsOptional()
  heads?: {
    headName: string;
    amount: number;
  }[];
}
