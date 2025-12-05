import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateRegistrationDto {
  @IsNotEmpty()
  studentId: number;

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
