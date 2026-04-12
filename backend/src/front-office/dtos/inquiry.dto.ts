import { IsEnum, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

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
  studentName: string;
  @IsNotEmpty({ message: 'Father name must be provided' })
  fatherName: string;
  @IsOptional()
  fatherCnic?: string;
  @IsNotEmpty({ message: 'Contact number must be provided' })
  contactNumber: string;
  @IsOptional()
  email?: string;
  @IsOptional()
  address?: string;
  @IsNotEmpty({ message: 'Program interest must be provided' })
  programInterest: string;
  @IsOptional()
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
}
