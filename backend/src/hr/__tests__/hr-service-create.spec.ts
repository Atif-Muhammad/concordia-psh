import * as fc from 'fast-check';
import { BadRequestException } from '@nestjs/common';
import { HrService } from '../hr.service';

// Feature: hr-staff-leave-payroll-overhaul, Property 5
describe('HrService.createStaffLeave — invalid date range rejection', () => {
  let service: HrService;

  beforeEach(() => {
    // Minimal PrismaService stub — staffLeave.create should never be reached
    const mockPrisma = {
      staffLeave: {
        create: jest.fn(),
      },
    } as any;

    service = new HrService(mockPrisma);
  });

  it('throws BadRequestException for any startDate strictly after endDate', async () => {
    // Validates: Requirements 3.5
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        async (d1, d2) => {
          // Skip invalid dates
          fc.pre(!isNaN(d1.getTime()) && !isNaN(d2.getTime()));

          // Ensure start is strictly after end
          const start = d1 > d2 ? d1 : d2;
          const end = d1 > d2 ? d2 : d1;

          // Skip equal dates — only test strictly start > end
          fc.pre(start.getTime() !== end.getTime());

          const dto = {
            staffId: 1,
            leaveType: 'CASUAL' as any,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            reason: 'test',
          };

          await expect(service.createStaffLeave(dto)).rejects.toBeInstanceOf(
            BadRequestException,
          );
        },
      ),
      { numRuns: 20 },
    );
  });
});
