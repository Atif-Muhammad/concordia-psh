import { IsNotEmpty, IsOptional } from 'class-validator';

export class TsmDto {
  @IsOptional()
  id?: string;

  @IsNotEmpty({ message: 'teacher must be provided' })
  teacherId: string;
  @IsNotEmpty({ message: 'subject must be provided' })
  subjectId: string;
}
