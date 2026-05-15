import { IsArray, IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO for bulk challan generation filtered by program/class/section/session.
 *
 * Requirements: 12.1, 12.5, 20.1
 */
export class BulkGenerateDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  programId?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  classId?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  sectionId?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  sessionId?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  /**
   * Specific student IDs to generate challans for (optional).
   * When provided, only these students are processed regardless of other filters.
   */
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  studentIds?: number[];

  /**
   * Target installment number to generate challan for (optional).
   * When provided, only generates challan for this specific installment number.
   * If not provided, finds the next available installment (existing behavior).
   */
  @IsNumber()
  @Min(1)
  @IsOptional()
  targetInstallmentNumber?: number;

  /**
   * Target month to generate challan for (optional).
   * When provided, only generates challan for installments with this month.
   * Alternative to targetInstallmentNumber for month-based selection.
   */
  @IsString()
  @IsOptional()
  targetMonth?: string;

  /**
   * Target year to generate challan for (optional).
   * Used in conjunction with targetMonth to pick the correct installment in long sessions.
   */
  @IsNumber()
  @IsOptional()
  targetYear?: number;
}
