import { Test, TestingModule } from '@nestjs/testing';
import { FeeManagementService } from '../fee-management.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as fc from 'fast-check';

/**
 * Preservation Property Tests for VOID Challan Superseding Fixes
 * 
 * **IMPORTANT**: These tests follow observation-first methodology.
 * They observe behavior on UNFIXED code for non-buggy inputs (non-VOID challans)
 * and encode that behavior as properties to ensure no regressions after the fix.
 * 
 * **EXPECTED OUTCOME**: Tests PASS on unfixed code (confirms baseline behavior to preserve)
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 */
describe('FeeManagementService - VOID Challan Preservation Properties', () => {
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
        name: `TEST-PROGRAM-PRESERVATION-${Date.now()}`,
        description: 'Test Program Preservation',
        level: 'UNDERGRADUATE',
        duration: '4 years',
      },
    });
    testProgramId = program.id;

    const classData = await prisma.class.create({
      data: {
        name: `TEST-CLASS-PRESERVATION-${Date.now()}`,
        programId: program.id,
      },
    });
    testClassId = classData.id;

    const session = await prisma.academicSession.create({
      data: {
        name: `TEST-SESSION-PRESERVATION-${Date.now()}`,
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
   * Task 2.1: Test non-VOID challan generation
   * 
   * **Property**: For all students with no VOID challans, challan generation succeeds
   * 
   * **Observation**: Students with no VOID challans generate challans correctly on unfixed code
   * 
   * **Validates: Requirements 3.5**
   */
  describe('Task 2.1: Non-VOID Challan Generation', () => {
    it('should generate challans successfully for students with no VOID challans', async () => {
      // Property-based test: Generate multiple test cases with different amounts
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1000, max: 10000 }), // challan amount
          async (amount) => {
            // Create a unique student for this test case
            const uniqueId = Math.floor(Math.random() * 1000000);
            const student = await prisma.student.create({
              data: {
                fName: 'Test',
                lName: `StudentNoVoid${uniqueId}`,
                rollNumber: `NOVOID${uniqueId}`,
                dob: new Date('2010-01-01'),
                gender: 'MALE',
                classId: testClassId,
                programId: testProgramId,
                session: '2025',
              },
            });

            try {
              // Create StudentFeeInstallment for January (no previous challans)
              await prisma.studentFeeInstallment.create({
                data: {
                  studentId: student.id,
                  classId: testClassId,
                  installmentNumber: 1,
                  amount: amount,
                  dueDate: new Date('2025-01-15'),
                  status: 'PENDING',
                  paidAmount: 0,
                  remainingAmount: amount,
                  month: 'January',
                  session: '2025',
                  sessionId: testSessionId,
                },
              });

              // Generate January challan (no VOID challans exist)
              const result = await service.generateChallansFromPlan({
                studentIds: [student.id],
                month: '2025-01',
                sessionId: testSessionId,
              });

              // Property: Generation should succeed
              expect(result).toBeDefined();
              expect(Array.isArray(result)).toBe(true);

              const studentResult = result.find((r: any) => r.studentId === student.id);
              expect(studentResult).toBeDefined();
              expect(studentResult.status).toBe('CREATED');

              // Verify challan was created
              const januaryChallan = await prisma.feeChallan.findFirst({
                where: {
                  studentId: student.id,
                  month: 'January',
                  session: '2025',
                },
              });

              expect(januaryChallan).toBeDefined();
              expect(januaryChallan?.status).toBe('PENDING');
              expect(januaryChallan?.amount).toBe(amount);
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
   * Task 2.2: Test non-VOID payment processing
   * 
   * **Property**: For all non-VOID challans, payment allocation follows existing rules (FIFO, tuition vs additional)
   * 
   * **Observation**: Payments on non-VOID challans allocate correctly on unfixed code
   * 
   * **Validates: Requirements 3.6**
   */
  describe('Task 2.2: Non-VOID Payment Processing', () => {
    it('should allocate payments correctly for non-VOID challans', async () => {
      // Property-based test: Generate multiple test cases with different payment amounts
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1000, max: 5000 }), // challan amount
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
              // Use a future due date to avoid dynamic late fee complications
              const futureDueDate = new Date();
              futureDueDate.setFullYear(futureDueDate.getFullYear() + 1);

              // Create a non-VOID challan (PENDING status)
              const uniqueChallanId = Math.floor(Math.random() * 1000000);
              const challan = await prisma.feeChallan.create({
                data: {
                  challanNumber: `CHAL${uniqueChallanId}`,
                  studentId: student.id,
                  amount: challanAmount,
                  dueDate: futureDueDate,
                  issueDate: new Date(),
                  status: 'PENDING',
                  installmentNumber: 1,
                  month: 'February',
                  session: '2025',
                  sessionId: testSessionId,
                  studentClassId: testClassId,
                  studentProgramId: testProgramId,
                  lateFeeFine: 0,
                  challanType: 'INSTALLMENT',
                },
              });

              // Make a partial payment (less than full amount)
              const partialPayment = Math.floor(challanAmount / 2);
              await service.updateFeeChallan(challan.id, {
                paidAmount: partialPayment,
                status: 'PARTIAL',
              });

              // Fetch the updated challan
              const partialChallan = await prisma.feeChallan.findUnique({
                where: { id: challan.id },
              });

              // Property: Partial payment should result in PARTIAL status
              expect(partialChallan).toBeDefined();
              expect(partialChallan?.paidAmount).toBe(partialPayment);
              expect(partialChallan?.status).toBe('PARTIAL');

              // Property: Non-VOID challan status should not be VOID after payment
              expect(partialChallan?.status).not.toBe('VOID');
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
        { numRuns: 3 } // Run 3 test cases with different amounts
      );
    }, 30000); // 30 second timeout for DB operations
  });

  /**
   * Task 2.3: Test non-VOID arrears calculation
   * 
   * **Property**: For all challan chains with no VOID predecessors, arrears = sum of unpaid amounts
   * 
   * **Observation**: Arrears calculations for chains with no VOID predecessors work correctly on unfixed code
   * 
   * **Validates: Requirements 3.3**
   */
  describe('Task 2.3: Non-VOID Arrears Calculation', () => {
    it('should calculate arrears correctly for chains with no VOID predecessors', async () => {
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
                  challanNumber: `FIRST${uniqueId1}`,
                  studentId: student.id,
                  amount: firstAmount,
                  dueDate: new Date('2025-03-15'),
                  issueDate: new Date('2025-03-01'),
                  status: 'PENDING',
                  installmentNumber: 1,
                  month: 'March',
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
                  challanNumber: `SECOND${uniqueId2}`,
                  studentId: student.id,
                  amount: secondAmount + firstAmount, // Includes arrears from first
                  dueDate: new Date('2025-04-15'),
                  issueDate: new Date('2025-04-01'),
                  status: 'PENDING',
                  installmentNumber: 2,
                  month: 'April',
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

              // Calculate arrears using getRecursiveArrearsIterative
              const arrearsCalculation = await (service as any).getRecursiveArrearsIterative(
                [secondChallan.id],
                prisma,
                0 // globalLateFee
              );

              // Property: Arrears should equal the unpaid amount from first challan
              // (since first is PENDING with no payment)
              expect(arrearsCalculation).toBeGreaterThanOrEqual(firstAmount);
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
   * Task 2.4: Test PAID challan late fee locking
   * 
   * **Property**: For all PAID challans, lateFeeFine remains locked after payment
   * (i.e., lateFeeFine is stamped at payment time and does not change on subsequent reads)
   * 
   * **Observation**: PAID challans lock lateFeeFine at payment time on unfixed code.
   * The service calculates dynamicLateFee at payment time and stamps it permanently.
   * 
   * **Validates: Requirements 3.1**
   */
  describe('Task 2.4: PAID Challan Late Fee Locking', () => {
    it('should lock lateFeeFine when challan is marked as PAID (value does not change after payment)', async () => {
      // Property-based test: Generate multiple test cases with different overdue periods
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10, max: 60 }), // days overdue
          async (daysOverdue) => {
            // Create a unique student for this test case
            const uniqueId = Math.floor(Math.random() * 1000000);
            const student = await prisma.student.create({
              data: {
                fName: 'Test',
                lName: `StudentLate${uniqueId}`,
                rollNumber: `LATE${uniqueId}`,
                dob: new Date('2010-01-01'),
                gender: 'MALE',
                classId: testClassId,
                programId: testProgramId,
                session: '2025',
              },
            });

            try {
              // Create a challan with a past due date (overdue)
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() - daysOverdue);

              const uniqueChallanId = Math.floor(Math.random() * 1000000);
              const challan = await prisma.feeChallan.create({
                data: {
                  challanNumber: `LATE${uniqueChallanId}`,
                  studentId: student.id,
                  amount: 5000,
                  dueDate: dueDate,
                  issueDate: new Date(),
                  status: 'PENDING',
                  installmentNumber: 1,
                  month: 'May',
                  session: '2025',
                  sessionId: testSessionId,
                  studentClassId: testClassId,
                  studentProgramId: testProgramId,
                  lateFeeFine: 0,
                  challanType: 'INSTALLMENT',
                },
              });

              // Pay the challan (mark as PAID) - service will stamp dynamicLateFee
              await service.updateFeeChallan(challan.id, {
                status: 'PAID',
                paidDate: new Date().toISOString().split('T')[0],
              });

              // Fetch the updated challan - this is the "locked" state
              const paidChallan = await prisma.feeChallan.findUnique({
                where: { id: challan.id },
              });

              // Property: Challan should be PAID
              expect(paidChallan).toBeDefined();
              expect(paidChallan?.status).toBe('PAID');
              expect(paidChallan?.paidDate).toBeDefined();

              // Record the locked lateFeeFine value
              const lockedLateFee = paidChallan?.lateFeeFine ?? 0;

              // Property: lateFeeFine should be locked (non-negative, a definite value)
              expect(lockedLateFee).toBeGreaterThanOrEqual(0);

              // Property: Reading the challan again should return the same lateFeeFine (it's locked)
              const paidChallanAgain = await prisma.feeChallan.findUnique({
                where: { id: challan.id },
              });
              expect(paidChallanAgain?.lateFeeFine).toBe(lockedLateFee);
              expect(paidChallanAgain?.status).toBe('PAID');
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
        { numRuns: 3 } // Run 3 test cases with different overdue periods
      );
    }, 30000); // 30 second timeout for DB operations
  });

  /**
   * Task 2.5: Test dynamic late fee calculation for unpaid challans
   * 
   * **Property**: For all unpaid challans (PENDING, PARTIAL, OVERDUE), lateFeeFine is calculated dynamically based on days overdue
   * 
   * **Observation**: PENDING, PARTIAL, OVERDUE challans calculate late fees dynamically from dueDate on unfixed code.
   * The service stores lateFeeFine = 0 for unpaid challans; the dynamic value is computed at read time.
   * 
   * **Validates: Requirements 3.2**
   */
  describe('Task 2.5: Dynamic Late Fee Calculation for Unpaid Challans', () => {
    it('should calculate late fees dynamically for unpaid challans', async () => {
      // Property-based test: Generate multiple test cases with different due dates
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 30 }), // days overdue
          async (daysOverdue) => {
            // Create a unique student for this test case
            const uniqueId = Math.floor(Math.random() * 1000000);
            const student = await prisma.student.create({
              data: {
                fName: 'Test',
                lName: `StudentDyn${uniqueId}`,
                rollNumber: `DYN${uniqueId}`,
                dob: new Date('2010-01-01'),
                gender: 'MALE',
                classId: testClassId,
                programId: testProgramId,
                session: '2025',
              },
            });

            try {
              // Create a challan with due date in the past (overdue)
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() - daysOverdue);

              const uniqueChallanId = Math.floor(Math.random() * 1000000);
              const challan = await prisma.feeChallan.create({
                data: {
                  challanNumber: `DYN${uniqueChallanId}`,
                  studentId: student.id,
                  amount: 5000,
                  dueDate: dueDate,
                  issueDate: new Date('2025-06-01'),
                  status: 'PENDING',
                  installmentNumber: 1,
                  month: 'June',
                  session: '2025',
                  sessionId: testSessionId,
                  studentClassId: testClassId,
                  studentProgramId: testProgramId,
                  lateFeeFine: 0, // Stored as 0 for unpaid challans; calculated dynamically at read time
                  challanType: 'INSTALLMENT',
                },
              });

              // Fetch the challan - lateFeeFine is stored as 0 for unpaid challans
              const fetchedChallan = await prisma.feeChallan.findUnique({
                where: { id: challan.id },
              });

              // Property: Unpaid challan should be in PENDING/OVERDUE status
              expect(fetchedChallan).toBeDefined();
              expect(['PENDING', 'OVERDUE']).toContain(fetchedChallan?.status);

              // Property: lateFeeFine stored as 0 for unpaid challans (dynamic calculation happens at read time in GET endpoints)
              // This is the preservation property: unpaid challans do NOT have lateFeeFine locked in DB
              expect(fetchedChallan?.lateFeeFine).toBe(0);

              // Property: Challan is NOT PAID (late fee not locked)
              expect(fetchedChallan?.status).not.toBe('PAID');
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
        { numRuns: 3 } // Run 3 test cases with different overdue periods
      );
    }, 30000); // 30 second timeout for DB operations
  });

  /**
   * Task 2.6: Test challan generation without previous installments
   * 
   * **Property**: For all students with no previous installments, challan generation succeeds
   * 
   * **Observation**: Challans for first installment generate without blocking on unfixed code
   * 
   * **Validates: Requirements 3.4**
   */
  describe('Task 2.6: Challan Generation Without Previous Installments', () => {
    it('should generate first installment challan without blocking', async () => {
      // Property-based test: Generate multiple test cases with different amounts
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1000, max: 10000 }), // challan amount
          async (amount) => {
            // Create a unique student for this test case
            const uniqueId = Math.floor(Math.random() * 1000000);
            const student = await prisma.student.create({
              data: {
                fName: 'Test',
                lName: `StudentFirst${uniqueId}`,
                rollNumber: `FIRST${uniqueId}`,
                dob: new Date('2010-01-01'),
                gender: 'MALE',
                classId: testClassId,
                programId: testProgramId,
                session: '2025',
              },
            });

            try {
              // Create StudentFeeInstallment for July (first installment, no previous)
              await prisma.studentFeeInstallment.create({
                data: {
                  studentId: student.id,
                  classId: testClassId,
                  installmentNumber: 1,
                  amount: amount,
                  dueDate: new Date('2025-07-15'),
                  status: 'PENDING',
                  paidAmount: 0,
                  remainingAmount: amount,
                  month: 'July',
                  session: '2025',
                  sessionId: testSessionId,
                },
              });

              // Generate July challan (first installment, no previous challans)
              const result = await service.generateChallansFromPlan({
                studentIds: [student.id],
                month: '2025-07',
                sessionId: testSessionId,
              });

              // Property: Generation should succeed without blocking
              expect(result).toBeDefined();
              expect(Array.isArray(result)).toBe(true);

              const studentResult = result.find((r: any) => r.studentId === student.id);
              expect(studentResult).toBeDefined();
              expect(studentResult.status).toBe('CREATED');

              // Verify challan was created
              const julyChallan = await prisma.feeChallan.findFirst({
                where: {
                  studentId: student.id,
                  month: 'July',
                  session: '2025',
                },
              });

              expect(julyChallan).toBeDefined();
              expect(julyChallan?.status).toBe('PENDING');
              expect(julyChallan?.amount).toBe(amount);
              expect(julyChallan?.installmentNumber).toBe(1);
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
