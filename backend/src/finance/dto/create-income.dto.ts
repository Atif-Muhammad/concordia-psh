import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreateIncomeDto {
    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @IsNotEmpty()
    amount: number;
}
