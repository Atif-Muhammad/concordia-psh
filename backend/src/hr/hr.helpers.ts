/**
 * Pure helper functions extracted from HrService for testability.
 * Validates: Requirements 3.10, 3.11
 */

/**
 * Returns the inclusive calendar-day count between two dates.
 * Validates: Requirements 3.10
 */
export function computeDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

/**
 * Returns the YYYY-MM string derived from the start date.
 * Validates: Requirements 3.11
 */
export function deriveMonth(start: Date): string {
  return start.toISOString().slice(0, 7);
}
