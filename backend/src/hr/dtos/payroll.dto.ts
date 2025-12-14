import { IsNumber, IsOptional, IsString, IsInt } from 'class-validator';

export class UpsertPayrollDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  month: string;

  @IsOptional()
  @IsInt()
  employeeId?: number;

  @IsOptional()
  @IsInt()
  teacherId?: number;

  @IsNumber()
  basicSalary: number;

  @IsNumber()
  securityDeduction: number;

  @IsNumber()
  advanceDeduction: number;

  @IsNumber()
  absentDeduction: number;

  @IsNumber()
  otherDeduction: number;

  @IsNumber()
  @IsOptional()
  incomeTax?: number;

  @IsNumber()
  @IsOptional()
  eobi?: number;

  @IsNumber()
  @IsOptional()
  lateArrivalDeduction?: number;

  @IsNumber()
  extraAllowance: number;

  @IsNumber()
  travelAllowance: number;

  @IsNumber()
  @IsOptional()
  houseRentAllowance?: number;

  @IsNumber()
  @IsOptional()
  medicalAllowance?: number;

  @IsNumber()
  @IsOptional()
  insuranceAllowance?: number;

  @IsNumber()
  otherAllowance: number;

  @IsString()
  status: string;
}
