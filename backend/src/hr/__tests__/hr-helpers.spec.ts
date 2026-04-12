import * as fc from 'fast-check';
import { computeDays, deriveMonth } from '../hr.helpers';

// Feature: hr-staff-leave-payroll-overhaul, Property 3
describe('computeDays', () => {
  it('equals offset + 1 for any start date and non-negative offset up to 365', () => {
    // Validates: Requirements 3.10
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        fc.integer({ min: 0, max: 365 }),
        (start, offset) => {
          const end = new Date(start);
          end.setDate(end.getDate() + offset);
          const result = computeDays(start, end);
          expect(result).toBe(offset + 1);
        },
      ),
      { numRuns: 20 },
    );
  });
});

// Feature: hr-staff-leave-payroll-overhaul, Property 4
describe('deriveMonth', () => {
  it('equals the YYYY-MM prefix of the date ISO string for any date', () => {
    // Validates: Requirements 3.11
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
        (d) => {
          // Skip invalid dates
          fc.pre(!isNaN(d.getTime()));
          
          const result = deriveMonth(d);
          expect(result).toBe(d.toISOString().slice(0, 7));
        },
      ),
      { numRuns: 20 },
    );
  });
});
