import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateFeeStructureDto {
  @IsNumber()
  @IsNotEmpty()
  programId: number;

  @IsNumber()
  @IsNotEmpty()
  classId: number;

  @IsArray()
  @IsOptional()
  feeHeads?: number[]; // Array of FeeHead IDs (optional for backward compatibility)

  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @IsNumber()
  @IsOptional()
  installments?: number;
}
