import { IsNotEmpty, IsOptional } from "class-validator";


export class CreateExamDto {
  @IsNotEmpty({message: "exam name must be provided"})
  examName: string;
  @IsNotEmpty({message: "exam program must be specified"})
  programId: number;
  @IsOptional()
  classId?: number;
  @IsNotEmpty({message: "session must be provided"})
  session: string;
  @IsNotEmpty({message: "exam type must be provided"})
  type: string;
  @IsNotEmpty({message: "exam start date must be provided"})
  startDate: string;
  @IsNotEmpty({message: "exam end date must be provided"})
  endDate: string;
  @IsOptional()
  description?: string;
}

export class UpdateExamDto extends CreateExamDto {}
