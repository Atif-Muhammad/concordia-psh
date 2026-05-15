import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO for recording a payment against a FeeChallanV2.
 *
 * Requirements: 6.1, 6.4, 20.1
 */
export class RecordPaymentDto {
  /**
   * The FeeChallanV2 id to record the payment against.
   */
  @IsNumber()
  @Min(1)
  challanId: number;

  /**
   * The payment amount received.
   */
  @IsNumber()
  @Min(0.01)
  amount: number;

  /**
   * Payment mode (e.g. "Cash", "Bank", "Online").
   */
  @IsString()
  paymentMode: string;

  /**
   * The date the payment was received (ISO 8601 date string).
   */
  @IsDateString()
  paidDate: string;

  /**
   * Optional free-text remarks.
   */
  @IsString()
  @IsOptional()
  remarks?: string;
}
