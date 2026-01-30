import { IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

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
  permissions?: string | any;

  // Common fields
  @IsNotEmpty({ message: 'Staff name must be provided' })
  name: string;

  @IsOptional()
  fatherName?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  password?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  cnic?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  photo_url?: string;

  @IsOptional()
  photo_public_id?: string;

  @IsOptional()
  staffType?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
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
  @IsBoolean()
  isTeaching?: boolean;

  @IsOptional()
  @IsBoolean()
  isNonTeaching?: boolean;

  // Teaching-specific fields
  @IsOptional()
  specialization?: string;

  @IsOptional()
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
  designation?: string;

  @IsOptional()
  empDepartment?: string;
}
