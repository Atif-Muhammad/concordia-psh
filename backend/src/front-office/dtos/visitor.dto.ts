import { IsNotEmpty, IsOptional } from 'class-validator';

export class VisitorDto {
  @IsNotEmpty({ message: "visitor's name must be provided" })
  visitorName: string;
  @IsNotEmpty({ message: "visitor's contact must be provided" })
  phoneNumber: string;
  @IsNotEmpty({ message: "visitor's ID must be provided" })
  ID: string;
  @IsNotEmpty({ message: "visitor's ID must be provided" })
  purpose: string;
  @IsNotEmpty({ message: 'number of visitors must be provided' })
  persons: string;
  @IsNotEmpty({ message: 'visit date must be provided' })
  visitDate: string;
  @IsNotEmpty({ message: 'in-time must be provided' })
  inTime: string;
  @IsOptional()
  outTime?: string;
  @IsOptional()
  remarks?: string;
}
