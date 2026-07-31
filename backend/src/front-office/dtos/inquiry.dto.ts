import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsBoolean, MaxLength, Matches } from 'class-validator';
import {
  CNIC_MESSAGE,
  EMAIL_MESSAGE,
  PHONE_MESSAGE,
  PK_CNIC_REGEX,
  PK_PHONE_REGEX,
  emptyToUndefined,
  normalizePhoneForValidation,
} from 'src/common/validation/pk-validation';

enum InquiryStatus {
  NEW,
  APPROVED,
  REJECTED,
  FOLLOW_UP,
}

export enum InquiryType {
  PHYSICAL = 'PHYSICAL',
  HEAD_OFFICE = 'HEAD_OFFICE',
  REGIONAL_OFFICE = 'REGIONAL_OFFICE',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  TELEPHONE = 'TELEPHONE',
  REFERENCE = 'REFERENCE',
}

export class InquiryDto {
  @IsNotEmpty({ message: 'Student name must be provided' })
  @MaxLength(100)
  studentName: string;
  @IsNotEmpty({ message: 'Student CNIC/Form-B must be provided' })
  @Matches(PK_CNIC_REGEX, { message: CNIC_MESSAGE })
  @MaxLength(15)
  studentCnic: string;
  @IsNotEmpty({ message: 'Father name must be provided' })
  @MaxLength(100)
  fatherName: string;
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(PK_CNIC_REGEX, { message: CNIC_MESSAGE })
  @MaxLength(15)
  fatherCnic?: string;
  @IsNotEmpty({ message: 'Contact number must be provided' })
  @Transform(({ value }) => normalizePhoneForValidation(value))
  @Matches(PK_PHONE_REGEX, { message: PHONE_MESSAGE })
  @MaxLength(20)
  contactNumber: string;
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsEmail({}, { message: EMAIL_MESSAGE })
  @MaxLength(100)
  email?: string;
  @IsOptional()
  @MaxLength(500)
  address?: string;
  @IsNotEmpty({ message: 'Program interest must be provided' })
  @MaxLength(100)
  programInterest: string;
  @IsOptional()
  @MaxLength(100)
  previousInstitute?: string;
  @IsOptional()
  remarks?: any;
  @IsEnum(InquiryStatus)
  @IsOptional()
  status?: InquiryStatus;

  // New fields
  @IsOptional()
  inquiryType?: InquiryType;
  @IsOptional()
  gender?: string;
  @IsOptional()
  sessionId?: number;
  @IsOptional()
  @IsBoolean()
  prospectusSold?: boolean;
  @IsOptional()
  prospectusFee?: number;
  @IsOptional()
  prospectusReceipt?: string;
  @IsOptional()
  followUpDate?: string;
  @IsOptional()
  followUpSlab?: string;
  @IsOptional()
  referenceBody?: string;
}
