import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
  IsNumberString,
} from 'class-validator';
import { Transform } from 'class-transformer';
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
  @MaxLength(100)
  name: string;
  @IsOptional()
  @MaxLength(100)
  fatherName?: string;
  @IsNotEmpty({ message: 'teacher email must be provided' })
  @IsEmail({}, { message: EMAIL_MESSAGE })
  @MaxLength(100)
  email: string;
  @IsNotEmpty({ message: 'teacher password must be given' })
  @MaxLength(72)
  password: string;
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
  specialization?: string;
  @IsOptional()
  departmentId?: string;
  @IsNotEmpty({ message: 'teacher highest degree must be provided' })
  @MaxLength(100)
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
  @Transform(({ value }) => emptyToUndefined(value))
  @IsNumberString()
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
