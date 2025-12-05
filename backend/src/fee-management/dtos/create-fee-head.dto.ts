import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFeeHeadDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isDiscount?: boolean;

  @IsBoolean()
  @IsOptional()
  isTuition?: boolean;

  @IsBoolean()
  @IsOptional()
  isFine?: boolean;

  @IsBoolean()
  @IsOptional()
  isLabFee?: boolean;

  @IsBoolean()
  @IsOptional()
  isLibraryFee?: boolean;
}
