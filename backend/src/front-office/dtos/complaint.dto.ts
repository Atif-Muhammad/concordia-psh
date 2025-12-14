import { IsNotEmpty } from 'class-validator';

export class ComplaintDto {
  @IsNotEmpty({ message: 'complaint type must be provided' })
  type: string;
  @IsNotEmpty({ message: 'complainant name must be provided' })
  complainantName: string;
  @IsNotEmpty({ message: 'complainant contact must be provided' })
  contact: number;
  @IsNotEmpty({ message: 'complaint subject must be provided' })
  subject: string;
  @IsNotEmpty({ message: 'complaint details must be provided' })
  details: string;
  @IsNotEmpty({ message: 'complaint status must be provided' })
  status: string;
}
