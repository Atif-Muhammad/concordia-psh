import { IsString, IsDateString, IsOptional, IsNumber, MaxLength, Min } from 'class-validator';

export class UpdateRegistrationDto {
  @IsOptional()
  @IsString()
  hostelName?: string;

  @IsOptional()
  @IsDateString()
  registrationDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  studentId?: number;

  @IsOptional()
  @IsString()
  externalName?: string;

  @IsOptional()
  @IsString()
  externalInstitute?: string;

  @IsOptional()
  @IsString()
  externalGuardianName?: string;

  @IsOptional()
  @IsString()
  externalGuardianNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  guardianCnic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  studentCnic?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  decidedFeePerMonth?: number;
}
