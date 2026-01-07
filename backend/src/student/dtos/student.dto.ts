import { IsNotEmpty, IsOptional } from 'class-validator';

export class StudentDto {
  @IsNotEmpty({ message: 'First name must be provided' })
  fName: string;
  @IsOptional()
  mName?: string;
  @IsOptional()
  lName?: string;
  @IsNotEmpty({ message: "student's father or guardian must be provided" })
  fatherOrguardian: string;
  @IsNotEmpty({ message: 'Roll number must be specified' })
  rollNumber: string;
  @IsOptional()
  photo?: string;
  @IsOptional()
  photo_url?: string;
  @IsOptional()
  photo_public_id?: string;

  @IsOptional()
  parentOrGuardianEmail?: string;
  @IsNotEmpty({ message: "Parent/Guardian's phone must be provided" })
  parentOrGuardianPhone: string;
  @IsOptional()
  address?: string;
  @IsNotEmpty({ message: 'Gender must be selected' })
  gender: string;
  @IsNotEmpty({ message: 'Date of Birth must be selected' })
  dob: string;
  @IsNotEmpty({ message: "student's class must be selected" })
  classId: string;
  @IsNotEmpty({ message: "student's program must be selected" })
  programId: string;
  @IsOptional()
  sectionId?: string;
  @IsNotEmpty({ message: 'Provided Documents must be selected' })
  documents: string;
  @IsOptional()
  inquiryId?: string;
  @IsOptional()
  status?: string;
}
