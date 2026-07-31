import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumberString, IsOptional, Matches, MaxLength } from 'class-validator';
import {
  CNIC_MESSAGE,
  EMAIL_MESSAGE,
  PHONE_MESSAGE,
  PK_CNIC_REGEX,
  PK_PHONE_REGEX,
  emptyToUndefined,
  normalizePhoneForValidation,
} from 'src/common/validation/pk-validation';

export class StudentDto {
  @IsNotEmpty({ message: 'First name must be provided' })
  @MaxLength(100)
  fName: string;
  @IsOptional()
  @MaxLength(100)
  lName?: string;
  @IsNotEmpty({ message: 'Session must be selected' })
  session: string;
  @IsOptional()
  sessionId?: string;
  @IsNotEmpty({ message: 'Admission Date must be selected' })
  admissionDate: string;
  @IsNotEmpty({ message: "student's father or guardian must be provided" })
  @MaxLength(100)
  fatherOrguardian: string;
  @IsNotEmpty({ message: 'Roll number must be specified' })
  @MaxLength(50)
  rollNumber: string;
  @IsOptional()
  photo?: string;
  @IsOptional()
  photo_url?: string;
  @IsOptional()
  photo_public_id?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsEmail({}, { message: EMAIL_MESSAGE })
  @MaxLength(100)
  parentOrGuardianEmail?: string;
  @IsNotEmpty({ message: "Parent/Guardian's phone must be provided" })
  @Transform(({ value }) => normalizePhoneForValidation(value))
  @Matches(PK_PHONE_REGEX, { message: PHONE_MESSAGE })
  @MaxLength(20)
  parentOrGuardianPhone: string;
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(PK_CNIC_REGEX, { message: CNIC_MESSAGE })
  @MaxLength(15)
  parentCNIC?: string;
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(PK_CNIC_REGEX, { message: CNIC_MESSAGE })
  @MaxLength(15)
  studentCnic?: string;
  @IsOptional()
  @MaxLength(500)
  address?: string;
  @IsNotEmpty({ message: 'Gender must be selected' })
  gender: string;
  @IsOptional()
  @MaxLength(100)
  religion?: string;
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

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsNumberString()
  tuitionFee?: number;
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsNumberString()
  numberOfInstallments?: number;
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsNumberString()
  lateFeeFine?: number;
  @IsOptional()
  installments?: string; // JSON string for multipart/form-data

  // Previous academic info
  @IsOptional()
  @MaxLength(50)
  admissionFormNumber?: string;
  @IsOptional()
  @MaxLength(100)
  previousBoardName?: string;
  @IsOptional()
  @MaxLength(50)
  previousBoardRollNumber?: string;
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsNumberString()
  obtainedMarks?: number;
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsNumberString()
  totalMarks?: number;
}
