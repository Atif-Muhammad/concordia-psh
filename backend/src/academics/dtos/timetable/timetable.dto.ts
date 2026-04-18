import { IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class TimetableSlotDto {
  @IsNotEmpty()
  dayOfWeek: string;
  @IsNotEmpty()
  startTime: string;
  @IsNotEmpty()
  endTime: string;
  @IsNotEmpty()
  subjectId: number;
}

export class ClassTimetableDto {
  @IsNotEmpty()
  classId: number;
  @IsOptional()
  sectionId?: number | null;
  @IsOptional()
  sessionId?: number | null;
  @IsArray()
  slots: TimetableSlotDto[];
}
