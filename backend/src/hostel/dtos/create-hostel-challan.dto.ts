import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * A single fee head entry for a hostel challan.
 */
export class HostelChallanHeadDto {
  @IsString()
  headName: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

/**
 * DTO for creating a monthly HOSTEL challan for a student.
 */
export class CreateHostelChallanDto {
  /**
   * The hostel registration ID (HSTLxxxx).
   */
  @IsNotEmpty()
  @IsString()
  hostelRegNumber: string;

  /**
   * Month for this challan (e.g. "January 2026").
   */
  @IsOptional()
  @IsString()
  month?: string;

  /**
   * IDs of the predefined fee heads to include.
   */
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  feeHeadIds?: number[];

  /**
   * Ad-hoc custom heads.
   */
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HostelChallanHeadDto)
  heads?: HostelChallanHeadDto[];

  /**
   * Due date for this challan (ISO 8601 date string).
   */
  @IsDateString()
  dueDate: string;

  /**
   * Optional free-text remarks.
   */
  @IsString()
  @IsOptional()
  remarks?: string;
}
