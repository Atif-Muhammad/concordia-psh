import { IsNotEmpty, IsOptional, IsEmail, IsString } from 'class-validator';

export class CreateInstituteSettingsDto {
    @IsNotEmpty({ message: 'Institute name must be provided' })
    @IsString()
    instituteName: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    facebook?: string;

    @IsOptional()
    @IsString()
    instagram?: string;

    @IsOptional()
    @IsString()
    logo?: string;
}
