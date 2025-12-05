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
}
