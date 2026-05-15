import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * A single fee head entry for an extra challan.
 */
export class ExtraChallanHeadDto {
  @IsString()
  headName: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

/**
 * DTO for creating a standalone EXTRA-type challan for a student.
 *
 * Requirements: 8.1, 8.3, 8.4, 20.1
 */
export class ExtraChallanDto {
  /**
   * The student to bill.
   */
  @IsNumber()
  @Min(1)
  @IsOptional()
  studentId?: number;

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  studentIds?: number[];

  /**
   * IDs of the fee heads to include in this challan.
   */
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  feeHeadIds?: number[];

  /**
   * Legacy heads for backward compatibility (optional)
   */
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExtraChallanHeadDto)
  heads?: ExtraChallanHeadDto[];

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
