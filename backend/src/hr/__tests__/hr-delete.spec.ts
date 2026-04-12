import * as fc from 'fast-check';
import { NotFoundException } from '@nestjs/common';
import { HrService } from '../hr.service';
import { StaffLeaveType, StaffLeaveStatus, Prisma } from '@prisma/client';

// Feature: hr-staff-leave-payroll-overhaul, Property 7
describe('HrService.deleteStaffLeave — delete removes record', () => {
  let service: HrService;
  let mockPrisma: any;

  beforeEach(() => {
    // Mock PrismaService with staffLeave operations
    mockPrisma = {
      staffLeave: {
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    } as any;

    service = new HrService(mockPrisma);
  });

  it('after deleteStaffLeave(id), getStaffLeaves({ staffId }) must not contain that id', async () => {
    // Validates: Requirements 3.8
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }), // staffId
        fc.integer({ min: 1, max: 10000 }), // leave record id to delete
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            staffId: fc.integer({ min: 1, max: 1000 }),
            leaveType: fc.constantFrom(
              StaffLeaveType.CASUAL,
              StaffLeaveType.SICK,
              StaffLeaveType.ANNUAL,
              StaffLeaveType.MATERNITY,
              StaffLeaveType.PATERNITY,
              StaffLeaveType.UNPAID,
              StaffLeaveType.OTHER,
            ),
            startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
            endDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
            days: fc.integer({ min: 1, max: 30 }),
            month: fc.string(),
            reason: fc.string(),
            status: fc.constantFrom(
              StaffLeaveStatus.PENDING,
              StaffLeaveStatus.APPROVED,
              StaffLeaveStatus.REJECTED,
              StaffLeaveStatus.CANCELLED,
            ),
            createdAt: fc.date(),
            updatedAt: fc.date(),
            employeeId: fc.constant(null),
            teacherId: fc.constant(null),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        async (staffId, deleteId, initialRecords) => {
          // Ensure at least one record belongs to the target staffId and has the deleteId
          const recordToDelete = {
            ...initialRecords[0],
            id: deleteId,
            staffId: staffId,
          };

          // Create a set of records including the one to delete
          const allRecords = [recordToDelete, ...initialRecords.slice(1)];

          // Mock: delete succeeds
          mockPrisma.staffLeave.delete.mockResolvedValue(recordToDelete);

          // Mock: findMany returns records WITHOUT the deleted one
          const remainingRecords = allRecords.filter(
            (r) => r.id !== deleteId && r.staffId === staffId,
          );
          mockPrisma.staffLeave.findMany.mockResolvedValue(
            remainingRecords.map((r) => ({
              ...r,
              staff: {
                name: 'Test Staff',
                isTeaching: true,
                designation: null,
                specialization: 'Math',
              },
            })),
          );

          // Execute delete
          await service.deleteStaffLeave(deleteId);

          // Execute getStaffLeaves with staffId filter
          const result = await service.getStaffLeaves({ staffId });

          // Verify: the deleted record is NOT in the results
          const foundDeletedRecord = result.find((r: any) => r.id === deleteId);
          expect(foundDeletedRecord).toBeUndefined();

          // Verify: delete was called with correct id
          expect(mockPrisma.staffLeave.delete).toHaveBeenCalledWith({
            where: { id: deleteId },
          });

          // Verify: findMany was called with correct filter
          expect(mockPrisma.staffLeave.findMany).toHaveBeenCalledWith({
            where: { staffId },
            include: {
              staff: {
                select: {
                  name: true,
                  isTeaching: true,
                  designation: true,
                  specialization: true,
                },
              },
            },
          });
        },
      ),
      { numRuns: 20 },
    );
  });

  it('throws NotFoundException when deleting a non-existent record', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }), // non-existent id
        async (nonExistentId) => {
          // Mock: Prisma throws P2025 error (record not found)
          const prismaError = new Prisma.PrismaClientKnownRequestError(
            'Record to delete does not exist.',
            {
              code: 'P2025',
              clientVersion: '5.0.0',
            },
          );
          
          mockPrisma.staffLeave.delete.mockRejectedValue(prismaError);

          // Execute and expect NotFoundException
          await expect(service.deleteStaffLeave(nonExistentId)).rejects.toThrow(
            NotFoundException,
          );
          await expect(service.deleteStaffLeave(nonExistentId)).rejects.toThrow(
            `StaffLeave with ID ${nonExistentId} not found`,
          );
        },
      ),
      { numRuns: 20 },
    );
  });
});
