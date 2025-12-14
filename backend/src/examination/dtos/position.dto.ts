import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePositionDto {
  @IsNotEmpty()
  @IsNumber()
  examId: number;

  @IsNotEmpty()
  @IsNumber()
  classId: number;

  @IsNotEmpty()
  @IsNumber()
  studentId: number;

  @IsNotEmpty()
  @IsNumber()
  position: number;

  @IsNotEmpty()
  @IsNumber()
  totalMarks: number;

  @IsNotEmpty()
  @IsNumber()
  obtainedMarks: number;

  @IsNotEmpty()
  @IsNumber()
  percentage: number;

  @IsNotEmpty()
  @IsNumber()
  gpa: number;

  @IsNotEmpty()
  @IsString()
  grade: string;
}

export class UpdatePositionDto {
  @IsOptional()
  @IsNumber()
  examId?: number;

  @IsOptional()
  @IsNumber()
  classId?: number;

  @IsOptional()
  @IsNumber()
  studentId?: number;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @IsOptional()
  @IsNumber()
  obtainedMarks?: number;

  @IsOptional()
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @IsNumber()
  gpa?: number;

  @IsOptional()
  @IsString()
  grade?: string;
}
