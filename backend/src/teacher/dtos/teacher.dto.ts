import {
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
} from 'class-validator';

enum TeacherType {
  PERMANENT,
  CONTRACT,
}

enum TeacherStatus {
  ACTIVE,
  TERMINATED,
  RETIRED,
}

export class TeacherDto {
  @IsOptional()
  id?: string;
  @IsNotEmpty({ message: 'teacher name must be provided' })
  name: string;
  @IsNotEmpty({ message: 'Father Name must be provided' })
  fatherName: string;
  @IsNotEmpty({ message: 'teacher email must be provided' })
  email: string;
  @IsNotEmpty({ message: 'teacher password must be given' })
  password: string;
  @IsNotEmpty({ message: 'teacher phone must be provided' })
  phone: string;
  @IsOptional()
  cnic?: string;
  @IsOptional()
  address?: string;
  @IsNotEmpty({ message: 'teacher specialization must be provided' })
  specialization: string;
  @IsNotEmpty({ message: "teacher's department must be provided" })
  departmentId: string;
  @IsNotEmpty({ message: 'teacher highest degree must be provided' })
  highestDegree: string;
  @IsNotEmptyObject()
  documents: {
    bsDegree: boolean;
    msDegree: boolean;
    phd: boolean;
    postDoc: boolean;
    experienceLetter: boolean;
    cv: boolean;
  };
  @IsEnum(TeacherType)
  @IsOptional()
  teacherType?: TeacherType;
  @IsEnum(TeacherStatus)
  @IsOptional()
  teacherStatus?: TeacherStatus;
  @IsOptional()
  basicPay?: string;
  @IsOptional()
  photo_url?: string;
  @IsOptional()
  photo_public_id?: string;
}
