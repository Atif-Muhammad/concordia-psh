import { Test, TestingModule } from '@nestjs/testing';
import { FeeManagementService } from '../fee-management.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Bug Condition Exploration Tests for VOID Challan Superseding Fixes
 * 
 * **CRITICAL**: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bugs exist. DO NOT attempt to fix the test or code when it fails.
 * 
 * These tests encode the expected behavior - they will validate the fix when they pass after implementation.
 * 
 * **Validates: Requirements 1.1, 1.5, 1.6**
 */
describe('FeeManagementService - VOID Challan Bug Condition Exploration', () => {
  let service: FeeManagementService;
  let prisma: PrismaService;
  let testStudentId: number;
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
  });

  afterAll(async () => {
    // Clean up all test data
    if (testStudentId) {
      await prisma.feeChallan.deleteMany({
        where: { studentId: testStudentId },
      });
      await prisma.studentFeeInstallment.deleteMany({
        where: { studentId: testStudentId },
      });
      await prisma.student.delete({
        where: { id: testStudentId },
      }).catch(() => {});
    }
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
   * Task 1.1: Test session filter bug - simple VOID chain
   * 
   * Scenario:
   * - Create September challan (VOID, superseded by November which is PAID)
   * - Attempt to generate December challan
   * - Assert that generation is allowed
   * 
   * **EXPECTED OUTCOME**: Test FAILS with "Generate September challan first" error (confirms bug exists)
   * **Counterexample**: "System blocks December generation even though September debt was settled via November"
   */
  describe('Task 1.1: Session Filter Bug - Simple VOID Chain', () => {
    it('should allow December challan generation when September is VOID with PAID superseding November challan', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-${Date.now()}`,
          description: 'Test Program',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      testProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-${Date.now()}`,
          programId: program.id,
        },
      });
      testClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      testSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student',
          rollNumber: `TEST-ROLL-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      testStudentId = student.id;
      testStudentId = student.id;

      // Create September challan (will be marked as VOID)
      const septemberChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-SEPT-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          dueDate: new Date('2025-09-15'),
          issueDate: new Date('2025-09-01'),
          status: 'VOID', // Marked as VOID
          installmentNumber: 1,
          month: 'September',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 0,
        },
      });

      // Create November challan that supersedes September (PAID status)
      const novemberChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-NOV-${Date.now()}`,
          studentId: student.id,
          amount: 10000, // Includes September's debt
          paidAmount: 10000,
          dueDate: new Date('2025-11-15'),
          issueDate: new Date('2025-11-01'),
          paidDate: new Date('2025-11-10'),
          status: 'PAID',
          installmentNumber: 2,
          month: 'November',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 0,
        },
      });

      // Link September challan as superseded by November
      await prisma.feeChallan.update({
        where: { id: septemberChallan.id },
        data: {
          supersededById: novemberChallan.id,
        },
      });

      // Link September as previous challan to November (arrears chain)
      await prisma.feeChallan.update({
        where: { id: novemberChallan.id },
        data: {
          previousChallans: {
            connect: { id: septemberChallan.id },
          },
        },
      });

      // Create StudentFeeInstallment for September (linked to September challan)
      const septInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 1,
          amount: 5000,
          dueDate: new Date('2025-09-15'),
          status: 'PAID', // Marked as PAID because debt was settled via November
          paidAmount: 5000,
          month: 'September',
          session: '2025',
          sessionId: session.id,
        },
      });

      // Link September challan to its installment
      await prisma.feeChallan.update({
        where: { id: septemberChallan.id },
        data: {
          studentFeeInstallmentId: septInstallment.id,
        },
      });

      // Create StudentFeeInstallment for November
      const novInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 2,
          amount: 5000,
          dueDate: new Date('2025-11-15'),
          status: 'PAID',
          paidAmount: 5000,
          month: 'November',
          session: '2025',
          sessionId: session.id,
        },
      });

      // Link November challan to its installment
      await prisma.feeChallan.update({
        where: { id: novemberChallan.id },
        data: {
          studentFeeInstallmentId: novInstallment.id,
        },
      });

      // Create StudentFeeInstallment for December (installment 3)
      await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 3,
          amount: 5000,
          dueDate: new Date('2025-12-15'),
          status: 'PENDING',
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'December',
          session: '2025',
          sessionId: session.id,
        },
      });

      // Attempt to generate December challan (installment 3)
      // This should be ALLOWED because September's debt was settled via November (PAID)
      // But on UNFIXED code, this will FAIL with "Generate September challan first" error
      
      const result = await service.generateChallansFromPlan({
        studentIds: [student.id],
        month: '2025-12', // YYYY-MM format
        sessionId: session.id,
      });

      // Debug: Log the result to see what's happening
      console.log('Generation result:', JSON.stringify(result, null, 2));

      // Assert: Generation should be allowed
      // On UNFIXED code, this assertion will FAIL because the system blocks generation
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Find the result for our student
      const studentResult = result.find((r: any) => r.studentId === student.id);
      expect(studentResult).toBeDefined();
      
      console.log('Student result:', JSON.stringify(studentResult, null, 2));
      
      // On UNFIXED code, this will be 'PREVIOUS_UNGENERATED' with reason "Generate September ... challan first"
      // On FIXED code, this should be 'CREATED'
      expect(studentResult.status).toBe('CREATED');
      expect(studentResult.reason).toBeUndefined();
      
      // Verify December challan was created
      const decemberChallan = await prisma.feeChallan.findFirst({
        where: {
          studentId: student.id,
          month: 'December',
          session: '2025',
        },
      });
      
      expect(decemberChallan).toBeDefined();
      expect(decemberChallan?.status).toBe('PENDING');
    });
  });

  /**
   * Task 1.2: Test session filter bug - multi-level VOID chain
   * 
   * Scenario:
   * - Create August challan (VOID, superseded by September which is VOID, superseded by October which is PAID)
   * - Attempt to generate November challan
   * - Assert that generation is allowed
   * 
   * **EXPECTED OUTCOME**: Test FAILS (confirms multi-level chain bug)
   * **Counterexample**: "System blocks November generation even though August→September→October chain is fully settled"
   * 
   * **Validates: Requirements 1.1, 1.5, 1.6**
   */
  describe('Task 1.2: Session Filter Bug - Multi-Level VOID Chain', () => {
    it('should allow November challan generation when August→September→October chain is fully settled', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-MULTI-${Date.now()}`,
          description: 'Test Program Multi-Level',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      const localProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-MULTI-${Date.now()}`,
          programId: program.id,
        },
      });
      const localClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-MULTI-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      const localSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student Multi',
          rollNumber: `TEST-ROLL-MULTI-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      const localStudentId = student.id;

      // Create August challan (VOID, first in chain)
      const augustChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-AUG-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          dueDate: new Date('2025-08-15'),
          issueDate: new Date('2025-08-01'),
          status: 'VOID',
          installmentNumber: 1,
          month: 'August',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 0,
        },
      });

      // Create September challan (VOID, supersedes August)
      const septemberChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-SEPT-MULTI-${Date.now()}`,
          studentId: student.id,
          amount: 10000, // Includes August's debt
          dueDate: new Date('2025-09-15'),
          issueDate: new Date('2025-09-01'),
          status: 'VOID',
          installmentNumber: 2,
          month: 'September',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 0,
        },
      });

      // Create October challan (PAID, supersedes September)
      const octoberChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-OCT-${Date.now()}`,
          studentId: student.id,
          amount: 15000, // Includes August + September debt
          paidAmount: 15000,
          dueDate: new Date('2025-10-15'),
          issueDate: new Date('2025-10-01'),
          paidDate: new Date('2025-10-10'),
          status: 'PAID',
          installmentNumber: 3,
          month: 'October',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 0,
        },
      });

      // Link August as superseded by September
      await prisma.feeChallan.update({
        where: { id: augustChallan.id },
        data: {
          supersededById: septemberChallan.id,
        },
      });

      // Link September as superseded by October
      await prisma.feeChallan.update({
        where: { id: septemberChallan.id },
        data: {
          supersededById: octoberChallan.id,
        },
      });

      // Build the arrears chain: October -> September -> August
      await prisma.feeChallan.update({
        where: { id: septemberChallan.id },
        data: {
          previousChallans: {
            connect: { id: augustChallan.id },
          },
        },
      });

      await prisma.feeChallan.update({
        where: { id: octoberChallan.id },
        data: {
          previousChallans: {
            connect: [{ id: augustChallan.id }, { id: septemberChallan.id }],
          },
        },
      });

      // Create StudentFeeInstallment for August
      // CRITICAL: Set status to PENDING to force the code to check VOID chain logic
      // If we set it to PAID, the code bypasses VOID chain check via installment status
      const augInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 1,
          amount: 5000,
          dueDate: new Date('2025-08-15'),
          status: 'PENDING', // NOT marked as PAID to force VOID chain validation
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'August',
          session: '2025',
          sessionId: session.id,
        },
      });

      await prisma.feeChallan.update({
        where: { id: augustChallan.id },
        data: { studentFeeInstallmentId: augInstallment.id },
      });

      // Create StudentFeeInstallment for September
      // CRITICAL: Set status to PENDING to force the code to check VOID chain logic
      const septInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 2,
          amount: 5000,
          dueDate: new Date('2025-09-15'),
          status: 'PENDING', // NOT marked as PAID to force VOID chain validation
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'September',
          session: '2025',
          sessionId: session.id,
        },
      });

      await prisma.feeChallan.update({
        where: { id: septemberChallan.id },
        data: { studentFeeInstallmentId: septInstallment.id },
      });

      // Create StudentFeeInstallment for October
      const octInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 3,
          amount: 5000,
          dueDate: new Date('2025-10-15'),
          status: 'PAID',
          paidAmount: 5000,
          month: 'October',
          session: '2025',
          sessionId: session.id,
        },
      });

      await prisma.feeChallan.update({
        where: { id: octoberChallan.id },
        data: { studentFeeInstallmentId: octInstallment.id },
      });

      // Create StudentFeeInstallment for November (installment 4)
      await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 4,
          amount: 5000,
          dueDate: new Date('2025-11-15'),
          status: 'PENDING',
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'November',
          session: '2025',
          sessionId: session.id,
        },
      });

      // Attempt to generate November challan (installment 4)
      // This should be ALLOWED because the entire August→September→October chain is settled
      // But on UNFIXED code, this will FAIL because the system doesn't recognize multi-level VOID chains
      
      const result = await service.generateChallansFromPlan({
        studentIds: [student.id],
        month: '2025-11', // YYYY-MM format
        sessionId: session.id,
      });

      // Debug: Log the result
      console.log('Multi-level chain generation result:', JSON.stringify(result, null, 2));

      // Assert: Generation should be allowed
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      const studentResult = result.find((r: any) => r.studentId === student.id);
      expect(studentResult).toBeDefined();
      
      console.log('Multi-level student result:', JSON.stringify(studentResult, null, 2));
      
      // On UNFIXED code, this will be 'PREVIOUS_UNGENERATED' with reason about missing August or September
      // On FIXED code, this should be 'CREATED'
      expect(studentResult.status).toBe('CREATED');
      expect(studentResult.reason).toBeUndefined();
      
      // Verify November challan was created
      const novemberChallan = await prisma.feeChallan.findFirst({
        where: {
          studentId: student.id,
          month: 'November',
          session: '2025',
        },
      });
      
      expect(novemberChallan).toBeDefined();
      expect(novemberChallan?.status).toBe('PENDING');

      // Cleanup
      await prisma.feeChallan.deleteMany({
        where: { studentId: localStudentId },
      });
      await prisma.studentFeeInstallment.deleteMany({
        where: { studentId: localStudentId },
      });
      await prisma.student.delete({
        where: { id: localStudentId },
      }).catch(() => {});
      await prisma.academicSession.delete({
        where: { id: localSessionId },
      }).catch(() => {});
      await prisma.class.delete({
        where: { id: localClassId },
      }).catch(() => {});
      await prisma.program.delete({
        where: { id: localProgramId },
      }).catch(() => {});
    });
  });

  /**
   * Task 1.3: Test late fee loss - supersession
   * 
   * Scenario:
   * - Create September challan with lateFeeFine = 500
   * - Supersede it with November challan (via generateChallansFromPlan)
   * - Pay the November challan (this triggers the bug)
   * - Assert that September's lateFeeFine is preserved (equals 500)
   * 
   * **EXPECTED OUTCOME**: Test FAILS (September's lateFeeFine is cleared to 0 when November is paid, confirms bug)
   * **Counterexample**: "September lateFeeFine cleared from 500 to 0 during payment settlement, losing PKR 500"
   * 
   * **Root Cause**: updateFeeChallan explicitly sets lateFeeFine: 0 on VOID predecessors when superseding challan is paid (lines 2108-2117)
   * 
   * **Validates: Requirements 1.2, 1.4**
   */
  describe('Task 1.3: Late Fee Loss - Supersession', () => {
    it('should preserve lateFeeFine when September challan is superseded and November is paid', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-LATEFEE-${Date.now()}`,
          description: 'Test Program Late Fee',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      const localProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-LATEFEE-${Date.now()}`,
          programId: program.id,
        },
      });
      const localClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-LATEFEE-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      const localSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student LateFee',
          rollNumber: `TEST-ROLL-LATEFEE-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      const localStudentId = student.id;

      // Create September challan with lateFeeFine = 500 (PENDING status, overdue)
      const septemberChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-SEPT-LATEFEE-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          dueDate: new Date('2025-09-15'),
          issueDate: new Date('2025-09-01'),
          status: 'PENDING', // PENDING with late fee
          installmentNumber: 1,
          month: 'September',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 500, // Late fee of PKR 500
          challanType: 'INSTALLMENT',
        },
      });

      // Create StudentFeeInstallment for September
      const septInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 1,
          amount: 5000,
          dueDate: new Date('2025-09-15'),
          status: 'PENDING',
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'September',
          session: '2025',
          sessionId: session.id,
        },
      });

      await prisma.feeChallan.update({
        where: { id: septemberChallan.id },
        data: { studentFeeInstallmentId: septInstallment.id },
      });

      // Create StudentFeeInstallment for November (installment 2)
      await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 2,
          amount: 5000,
          dueDate: new Date('2025-11-15'),
          status: 'PENDING',
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'November',
          session: '2025',
          sessionId: session.id,
        },
      });

      // Now generate November challan via generateChallansFromPlan
      // This should supersede September challan (mark it as VOID) and preserve its late fee
      const generateResult = await service.generateChallansFromPlan({
        studentIds: [student.id],
        month: '2025-11', // November
        sessionId: session.id,
      });

      console.log('Generate November result:', JSON.stringify(generateResult, null, 2));

      // Verify November challan was created
      const novemberChallan = await prisma.feeChallan.findFirst({
        where: {
          studentId: student.id,
          month: 'November',
          session: '2025',
        },
      });

      expect(novemberChallan).toBeDefined();
      expect(novemberChallan?.status).toBe('PENDING');

      // Verify September challan is now VOID
      const voidedSeptember = await prisma.feeChallan.findUnique({
        where: { id: septemberChallan.id },
      });

      console.log('September after supersession:', {
        id: voidedSeptember?.id,
        status: voidedSeptember?.status,
        lateFeeFine: voidedSeptember?.lateFeeFine,
        supersededById: voidedSeptember?.supersededById,
      });

      expect(voidedSeptember?.status).toBe('VOID');
      expect(voidedSeptember?.supersededById).toBe(novemberChallan?.id);

      // At this point, September's lateFeeFine should still be 500 (preserved during supersession)
      expect(voidedSeptember?.lateFeeFine).toBe(500);

      // Now pay the November challan - THIS TRIGGERS THE BUG
      // The updateFeeChallan function will clear September's lateFeeFine to 0
      await service.updateFeeChallan(novemberChallan!.id, {
        paidAmount: novemberChallan!.amount,
        status: 'PAID',
        paidDate: '2025-11-10',
      });

      // Fetch September again to check if lateFeeFine was cleared
      const septemberAfterPayment = await prisma.feeChallan.findUnique({
        where: { id: septemberChallan.id },
      });

      console.log('September after November payment:', {
        id: septemberAfterPayment?.id,
        status: septemberAfterPayment?.status,
        lateFeeFine: septemberAfterPayment?.lateFeeFine,
        remarks: septemberAfterPayment?.remarks,
      });

      // CRITICAL ASSERTION: Late fee should be preserved (equals 500)
      // On UNFIXED code, this assertion will FAIL because lateFeeFine is cleared to 0 in updateFeeChallan
      // On FIXED code, this should PASS with lateFeeFine = 500
      expect(septemberAfterPayment?.lateFeeFine).toBe(500);

      // Cleanup
      await prisma.feeChallan.deleteMany({
        where: { studentId: localStudentId },
      });
      await prisma.studentFeeInstallment.deleteMany({
        where: { studentId: localStudentId },
      });
      await prisma.student.delete({
        where: { id: localStudentId },
      }).catch(() => {});
      await prisma.academicSession.delete({
        where: { id: localSessionId },
      }).catch(() => {});
      await prisma.class.delete({
        where: { id: localClassId },
      }).catch(() => {});
      await prisma.program.delete({
        where: { id: localProgramId },
      }).catch(() => {});
    });
  });

  /**
   * Task 1.4: Test late fee loss - arrears calculation
   * 
   * Scenario:
   * - Create October challan (VOID, lateFeeFine = 300)
   * - Generate December challan via generateChallansFromPlan
   * - December should supersede October and include October's late fee (300) in arrears
   * - Assert that December's fineAmount includes the 300 late fee from October
   * 
   * **EXPECTED OUTCOME**: Test FAILS (arrears exclude the 300, confirms bug)
   * **Counterexample**: "December arrears missing PKR 300 from October's late fee"
   * 
   * **Root Cause**: getRecursiveArrearsIterative does not include lateFeeFine from VOID predecessors in arrears calculation
   * 
   * **Validates: Requirements 1.3**
   */
  describe('Task 1.4: Late Fee Loss - Arrears Calculation', () => {
    it('should include lateFeeFine from VOID October challan in December arrears calculation', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-ARREARS-${Date.now()}`,
          description: 'Test Program Arrears',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      const localProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-ARREARS-${Date.now()}`,
          programId: program.id,
        },
      });
      const localClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-ARREARS-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      const localSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student Arrears',
          rollNumber: `TEST-ROLL-ARREARS-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      const localStudentId = student.id;

      // Create October challan (PENDING status with lateFeeFine = 300)
      const octoberChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-OCT-ARREARS-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          dueDate: new Date('2025-10-15'),
          issueDate: new Date('2025-10-01'),
          status: 'PENDING', // PENDING with late fee
          installmentNumber: 1,
          month: 'October',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 300, // Late fee of PKR 300
          challanType: 'INSTALLMENT',
        },
      });

      // Create StudentFeeInstallment for October
      const octInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 1,
          amount: 5000,
          dueDate: new Date('2025-10-15'),
          status: 'PENDING',
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'October',
          session: '2025',
          sessionId: session.id,
        },
      });

      await prisma.feeChallan.update({
        where: { id: octoberChallan.id },
        data: { studentFeeInstallmentId: octInstallment.id },
      });

      // Create StudentFeeInstallment for December (installment 2)
      await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 2,
          amount: 5000,
          dueDate: new Date('2025-12-15'),
          status: 'PENDING',
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'December',
          session: '2025',
          sessionId: session.id,
        },
      });

      // Generate December challan via generateChallansFromPlan
      // This should supersede October and include October's debt (5000 + 300 late fee) in arrears
      const generateResult = await service.generateChallansFromPlan({
        studentIds: [student.id],
        month: '2025-12', // December
        sessionId: session.id,
      });

      console.log('Generate December result:', JSON.stringify(generateResult, null, 2));

      // Verify December challan was created
      const decemberChallan = await prisma.feeChallan.findFirst({
        where: {
          studentId: student.id,
          month: 'December',
          session: '2025',
        },
        include: {
          previousChallans: true,
        },
      });

      expect(decemberChallan).toBeDefined();
      console.log('December challan:', {
        id: decemberChallan?.id,
        amount: decemberChallan?.amount,
        fineAmount: decemberChallan?.fineAmount,
        lateFeeFine: decemberChallan?.lateFeeFine,
        previousChallans: decemberChallan?.previousChallans.map(p => ({
          id: p.id,
          month: p.month,
          status: p.status,
          amount: p.amount,
          lateFeeFine: p.lateFeeFine,
        })),
      });

      // Verify October is now VOID (superseded by December)
      const voidedOctober = await prisma.feeChallan.findUnique({
        where: { id: octoberChallan.id },
      });

      console.log('October after December generation:', {
        id: voidedOctober?.id,
        status: voidedOctober?.status,
        lateFeeFine: voidedOctober?.lateFeeFine,
        supersededById: voidedOctober?.supersededById,
      });

      expect(voidedOctober?.status).toBe('VOID');
      expect(voidedOctober?.supersededById).toBe(decemberChallan?.id);

      // Verify October's late fee is preserved
      expect(voidedOctober?.lateFeeFine).toBe(300);

      // CRITICAL ASSERTION: December's arrears should include October's late fee (300)
      // Expected arrears = October amount (5000) + October late fee (300) = 5300
      // Arrears are calculated dynamically via getRecursiveArrearsIterative, not stored in fineAmount
      // On UNFIXED code, this assertion will FAIL because arrears exclude the 300 late fee
      // On FIXED code, this should PASS with arrears >= 5300
      
      // Calculate arrears dynamically using getRecursiveArrearsIterative
      const arrearsCalculation = await (service as any).getRecursiveArrearsIterative(
        [decemberChallan?.id],
        prisma,
        0 // globalLateFee
      );
      
      const expectedArrears = 5000 + 300; // October amount + October late fee
      console.log('Expected arrears:', expectedArrears);
      console.log('Actual fineAmount:', decemberChallan?.fineAmount);
      
      // On UNFIXED code, arrearsCalculation will be 5000 (missing the 300 late fee)
      // On FIXED code, arrearsCalculation will be 5300 (includes the 300 late fee)
      expect(arrearsCalculation).toBeGreaterThanOrEqual(expectedArrears);

      // Cleanup
      await prisma.feeChallan.deleteMany({
        where: { studentId: localStudentId },
      });
      await prisma.studentFeeInstallment.deleteMany({
        where: { studentId: localStudentId },
      });
      await prisma.student.delete({
        where: { id: localStudentId },
      }).catch(() => {});
      await prisma.academicSession.delete({
        where: { id: localSessionId },
      }).catch(() => {});
      await prisma.class.delete({
        where: { id: localClassId },
      }).catch(() => {});
      await prisma.program.delete({
        where: { id: localProgramId },
      }).catch(() => {});
    });
  });

  /**
   * Task 1.5: Test late fee loss - payment settlement
   * 
   * Scenario:
   * - Create October challan (PENDING, lateFeeFine = 400)
   * - Create November challan that supersedes October (mark October as VOID)
   * - Pay November challan (this triggers the bug via payment settlement)
   * - Assert that October's lateFeeFine is preserved (equals 400)
   * 
   * **EXPECTED OUTCOME**: Test FAILS (October's lateFeeFine cleared to 0, confirms bug)
   * **Counterexample**: "October lateFeeFine cleared from 400 to 0 when November was paid, losing PKR 400"
   * 
   * **Root Cause**: updateFeeChallan explicitly sets lateFeeFine: 0 on VOID predecessors during payment settlement
   * 
   * **Validates: Requirements 1.4**
   */
  describe('Task 1.5: Late Fee Loss - Payment Settlement', () => {
    it('should preserve lateFeeFine when October challan is VOID and November is paid', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-PAYMENT-${Date.now()}`,
          description: 'Test Program Payment Settlement',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      const localProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-PAYMENT-${Date.now()}`,
          programId: program.id,
        },
      });
      const localClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-PAYMENT-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      const localSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student Payment',
          rollNumber: `TEST-ROLL-PAYMENT-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      const localStudentId = student.id;

      // Create October challan with lateFeeFine = 400 (PENDING status, overdue)
      const octoberChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-OCT-PAYMENT-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          dueDate: new Date('2025-10-15'),
          issueDate: new Date('2025-10-01'),
          status: 'PENDING', // PENDING with late fee
          installmentNumber: 1,
          month: 'October',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 400, // Late fee of PKR 400
          challanType: 'INSTALLMENT',
        },
      });

      // Create StudentFeeInstallment for October
      const octInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 1,
          amount: 5000,
          dueDate: new Date('2025-10-15'),
          status: 'PENDING',
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'October',
          session: '2025',
          sessionId: session.id,
        },
      });

      await prisma.feeChallan.update({
        where: { id: octoberChallan.id },
        data: { studentFeeInstallmentId: octInstallment.id },
      });

      // Create November challan that supersedes October (manually create the supersession)
      const novemberChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-NOV-PAYMENT-${Date.now()}`,
          studentId: student.id,
          amount: 10400, // Includes October's debt (5000) + October's late fee (400) + November's amount (5000)
          dueDate: new Date('2025-11-15'),
          issueDate: new Date('2025-11-01'),
          status: 'PENDING',
          installmentNumber: 2,
          month: 'November',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 0,
          challanType: 'INSTALLMENT',
          fineAmount: 5400, // Arrears from October (5000 + 400)
        },
      });

      // Create StudentFeeInstallment for November
      const novInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 2,
          amount: 5000,
          dueDate: new Date('2025-11-15'),
          status: 'PENDING',
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'November',
          session: '2025',
          sessionId: session.id,
        },
      });

      await prisma.feeChallan.update({
        where: { id: novemberChallan.id },
        data: { studentFeeInstallmentId: novInstallment.id },
      });

      // Mark October as VOID (superseded by November)
      await prisma.feeChallan.update({
        where: { id: octoberChallan.id },
        data: {
          status: 'VOID',
          supersededById: novemberChallan.id,
        },
      });

      // Link October as previous challan to November (arrears chain)
      await prisma.feeChallan.update({
        where: { id: novemberChallan.id },
        data: {
          previousChallans: {
            connect: { id: octoberChallan.id },
          },
        },
      });

      // Verify October is VOID with lateFeeFine = 400
      const voidedOctober = await prisma.feeChallan.findUnique({
        where: { id: octoberChallan.id },
      });

      console.log('October before payment:', {
        id: voidedOctober?.id,
        status: voidedOctober?.status,
        lateFeeFine: voidedOctober?.lateFeeFine,
        supersededById: voidedOctober?.supersededById,
      });

      expect(voidedOctober?.status).toBe('VOID');
      expect(voidedOctober?.lateFeeFine).toBe(400);

      // Now pay the November challan - THIS TRIGGERS THE BUG via payment settlement
      // The updateFeeChallan function will clear October's lateFeeFine to 0
      await service.updateFeeChallan(novemberChallan.id, {
        paidAmount: novemberChallan.amount,
        status: 'PAID',
        paidDate: '2025-11-10',
      });

      // Fetch October again to check if lateFeeFine was cleared
      const octoberAfterPayment = await prisma.feeChallan.findUnique({
        where: { id: octoberChallan.id },
      });

      console.log('October after November payment:', {
        id: octoberAfterPayment?.id,
        status: octoberAfterPayment?.status,
        lateFeeFine: octoberAfterPayment?.lateFeeFine,
        remarks: octoberAfterPayment?.remarks,
      });

      // CRITICAL ASSERTION: Late fee should be preserved (equals 400)
      // On UNFIXED code, this assertion will FAIL because lateFeeFine is cleared to 0 in updateFeeChallan
      // On FIXED code, this should PASS with lateFeeFine = 400
      expect(octoberAfterPayment?.lateFeeFine).toBe(400);

      // Cleanup
      await prisma.feeChallan.deleteMany({
        where: { studentId: localStudentId },
      });
      await prisma.studentFeeInstallment.deleteMany({
        where: { studentId: localStudentId },
      });
      await prisma.student.delete({
        where: { id: localStudentId },
      }).catch(() => {});
      await prisma.academicSession.delete({
        where: { id: localSessionId },
      }).catch(() => {});
      await prisma.class.delete({
        where: { id: localClassId },
      }).catch(() => {});
      await prisma.program.delete({
        where: { id: localProgramId },
      }).catch(() => {});
    });
  });

  /**
   * Task 1.6: Test edge case - multi-level VOID chain with late fees
   * 
   * Scenario:
   * - Create chain of 3 VOID challans (Sept: lateFeeFine=200, Oct: lateFeeFine=300, Nov: lateFeeFine=400) all superseded by December
   * - Pay December challan
   * - Assert that all three VOID challans preserve their late fees (200, 300, 400)
   * 
   * **EXPECTED OUTCOME**: Test FAILS (all three lose their late fees, confirms bug totaling PKR 900 loss)
   * **Counterexample**: "All three VOID challans lost late fees totaling PKR 900"
   * 
   * **Root Cause**: updateFeeChallan explicitly sets lateFeeFine: 0 on all VOID predecessors during payment settlement
   * 
   * **Validates: Requirements 1.2, 1.4**
   */
  describe('Task 1.6: Edge Case - Multi-Level VOID Chain with Late Fees', () => {
    it('should preserve late fees on all three VOID challans when December is paid', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-MULTILATE-${Date.now()}`,
          description: 'Test Program Multi-Level Late Fees',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      const localProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-MULTILATE-${Date.now()}`,
          programId: program.id,
        },
      });
      const localClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-MULTILATE-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      const localSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student MultiLateFee',
          rollNumber: `TEST-ROLL-MULTILATE-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      const localStudentId = student.id;

      // Create September challan with lateFeeFine = 200 (PENDING status, overdue)
      const septemberChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-SEPT-MULTILATE-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          dueDate: new Date('2025-09-15'),
          issueDate: new Date('2025-09-01'),
          status: 'PENDING',
          installmentNumber: 1,
          month: 'September',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 200, // Late fee of PKR 200
          challanType: 'INSTALLMENT',
        },
      });

      // Create October challan with lateFeeFine = 300 (PENDING status, overdue)
      const octoberChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-OCT-MULTILATE-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          dueDate: new Date('2025-10-15'),
          issueDate: new Date('2025-10-01'),
          status: 'PENDING',
          installmentNumber: 2,
          month: 'October',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 300, // Late fee of PKR 300
          challanType: 'INSTALLMENT',
        },
      });

      // Create November challan with lateFeeFine = 400 (PENDING status, overdue)
      const novemberChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-NOV-MULTILATE-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          dueDate: new Date('2025-11-15'),
          issueDate: new Date('2025-11-01'),
          status: 'PENDING',
          installmentNumber: 3,
          month: 'November',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 400, // Late fee of PKR 400
          challanType: 'INSTALLMENT',
        },
      });

      // Create December challan that supersedes all three (manually create the supersession)
      const decemberChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-DEC-MULTILATE-${Date.now()}`,
          studentId: student.id,
          amount: 20900, // Sept (5000+200) + Oct (5000+300) + Nov (5000+400) + Dec (5000) = 20900
          dueDate: new Date('2025-12-15'),
          issueDate: new Date('2025-12-01'),
          status: 'PENDING',
          installmentNumber: 4,
          month: 'December',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 0,
          challanType: 'INSTALLMENT',
          fineAmount: 15900, // Arrears from Sept + Oct + Nov (including late fees)
        },
      });

      // Create StudentFeeInstallments for all months
      const septInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 1,
          amount: 5000,
          dueDate: new Date('2025-09-15'),
          status: 'PENDING',
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'September',
          session: '2025',
          sessionId: session.id,
        },
      });

      const octInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 2,
          amount: 5000,
          dueDate: new Date('2025-10-15'),
          status: 'PENDING',
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'October',
          session: '2025',
          sessionId: session.id,
        },
      });

      const novInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 3,
          amount: 5000,
          dueDate: new Date('2025-11-15'),
          status: 'PENDING',
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'November',
          session: '2025',
          sessionId: session.id,
        },
      });

      const decInstallment = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 4,
          amount: 5000,
          dueDate: new Date('2025-12-15'),
          status: 'PENDING',
          paidAmount: 0,
          remainingAmount: 5000,
          month: 'December',
          session: '2025',
          sessionId: session.id,
        },
      });

      // Link challans to installments
      await prisma.feeChallan.update({
        where: { id: septemberChallan.id },
        data: { studentFeeInstallmentId: septInstallment.id },
      });

      await prisma.feeChallan.update({
        where: { id: octoberChallan.id },
        data: { studentFeeInstallmentId: octInstallment.id },
      });

      await prisma.feeChallan.update({
        where: { id: novemberChallan.id },
        data: { studentFeeInstallmentId: novInstallment.id },
      });

      await prisma.feeChallan.update({
        where: { id: decemberChallan.id },
        data: { studentFeeInstallmentId: decInstallment.id },
      });

      // Mark September, October, November as VOID (superseded by December)
      await prisma.feeChallan.update({
        where: { id: septemberChallan.id },
        data: {
          status: 'VOID',
          supersededById: decemberChallan.id,
        },
      });

      await prisma.feeChallan.update({
        where: { id: octoberChallan.id },
        data: {
          status: 'VOID',
          supersededById: decemberChallan.id,
        },
      });

      await prisma.feeChallan.update({
        where: { id: novemberChallan.id },
        data: {
          status: 'VOID',
          supersededById: decemberChallan.id,
        },
      });

      // Link all three as previous challans to December (arrears chain)
      await prisma.feeChallan.update({
        where: { id: decemberChallan.id },
        data: {
          previousChallans: {
            connect: [
              { id: septemberChallan.id },
              { id: octoberChallan.id },
              { id: novemberChallan.id },
            ],
          },
        },
      });

      // Verify all three are VOID with their respective late fees
      const voidedSeptember = await prisma.feeChallan.findUnique({
        where: { id: septemberChallan.id },
      });

      const voidedOctober = await prisma.feeChallan.findUnique({
        where: { id: octoberChallan.id },
      });

      const voidedNovember = await prisma.feeChallan.findUnique({
        where: { id: novemberChallan.id },
      });

      console.log('Before payment - September:', {
        id: voidedSeptember?.id,
        status: voidedSeptember?.status,
        lateFeeFine: voidedSeptember?.lateFeeFine,
      });

      console.log('Before payment - October:', {
        id: voidedOctober?.id,
        status: voidedOctober?.status,
        lateFeeFine: voidedOctober?.lateFeeFine,
      });

      console.log('Before payment - November:', {
        id: voidedNovember?.id,
        status: voidedNovember?.status,
        lateFeeFine: voidedNovember?.lateFeeFine,
      });

      expect(voidedSeptember?.status).toBe('VOID');
      expect(voidedSeptember?.lateFeeFine).toBe(200);
      expect(voidedOctober?.status).toBe('VOID');
      expect(voidedOctober?.lateFeeFine).toBe(300);
      expect(voidedNovember?.status).toBe('VOID');
      expect(voidedNovember?.lateFeeFine).toBe(400);

      // Now pay the December challan - THIS TRIGGERS THE BUG
      // The updateFeeChallan function will clear all three VOID challans' late fees to 0
      await service.updateFeeChallan(decemberChallan.id, {
        paidAmount: decemberChallan.amount,
        status: 'PAID',
        paidDate: '2025-12-10',
      });

      // Fetch all three challans again to check if late fees were cleared
      const septemberAfterPayment = await prisma.feeChallan.findUnique({
        where: { id: septemberChallan.id },
      });

      const octoberAfterPayment = await prisma.feeChallan.findUnique({
        where: { id: octoberChallan.id },
      });

      const novemberAfterPayment = await prisma.feeChallan.findUnique({
        where: { id: novemberChallan.id },
      });

      console.log('After payment - September:', {
        id: septemberAfterPayment?.id,
        status: septemberAfterPayment?.status,
        lateFeeFine: septemberAfterPayment?.lateFeeFine,
      });

      console.log('After payment - October:', {
        id: octoberAfterPayment?.id,
        status: octoberAfterPayment?.status,
        lateFeeFine: octoberAfterPayment?.lateFeeFine,
      });

      console.log('After payment - November:', {
        id: novemberAfterPayment?.id,
        status: novemberAfterPayment?.status,
        lateFeeFine: novemberAfterPayment?.lateFeeFine,
      });

      // CRITICAL ASSERTIONS: All three late fees should be preserved
      // On UNFIXED code, these assertions will FAIL because all late fees are cleared to 0
      // Total loss: 200 + 300 + 400 = 900 PKR
      // On FIXED code, these should PASS with late fees preserved
      expect(septemberAfterPayment?.lateFeeFine).toBe(200);
      expect(octoberAfterPayment?.lateFeeFine).toBe(300);
      expect(novemberAfterPayment?.lateFeeFine).toBe(400);

      // Verify total late fee loss
      const totalLateFees = 200 + 300 + 400;
      const actualTotalLateFees = 
        (septemberAfterPayment?.lateFeeFine || 0) +
        (octoberAfterPayment?.lateFeeFine || 0) +
        (novemberAfterPayment?.lateFeeFine || 0);

      console.log('Expected total late fees:', totalLateFees);
      console.log('Actual total late fees:', actualTotalLateFees);
      console.log('Late fee loss:', totalLateFees - actualTotalLateFees);

      expect(actualTotalLateFees).toBe(totalLateFees);

      // Cleanup
      await prisma.feeChallan.deleteMany({
        where: { studentId: localStudentId },
      });
      await prisma.studentFeeInstallment.deleteMany({
        where: { studentId: localStudentId },
      });
      await prisma.student.delete({
        where: { id: localStudentId },
      }).catch(() => {});
      await prisma.academicSession.delete({
        where: { id: localSessionId },
      }).catch(() => {});
      await prisma.class.delete({
        where: { id: localClassId },
      }).catch(() => {});
      await prisma.program.delete({
        where: { id: localProgramId },
      }).catch(() => {});
    });
  });
});
