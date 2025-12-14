import { IsNotEmpty } from 'class-validator';

export class LeaveDto {
  @IsNotEmpty({ message: 'student must be selected.' })
  studentId: string;
  @IsNotEmpty({ message: 'reason must be stated.' })
  reason: string;

  @IsNotEmpty({ message: 'date must be selected' })
  fromDate: string;
  @IsNotEmpty({ message: 'date must be selected' })
  toDate: string;
}
