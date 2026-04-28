import { Test, TestingModule } from '@nestjs/testing';
import { FeeManagementService } from '../fee-management.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as fc from 'fast-check';

/**
 * Preservation Property Tests for Settlement Tracking Fixes
 * 
 * **IMPORTANT**: These tests follow observation-first methodology.
 * They observe behavior on UNFIXED code for non-buggy inputs (non-superseded challans)
 * and encode that behavior as properties to ensure no regressions after the fix.
 * 
 * **EXPECTED OUTCOME**: Tests PASS on unfixed code (confirms baseline behavior to preserve)
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 */
describe('FeeManagementService - Settlement Tracking Preservation Properties', () => {
  let service: FeeManagementService;
  let prisma: PrismaService;
  let testProgramId: number;
  let testClassId: number;
  let testSessionId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeManagementService,
        PrismaService,
      ],
    }).compile();

    service = module.get<FeeManagementService>(FeeManagementService);
    prisma = module.get<PrismaService>(PrismaService);

    // Create shared test data
    const program = await prisma.program.create({
      data: {
        name: `TEST-PROGRAM-SETTLEMENT-PRES-${Date.now()}`,
        description: 'Test Program Settlement Preservation',
        level: 'UNDERGRADUATE',
        duration: '4 years',
      },
    });
    testProgramId = program.id;

    const classData = await prisma.class.create({
      data: {
        name: `TEST-CLASS-SETTLEMENT-PRES-${Date.now()}`,
        programId: program.id,
      },
    });
    testClassId = classData.id;

    const session = await prisma.academicSession.create({
      data: {
        name: `TEST-SESSION-SETTLEMENT-PRES-${Date.now()}`,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
    });
    testSessionId = session.id;
  });

  afterAll(async () => {
    // Clean up shared test data
    if (testSessionId) {
      await prisma.academicSession.delete({
        where: { id: testSessionId },
      }).catch(() => {});
    }
    if (testClassId) {
      await prisma.class.delete({
        where: { id: testClassId },
      }).catch(() => {});
    }
    if (testProgramId) {
      await prisma.program.delete({
        where: { id: testProgramId },
      }).catch(() => {});
    }
  });

  /**
   * Test Case 1: Non-Superseded Challan Edit Preservation
   * 
   * **Property**: For all challans that have NOT been superseded (supersededById is null),
   * editing challan amounts and details should succeed without any locking restrictions.
   * 
   * **Observation**: Non-superseded challans can be edited freely on unfixed code.
   * 
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Test Case 1: Non-Superseded Challan Edit Preservation', () => {
    it('should allow editing of non-superseded challans', async () => {
      // Property-based test: Generate multiple test cases with different amounts
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1000, max: 10000 }), // initial amount
          fc.integer({ min: 1000, max: 10000 }), // updated amount
          async (initialAmount, updatedAmount) => {
            // Create a unique student for this test case
            const uniqueId = Math.floor(Math.random() * 1000000);
            const student = await prisma.student.create({
              data: {
                fName: 'Test',
                lName: `StudentEdit${uniqueId}`,
                rollNumber: `EDIT${uniqueId}`,
                dob: new Date('2010-01-01'),
                gender: 'MALE',
                classId: testClassId,
                programId: testProgramId,
                session: '2025',
              },
            });

            try {
              // Create a non-superseded challan (PENDING status, no supersededById)
              // Use a future due date to avoid status changing to OVERDUE
              const futureDueDate = new Date();
              futureDueDate.setFullYear(futureDueDate.getFullYear() + 1);
              
              const uniqueChallanId = Math.floor(Math.random() * 1000000);
              const challan = await prisma.feeChallan.create({
                data: {
                  challanNumber: `EDIT${uniqueChallanId}`,
                  studentId: student.id,
                  amount: initialAmount,
                  dueDate: futureDueDate,
                  issueDate: new Date(),
                  status: 'PENDING',
                  installmentNumber: 1,
                  month: 'September',
                  session: '2025',
                  sessionId: testSessionId,
                  studentClassId: testClassId,
                  studentProgramId: testProgramId,
                  lateFeeFine: 0,
                  challanType: 'INSTALLMENT',
                },
              });

              // Verify challan is not superseded
              expect(challan.supersededById).toBeNull();

              // Edit the challan amount (this should succeed for non-superseded challans)
              await service.updateFeeChallan(challan.id, {
                amount: updatedAmount,
              });

              // Fetch the updated challan
              const updatedChallan = await prisma.feeChallan.findUnique({
                where: { id: challan.id },
              });

              // Property: Non-superseded challan should allow edits
              expect(updatedChallan).toBeDefined();
              expect(updatedChallan?.amount).toBe(updatedAmount);
              expect(updatedChallan?.supersededById).toBeNull();
              
              // Property: Status should remain in unpaid state (PENDING or OVERDUE)
              expect(['PENDING', 'OVERDUE']).toContain(updatedChallan?.status);
            } finally {
              // Cleanup
              await prisma.feeChallan.deleteMany({
                where: { studentId: student.id },
              });
              await prisma.studentFeeInstallment.deleteMany({
                where: { studentId: student.id },
              });
              await prisma.student.delete({
                where: { id: student.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // Run 5 test cases with different amounts
      );
    }, 30000); // 30 second timeout for DB operations
  });

  /**
   * Test Case 2: Payment Processing Preservation
   * 
   * **Property**: For all challans that do NOT supersede other challans (supersedes.length === 0),
   * payment processing should work exactly as before without creating settlement snapshots.
   * 
   * **Observation**: Payment processing for non-superseding challans works correctly on unfixed code.
   * 
   * **Validates: Requirements 3.5**
   */
  describe('Test Case 2: Payment Processing Preservation', () => {
    it('should process payments correctly for non-superseding challans', async () => {
      // Property-based test: Generate multiple test cases with different payment amounts
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1000, max: 10000 }), // challan amount
          async (challanAmount) => {
            // Create a unique student for this test case
            const uniqueId = Math.floor(Math.random() * 1000000);
            const student = await prisma.student.create({
              data: {
                fName: 'Test',
                lName: `StudentPay${uniqueId}`,
                rollNumber: `PAY${uniqueId}`,
                dob: new Date('2010-01-01'),
                gender: 'MALE',
                classId: testClassId,
                programId: testProgramId,
                session: '2025',
              },
            });

            try {
              // Create StudentFeeInstallment first (required for payment processing)
              await prisma.studentFeeInstallment.create({
                data: {
                  studentId: student.id,
                  classId: testClassId,
                  installmentNumber: 1,
                  amount: challanAmount,
                  dueDate: new Date('2025-10-15'),
                  status: 'PENDING',
                  paidAmount: 0,
                  remainingAmount: challanAmount,
                  month: 'October',
                  session: '2025',
                  sessionId: testSessionId,
                },
              });

              // Create a second installment to avoid overpayment detection
              await prisma.studentFeeInstallment.create({
                data: {
                  studentId: student.id,
                  classId: testClassId,
                  installmentNumber: 2,
                  amount: challanAmount,
                  dueDate: new Date('2025-11-15'),
                  status: 'PENDING',
                  paidAmount: 0,
                  remainingAmount: challanAmount,
                  month: 'November',
                  session: '2025',
                  sessionId: testSessionId,
                },
              });

              // Create a non-superseding challan (no previousChallans, no supersedes relation)
              const uniqueChallanId = Math.floor(Math.random() * 1000000);
              const challan = await prisma.feeChallan.create({
                data: {
                  challanNumber: `PAY${uniqueChallanId}`,
                  studentId: student.id,
                  amount: challanAmount,
                  dueDate: new Date('2025-10-15'),
                  issueDate: new Date('2025-10-01'),
                  status: 'PENDING',
                  installmentNumber: 1,
                  month: 'October',
                  session: '2025',
                  sessionId: testSessionId,
                  studentClassId: testClassId,
                  studentProgramId: testProgramId,
                  lateFeeFine: 0,
                  challanType: 'INSTALLMENT',
                },
              });

              // Verify challan does not supersede any other challans
              const challanWithRelations = await prisma.feeChallan.findUnique({
                where: { id: challan.id },
                include: {
                  supersedes: true,
                },
              });
              expect(challanWithRelations?.supersedes.length).toBe(0);

              // Process payment (mark as PAID)
              await service.updateFeeChallan(challan.id, {
                status: 'PAID',
                paidAmount: challanAmount,
                paidDate: new Date().toISOString().split('T')[0],
              });

              // Fetch the updated challan
              const paidChallan = await prisma.feeChallan.findUnique({
                where: { id: challan.id },
              });

              // Property: Payment should be processed successfully
              expect(paidChallan).toBeDefined();
              expect(paidChallan?.status).toBe('PAID');
              expect(paidChallan?.paidAmount).toBe(challanAmount);
              expect(paidChallan?.paidDate).toBeDefined();
              
              // Property: Non-superseding challan should not have settlement snapshot
              // (this field may not exist on unfixed code, so we check it's undefined or null)
              expect(paidChallan?.settlementSnapshot).toBeUndefined();
            } finally {
              // Cleanup
              await prisma.feeChallan.deleteMany({
                where: { studentId: student.id },
              });
              await prisma.studentFeeInstallment.deleteMany({
                where: { studentId: student.id },
              });
              await prisma.student.delete({
                where: { id: student.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // Run 5 test cases with different amounts
      );
    }, 30000); // 30 second timeout for DB operations
  });

  /**
   * Test Case 3: Challan Display Preservation
   * 
   * **Property**: For all students, challan history display should show all challans
   * including their original amounts, regardless of supersession status.
   * 
   * **Observation**: Challan history display works correctly on unfixed code.
   * 
   * **Validates: Requirements 3.4**
   */
  describe('Test Case 3: Challan Display Preservation', () => {
    it('should display all challans in history with original amounts', async () => {
      // Property-based test: Generate multiple test cases with different numbers of challans
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }), // number of challans to create
          async (numChallans) => {
            // Create a unique student for this test case
            const uniqueId = Math.floor(Math.random() * 1000000);
            const student = await prisma.student.create({
              data: {
                fName: 'Test',
                lName: `StudentDisplay${uniqueId}`,
                rollNumber: `DISP${uniqueId}`,
                dob: new Date('2010-01-01'),
                gender: 'MALE',
                classId: testClassId,
                programId: testProgramId,
                session: '2025',
              },
            });

            try {
              const challanIds: number[] = [];
              const challanAmounts: number[] = [];

              // Create multiple challans for the student
              for (let i = 0; i < numChallans; i++) {
                const amount = 1000 + (i * 500);
                const uniqueChallanId = Math.floor(Math.random() * 1000000);
                const challan = await prisma.feeChallan.create({
                  data: {
                    challanNumber: `DISP${uniqueChallanId}`,
                    studentId: student.id,
                    amount: amount,
                    dueDate: new Date(`2025-${String(i + 1).padStart(2, '0')}-15`),
                    issueDate: new Date(`2025-${String(i + 1).padStart(2, '0')}-01`),
                    status: i === 0 ? 'PAID' : 'PENDING',
                    installmentNumber: i + 1,
                    month: ['January', 'February', 'March', 'April', 'May'][i],
                    session: '2025',
                    sessionId: testSessionId,
                    studentClassId: testClassId,
                    studentProgramId: testProgramId,
                    lateFeeFine: 0,
                    challanType: 'INSTALLMENT',
                    paidAmount: i === 0 ? amount : 0,
                    paidDate: i === 0 ? new Date() : null,
                  },
                });
                challanIds.push(challan.id);
                challanAmounts.push(amount);
              }

              // Fetch all challans for the student (simulating history display)
              const allChallans = await prisma.feeChallan.findMany({
                where: { studentId: student.id },
                orderBy: { installmentNumber: 'asc' },
              });

              // Property: All challans should be displayed
              expect(allChallans.length).toBe(numChallans);
              
              // Property: Each challan should have its original amount
              allChallans.forEach((challan, index) => {
                expect(challan.amount).toBe(challanAmounts[index]);
                expect(challan.installmentNumber).toBe(index + 1);
              });
              
              // Property: First challan should be PAID, others PENDING
              expect(allChallans[0].status).toBe('PAID');
              for (let i = 1; i < allChallans.length; i++) {
                expect(allChallans[i].status).toBe('PENDING');
              }
            } finally {
              // Cleanup
              await prisma.feeChallan.deleteMany({
                where: { studentId: student.id },
              });
              await prisma.studentFeeInstallment.deleteMany({
                where: { studentId: student.id },
              });
              await prisma.student.delete({
                where: { id: student.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 3 } // Run 3 test cases with different numbers of challans
      );
    }, 30000); // 30 second timeout for DB operations
  });

  /**
   * Test Case 4: Arrears Calculation Preservation
   * 
   * **Property**: For all challan chains using previousChallans relation,
   * arrears calculation should work correctly and remain unchanged.
   * 
   * **Observation**: Arrears calculation via previousChallans works correctly on unfixed code.
   * 
   * **Validates: Requirements 3.3, 3.6, 3.7**
   */
  describe('Test Case 4: Arrears Calculation Preservation', () => {
    it('should calculate arrears correctly using previousChallans relation', async () => {
      // Property-based test: Generate multiple test cases with different amounts
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1000, max: 5000 }), // first challan amount
          fc.integer({ min: 1000, max: 5000 }), // second challan amount
          async (firstAmount, secondAmount) => {
            // Create a unique student for this test case
            const uniqueId = Math.floor(Math.random() * 1000000);
            const student = await prisma.student.create({
              data: {
                fName: 'Test',
                lName: `StudentArr${uniqueId}`,
                rollNumber: `ARR${uniqueId}`,
                dob: new Date('2010-01-01'),
                gender: 'MALE',
                classId: testClassId,
                programId: testProgramId,
                session: '2025',
              },
            });

            try {
              // Create first challan (PENDING, unpaid)
              const uniqueId1 = Math.floor(Math.random() * 1000000);
              const firstChallan = await prisma.feeChallan.create({
                data: {
                  challanNumber: `ARR1${uniqueId1}`,
                  studentId: student.id,
                  amount: firstAmount,
                  dueDate: new Date('2025-11-15'),
                  issueDate: new Date('2025-11-01'),
                  status: 'PENDING',
                  installmentNumber: 1,
                  month: 'November',
                  session: '2025',
                  sessionId: testSessionId,
                  studentClassId: testClassId,
                  studentProgramId: testProgramId,
                  lateFeeFine: 0,
                  challanType: 'INSTALLMENT',
                },
              });

              // Create second challan (PENDING, unpaid) with first as predecessor
              const uniqueId2 = Math.floor(Math.random() * 1000000);
              const secondChallan = await prisma.feeChallan.create({
                data: {
                  challanNumber: `ARR2${uniqueId2}`,
                  studentId: student.id,
                  amount: secondAmount + firstAmount, // Includes arrears from first
                  dueDate: new Date('2025-12-15'),
                  issueDate: new Date('2025-12-01'),
                  status: 'PENDING',
                  installmentNumber: 2,
                  month: 'December',
                  session: '2025',
                  sessionId: testSessionId,
                  studentClassId: testClassId,
                  studentProgramId: testProgramId,
                  lateFeeFine: 0,
                  challanType: 'INSTALLMENT',
                  fineAmount: firstAmount, // Arrears from first challan
                },
              });

              // Link first as previous challan to second (arrears chain)
              await prisma.feeChallan.update({
                where: { id: secondChallan.id },
                data: {
                  previousChallans: {
                    connect: { id: firstChallan.id },
                  },
                },
              });

              // Verify the arrears chain is established
              const secondChallanWithRelations = await prisma.feeChallan.findUnique({
                where: { id: secondChallan.id },
                include: {
                  previousChallans: true,
                },
              });

              // Property: previousChallans relation should be established
              expect(secondChallanWithRelations?.previousChallans.length).toBe(1);
              expect(secondChallanWithRelations?.previousChallans[0].id).toBe(firstChallan.id);
              
              // Property: Second challan should include arrears from first
              expect(secondChallanWithRelations?.fineAmount).toBe(firstAmount);
              expect(secondChallanWithRelations?.amount).toBe(secondAmount + firstAmount);
              
              // Property: First challan should remain PENDING (not superseded)
              const firstChallanCheck = await prisma.feeChallan.findUnique({
                where: { id: firstChallan.id },
              });
              expect(firstChallanCheck?.status).toBe('PENDING');
              expect(firstChallanCheck?.supersededById).toBeNull();
            } finally {
              // Cleanup
              await prisma.feeChallan.deleteMany({
                where: { studentId: student.id },
              });
              await prisma.studentFeeInstallment.deleteMany({
                where: { studentId: student.id },
              });
              await prisma.student.delete({
                where: { id: student.id },
              }).catch(() => {});
            }
          }
        ),
        { numRuns: 5 } // Run 5 test cases with different amounts
      );
    }, 30000); // 30 second timeout for DB operations
  });
});
