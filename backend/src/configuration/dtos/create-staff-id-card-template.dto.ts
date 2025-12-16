import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStaffIDCardTemplateDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    htmlContent: string;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}
