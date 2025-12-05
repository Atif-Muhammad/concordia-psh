import { PartialType } from '@nestjs/mapped-types';
import { CreateFeeChallanDto } from './create-fee-challan.dto';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFeeChallanDto extends PartialType(CreateFeeChallanDto) {
    @IsString()
    @IsOptional()
    status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';

    @IsNumber()
    @IsOptional()
    paidAmount?: number;
    
    @IsString()
    @IsOptional()
    paidDate?: string;

    @IsArray()
    @IsOptional()
    selectedHeads?: number[];
}
