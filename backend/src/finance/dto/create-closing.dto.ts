import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreateClosingDto {
    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsNumber()
    @IsNotEmpty()
    totalIncome: number;

    @IsNumber()
    @IsNotEmpty()
    totalExpense: number;

    @IsNumber()
    @IsNotEmpty()
    netBalance: number;

    @IsString()
    remarks?: string;
}
