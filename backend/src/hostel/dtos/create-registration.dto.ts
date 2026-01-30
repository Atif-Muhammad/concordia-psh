import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateRegistrationDto {
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

  @IsNotEmpty()
  @IsString()
  hostelName: string;

  @IsNotEmpty()
  @IsDateString()
  registrationDate: string;

  @IsOptional()
  @IsString()
  status?: string;
}
