import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFeeChallanDto {
  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @IsNumber()
  @IsOptional()
  feeStructureId?: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  @IsOptional()
  fineAmount?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  coveredInstallments?: string;

  @IsArray()
  @IsOptional()
  selectedHeads?: number[];

  @IsNumber()
  @IsOptional()
  installmentNumber?: number;

  @IsOptional()
  isArrearsPayment?: boolean;

  @IsNumber()
  @IsOptional()
  arrearsInstallments?: number;

  @IsNumber()
  @IsOptional()
  arrearsSessionClassId?: number;

  @IsNumber()
  @IsOptional()
  arrearsSessionProgramId?: number;

  @IsNumber()
  @IsOptional()
  arrearsSessionFeeStructureId?: number;

  @IsNumber()
  @IsOptional()
  studentArrearId?: number;

  @IsNumber()
  @IsOptional()
  paidAmount?: number;
}
