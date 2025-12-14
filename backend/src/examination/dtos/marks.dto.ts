import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMarksDto {
  @IsNotEmpty({ message: 'exam must be selected' })
  examId: string;
  @IsNotEmpty({ message: 'student must be selected' })
  studentId: string;
  @IsNotEmpty({ message: 'subject must be selected' })
  subject: string;
  @IsNotEmpty({ message: 'total must be provided' })
  totalMarks: number;
  @IsNotEmpty({ message: 'obtained marks must be provided' })
  obtainedMarks: number;
  @IsOptional()
  teacherRemarks?: string;
}

export class UpdateMarksDto extends CreateMarksDto {}
