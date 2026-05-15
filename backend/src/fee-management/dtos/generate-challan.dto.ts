import { IsDateString, IsNumber, Min } from 'class-validator';

/**
 * DTO for generating a challan for a single installment.
 *
 * Requirements: 3.1, 20.1
 */
export class GenerateChallanDto {
  /**
   * The FeeInstallment id to generate a challan for.
   */
  @IsNumber()
  @Min(1)
  installmentId: number;

  /**
   * The due date for the challan (ISO 8601 date string).
   */
  @IsDateString()
  dueDate: string;
}
