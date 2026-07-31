import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, Matches, MaxLength, IsNumberString } from 'class-validator';
import {
  CNIC_MESSAGE,
  EMAIL_MESSAGE,
  PHONE_MESSAGE,
  PK_CNIC_REGEX,
  PK_PHONE_REGEX,
  emptyToUndefined,
  normalizePhoneForValidation,
} from 'src/common/validation/pk-validation';

enum StaffType {
  PERMANENT = 'PERMANENT',
  CONTRACT = 'CONTRACT',
}

enum StaffStatus {
  ACTIVE = 'ACTIVE',
  TERMINATED = 'TERMINATED',
  RETIRED = 'RETIRED',
}

enum EmployeeDepartment {
  ADMIN = 'ADMIN',
  FINANCE = 'FINANCE',
  SECURITY = 'SECURITY',
  TRANSPORT = 'TRANSPORT',
  CLASS_4 = 'CLASS_4',
  MAINTENANCE = 'MAINTENANCE',
  IT_SUPPORT = 'IT_SUPPORT',
  LIBRARY = 'LIBRARY',
  LAB = 'LAB',
  OTHER = 'OTHER',
}

export class StaffDto {
  @IsOptional()
  id?: number;

  @IsOptional()
  staffId?: string;

  @IsOptional()
  permissions?: string | any;

  // Common fields
  @IsNotEmpty({ message: 'Staff name must be provided' })
  @MaxLength(100)
  name: string;

  @IsOptional()
  @MaxLength(100)
  fatherName?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsEmail({}, { message: EMAIL_MESSAGE })
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @MaxLength(72)
  password?: string;

  @IsOptional()
  @Transform(({ value }) => normalizePhoneForValidation(value))
  @Matches(PK_PHONE_REGEX, { message: PHONE_MESSAGE })
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @Matches(PK_CNIC_REGEX, { message: CNIC_MESSAGE })
  @MaxLength(15)
  cnic?: string;

  @IsOptional()
  @MaxLength(500)
  address?: string;
  @IsOptional()
  @MaxLength(100)
  religion?: string;

  @IsOptional()
  photo_url?: string;

  @IsOptional()
  photo_public_id?: string;

  @IsOptional()
  staffType?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsNumberString()
  basicPay?: string;

  @IsOptional()
  joinDate?: string;

  @IsOptional()
  leaveDate?: string;

  @IsOptional()
  contractStart?: string;

  @IsOptional()
  contractEnd?: string;

  // Role flags
  @IsOptional()
  isTeaching?: boolean;

  @IsOptional()
  isNonTeaching?: boolean;

  // Teaching-specific fields
  @IsOptional()
  @MaxLength(100)
  specialization?: string;

  @IsOptional()
  @MaxLength(100)
  highestDegree?: string;

  @IsOptional()
  departmentId?: string;

  @IsOptional()
  documents?: {
    bsDegree: boolean;
    msDegree: boolean;
    phd: boolean;
    postDoc: boolean;
    experienceLetter: boolean;
    cv: boolean;
  };

  // Non-teaching specific fields
  @IsOptional()
  @MaxLength(100)
  designation?: string;

  @IsOptional()
  empDepartment?: string;

  // Per-staff leave settings
  @IsOptional()
  sickAllowed?: string;

  @IsOptional()
  sickDeduction?: string;

  @IsOptional()
  annualAllowed?: string;

  @IsOptional()
  annualDeduction?: string;

  @IsOptional()
  casualAllowed?: string;

  @IsOptional()
  casualDeduction?: string;
}
