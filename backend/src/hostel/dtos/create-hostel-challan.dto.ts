import { IsNotEmpty, IsString, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateHostelChallanDto {
  @IsNotEmpty() @IsString()
  registrationId: string;

  @IsNotEmpty() @IsString()
  month: string; // e.g. "January 2026"

  @IsNotEmpty() @IsDateString()
  dueDate: string;

  @IsOptional() @IsNumber() @Min(0)
  fineAmount?: number; // custom fine

  @IsOptional() @IsNumber() @Min(0)
  discount?: number;

  @IsOptional() @IsString()
  remarks?: string;
}
