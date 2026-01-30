import {
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
} from 'class-validator';

enum StaffType {
  PERMANENT,
  CONTRACT,
}

enum StaffStatus {
  ACTIVE,
  TERMINATED,
  RETIRED,
}

export class TeacherDto {
  @IsOptional()
  id?: string;
  @IsNotEmpty({ message: 'teacher name must be provided' })
  name: string;
  @IsOptional()
  fatherName?: string;
  @IsNotEmpty({ message: 'teacher email must be provided' })
  email: string;
  @IsNotEmpty({ message: 'teacher password must be given' })
  password: string;
  @IsOptional()
  phone?: string;
  @IsOptional()
  cnic?: string;
  @IsOptional()
  address?: string;
  @IsOptional()
  specialization?: string;
  @IsOptional()
  departmentId?: string;
  @IsNotEmpty({ message: 'teacher highest degree must be provided' })
  highestDegree: string;
  @IsOptional()
  documents: {
    bsDegree: boolean;
    msDegree: boolean;
    phd: boolean;
    postDoc: boolean;
    experienceLetter: boolean;
    cv: boolean;
  };
  @IsEnum(StaffType)
  @IsOptional()
  staffType?: StaffType;
  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
  @IsOptional()
  basicPay?: string;
  @IsOptional()
  joinDate?: string;
  @IsOptional()
  photo_url?: string;
  @IsOptional()
  photo_public_id?: string;
  @IsOptional()
  contractStart?: string;
  @IsOptional()
  contractEnd?: string;
}
