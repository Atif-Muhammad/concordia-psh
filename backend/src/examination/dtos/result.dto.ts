export class CreateResultDto {
  examId: string;
  studentId: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  gpa: number;
  grade: string;
  position?: number;
  remarks?: string;
}

export class UpdateResultDto extends CreateResultDto {}
