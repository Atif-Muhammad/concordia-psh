import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
} from 'class-validator';

enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}

export class CreateAdminDto {
  @IsOptional()
  id?: string;

  @IsNotEmpty({ message: 'admin name must be provided' })
  name: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  password: string;

  @IsEnum(AdminRole, { message: 'Role must be either SUPER_ADMIN or ADMIN' })
  role: AdminRole;
  @IsNotEmptyObject()
  permissions: {};
}
