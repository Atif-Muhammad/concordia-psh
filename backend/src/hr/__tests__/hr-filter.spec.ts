import * as fc from 'fast-check';
import { HrService } from '../hr.service';
import { StaffLeaveStatus, StaffLeaveType } from '@prisma/client';

// Feature: hr-staff-leave-payroll-overhaul, Property 1
describe('HrService.getStaffLeaves — filter correctness', () => {
  let service: HrService;
  let findManySpy: jest.Mock;

  beforeEach(() => {
    findManySpy = jest.fn().mockResolvedValue([]);

    const mockPrisma = {
      staffLeave: {
        findMany: findManySpy,
      },
    } as any;

    service = new HrService(mockPrisma);
  });

  it('passes exactly the provided filters in the where clause to findMany', async () => {
    // Validates: Requirements 3.1, 3.2, 3.3, 6.3
    await fc.assert(
      fc.asyncProperty(
        fc.record(
          {
            month: fc.option(
              fc.stringMatching(/^\d{4}-(0[1-9]|1[0-2])$/).filter((s) => s.length === 7),
              { nil: undefined },
            ),
            staffId: fc.option(fc.integer({ min: 1, max: 9999 }), {
              nil: undefined,
            }),
            status: fc.option(
              fc.constantFrom(...Object.values(StaffLeaveStatus)),
              { nil: undefined },
            ),
            leaveType: fc.option(
              fc.constantFrom(...Object.values(StaffLeaveType)),
              { nil: undefined },
            ),
          },
          { requiredKeys: [] },
        ),
        async (filters) => {
          findManySpy.mockClear();

          await service.getStaffLeaves(filters as any);

          expect(findManySpy).toHaveBeenCalledTimes(1);

          const callArgs = findManySpy.mock.calls[0][0];
          const where = callArgs?.where ?? {};

          // Each filter that was provided must appear in the where clause
          if (filters.month !== undefined) {
            expect(where.month).toBe(filters.month);
          } else {
            expect(where).not.toHaveProperty('month');
          }

          if (filters.staffId !== undefined) {
            expect(where.staffId).toBe(filters.staffId);
          } else {
            expect(where).not.toHaveProperty('staffId');
          }

          if (filters.status !== undefined) {
            expect(where.status).toBe(filters.status);
          } else {
            expect(where).not.toHaveProperty('status');
          }

          if (filters.leaveType !== undefined) {
            expect(where.leaveType).toBe(filters.leaveType);
          } else {
            expect(where).not.toHaveProperty('leaveType');
          }
        },
      ),
      { numRuns: 20 },
    );
  });
});
