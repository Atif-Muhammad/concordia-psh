import { IsString, IsDateString, IsOptional } from 'class-validator';

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
}
