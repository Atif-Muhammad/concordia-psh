import { IsNotEmpty, IsOptional } from 'class-validator';

export class SubjectDto {
  @IsOptional()
  id?: string;
  @IsNotEmpty({ message: 'Subject name must be provided' })
  name: string;
  @IsNotEmpty({ message: 'class must be specified' })
  classId: string | number;
  @IsOptional()
  code: string;
  @IsOptional()
  creditHours: string | number;
  @IsOptional()
  description?: string;
}
