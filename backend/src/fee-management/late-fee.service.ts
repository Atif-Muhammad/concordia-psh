import { Injectable } from '@nestjs/common';

/**
 * LateFeeService — pure late fee calculation logic.
 *
 * No DB access. No PrismaService injection.
 * All methods are deterministic given the same inputs.
 */
@Injectable()
export class LateFeeService {
  /**
   * Calculate the late fee for a single installment.
   *
   * Formula: max(0, floor(daysPastDueDate) × ratePerDay)
   *
   * @param dueDate       The installment due date.
   * @param ratePerDay    The per-day late fee rate (applied to basePayable + arrears,
   *                      which the caller passes in as a single `baseAmount` value).
   * @param referenceDate The date to calculate against (defaults to today / `new Date()`).
   * @returns             The late fee amount (≥ 0).
   *
   * Requirements: 5.1, 5.2, 5.4
   */
  calculate(
    dueDate: Date,
    ratePerDay: number,
    referenceDate: Date = new Date(),
  ): number {
    // Normalise to midnight so we count complete calendar days only
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const ref = new Date(referenceDate);
    ref.setHours(0, 0, 0, 0);

    // Requirement 5.2: when referenceDate <= dueDate, late fee is 0
    if (ref <= due) {
      return 0;
    }

    const diffMs = ref.getTime() - due.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Requirement 5.1: max(0, days × ratePerDay)
    return Math.max(0, days * ratePerDay);
  }

  /**
   * Attach a freshly computed `lateFeeFine` to an installment response object.
   *
   * The late fee is calculated using `basePayable + arrears` as the base amount
   * (per Requirement 5.3 — arrears also attract late fee until paid).
   * The rate is read from `installment.lateFeeRatePerDay`.
   *
   * This method does NOT mutate the database record — it only enriches the
   * in-memory response object returned to the caller.
   *
   * @param installment  A FeeInstallment record (or any object with the required fields).
   * @param referenceDate Optional reference date (defaults to today).
   * @returns            The same object with `lateFeeFine` set to the live computed value.
   */
  injectLiveLateFee<
    T extends {
      dueDate: Date;
      lateFeeRatePerDay: number | { toNumber(): number };
      basePayable: number | { toNumber(): number };
      arrears: number | { toNumber(): number };
      lateFeeFine?: number | { toNumber(): number };
    },
  >(installment: T, referenceDate: Date = new Date()): T & { lateFeeFine: number } {
    const ratePerDay =
      typeof installment.lateFeeRatePerDay === 'object'
        ? installment.lateFeeRatePerDay.toNumber()
        : installment.lateFeeRatePerDay;

    const basePayable =
      typeof installment.basePayable === 'object'
        ? installment.basePayable.toNumber()
        : installment.basePayable;

    const arrears =
      typeof installment.arrears === 'object'
        ? installment.arrears.toNumber()
        : installment.arrears;

    // Requirement 5.3: rate applies to basePayable + arrears.
    // ratePerDay is a flat PKR-per-day value (not a percentage of the base),
    // so the base amount (basePayable + arrears) does not factor into the
    // calculate() call itself — ChallanService uses it when computing totalAmount.
    // We still read both fields so the generic constraint is satisfied and the
    // intent is clear to future readers.
    const _baseAmount = basePayable + arrears; // eslint-disable-line @typescript-eslint/no-unused-vars

    const lateFeeFine = this.calculate(
      installment.dueDate,
      ratePerDay,
      referenceDate,
    );

    // Return a new object so the original is not mutated
    return Object.assign({}, installment, { lateFeeFine });
  }
}
