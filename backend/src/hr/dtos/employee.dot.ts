import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

enum EmployeeDepartment {
  ADMIN,
  FINANCE,
  SECURITY,
  TRANSPORT,
  CLASS_4,
  MAINTENANCE,
  IT_SUPPORT,
  LIBRARY,
  LAB,
  OTHER,
}

enum EmploymentType {
  PERMANENT,
  CONTRACT,
}

enum EmployeeStatus {
  ACTIVE,
  TERMINATED,
  RETIRED,
}

export class EmployeeDto {
  @IsNotEmpty({ message: 'Employee name must be provided' })
  name: string;
  @IsNotEmpty({ message: 'Employee father name must be provided' })
  fatherName: string;
  @IsNotEmpty({ message: 'Employee CNIC must be provided' })
  cnic: string;
  @IsNotEmpty({ message: 'Employee contact must be provided' })
  contactNumber: string;
  @IsOptional()
  email?: string;
  @IsOptional()
  address?: string;

  @IsNotEmpty({ message: 'Employee designation must be provided' })
  designation: string;
  @IsEnum(EmployeeDepartment, {
    message: 'Employee department must be provided',
  })
  empDepartment: EmployeeDepartment;

  @IsEnum(EmploymentType, { message: 'Employee type must be provided' })
  staffType: EmploymentType;
  @IsEnum(EmployeeStatus, { message: 'Employee status must be provided' })
  status: EmployeeStatus;
  @IsOptional()
  basicPay?: string;
  @IsOptional()
  joinDate?: string;
  @IsOptional()
  leaveDate?: string;
  @IsOptional()
  photo_url?: string;
  @IsOptional()
  photo_public_id?: string;
  @IsOptional()
  contractStart?: string;
  @IsOptional()
  contractEnd?: string;
}
