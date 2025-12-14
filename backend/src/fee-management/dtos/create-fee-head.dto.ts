import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  isRegistrationFee?: boolean;

  @IsBoolean()
  @IsOptional()
  isAdmissionFee?: boolean;

  @IsBoolean()
  @IsOptional()
  isProspectusFee?: boolean;

  @IsBoolean()
  @IsOptional()
  isExaminationFee?: boolean;

  @IsBoolean()
  @IsOptional()
  isAlliedCharges?: boolean;

  @IsBoolean()
  @IsOptional()
  isHostelFee?: boolean;

  @IsBoolean()
  @IsOptional()
  isOther?: boolean;
}
