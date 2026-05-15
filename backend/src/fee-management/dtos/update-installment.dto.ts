import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

/**
 * DTO for updating allowed fields on a FeeInstallment.
 *
 * All fields are optional — only provided fields will be updated.
 * Locked installments (isLocked = TRUE) reject all updates.
 *
 * Requirements: 7.1, 11.2, 17.4
 */
export class UpdateInstallmentDto {
  /**
   * The fixed per-installment base amount.
   * Requirements: 7.1, 11.2
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  basePayable?: number;

  /**
   * Total discount applied to this installment.
   * Requirements: 17.1, 17.4
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  /**
   * The installment due date (ISO 8601 date string).
   * Requirements: 7.1, 11.2
   */
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  /**
   * Per-day late fee rate for this installment.
   * Requirements: 7.1, 11.2
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  lateFeeRatePerDay?: number;

  /**
   * Manual extra fine amount.
   * Requirements: 9.1
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  extraFine?: number;
}
