import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsNumber,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { ContactCategory } from '@prisma/client';

export class ContactDto {
  @IsString()
  name: string;

  @IsNotEmpty()
  phone: number;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @ValidateIf((o) => o.email !== '')
  email?: string;

  @IsEnum(ContactCategory)
  category: ContactCategory;

  @IsOptional()
  @IsString()
  details?: string;
}
