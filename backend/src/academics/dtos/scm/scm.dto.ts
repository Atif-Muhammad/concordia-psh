import { IsNotEmpty, IsOptional } from 'class-validator';

export class ScmDto {
  @IsNotEmpty()
  subjectId: string | number;

  @IsNotEmpty()
  classId: string | number;

  @IsOptional()
  creditHours?: string | number;

  @IsOptional()
  code?: string;

  @IsOptional()
  description?: string;
}
