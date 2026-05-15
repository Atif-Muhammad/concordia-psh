import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

/**
 * DTO for creating installments for a student (bulk-create endpoint).
 *
 * Requirements: 2.1, 2.2, 20.1
 */
export class CreateInstallmentDto {
  /**
   * The student to create installments for.
   */
  @IsNumber()
  @Min(1)
  studentId: number;

  /**
   * The academic session these installments belong to (optional).
   */
  @IsNumber()
  @Min(1)
  @IsOptional()
  sessionId?: number;

  /**
   * Number of installments to create (N).
   */
  @IsNumber()
  @Min(1)
  numberOfInstallments: number;

  /**
   * Fixed per-installment base amount.
   */
  @IsNumber()
  @Min(0)
  basePayable: number;

  /**
   * Array of ISO 8601 date strings, one per installment (length must equal numberOfInstallments).
   */
  @IsArray()
  @IsDateString({}, { each: true })
  dueDates: string[];
}
