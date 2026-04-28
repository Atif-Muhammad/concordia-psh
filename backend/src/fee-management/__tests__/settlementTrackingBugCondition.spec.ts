import { Test, TestingModule } from '@nestjs/testing';
import { FeeManagementService } from '../fee-management.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Bug Condition Exploration Tests for Settlement Tracking Fixes
 * 
 * **CRITICAL**: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bugs exist. DO NOT attempt to fix the test or code when it fails.
 * 
 * These tests encode the expected behavior - they will validate the fix when they pass after implementation.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 */
describe('FeeManagementService - Settlement Tracking Bug Condition Exploration', () => {
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
   * Test Case 1: Settlement Snapshot Missing
   * 
   * Scenario:
   * - Create challan #106 (VOID, superseded, Rs. 5000)
   * - Create challan #107 that supersedes #106 (PAID, Rs. 8000)
   * - Verify that #107 has a settlementSnapshot field with settlement details
   * 
   * **EXPECTED OUTCOME**: Test FAILS (settlementSnapshot is null/undefined, confirms bug exists)
   * **Counterexample**: "Settlement snapshot not created when superseding challan is paid"
   * 
   * **Validates: Requirements 2.1, 2.4, 2.5**
   */
  describe('Test Case 1: Settlement Snapshot Missing', () => {
    it('should create settlement snapshot when superseding challan receives payment', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-SNAPSHOT-${Date.now()}`,
          description: 'Test Program Settlement Snapshot',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      testProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-SNAPSHOT-${Date.now()}`,
          programId: program.id,
        },
      });
      testClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-SNAPSHOT-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      testSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student Snapshot',
          rollNumber: `TEST-ROLL-SNAPSHOT-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      testStudentId = student.id;

      // Create challan #106 (VOID, Rs. 5000) - already superseded
      const challan106 = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-106-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          dueDate: new Date('2025-09-15'),
          issueDate: new Date('2025-09-01'),
          status: 'VOID',
          installmentNumber: 1,
          month: 'September',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 0,
          settledAmount: 5000, // Already settled
        },
      });

      // Create challan #107 that supersedes #106 (PAID, Rs. 8000)
      const challan107 = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-107-${Date.now()}`,
          studentId: student.id,
          amount: 8000,
          paidAmount: 8000,
          dueDate: new Date('2025-10-15'),
          issueDate: new Date('2025-10-01'),
          paidDate: new Date('2025-10-10'),
          status: 'PAID',
          installmentNumber: 2,
          month: 'October',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 0,
        },
      });

      // Link #106 as superseded by #107
      await prisma.feeChallan.update({
        where: { id: challan106.id },
        data: {
          supersededById: challan107.id,
        },
      });

      // Link #106 as previous challan to #107 (arrears chain)
      await prisma.feeChallan.update({
        where: { id: challan107.id },
        data: {
          previousChallans: {
            connect: { id: challan106.id },
          },
        },
      });

      console.log('Challan #106 (superseded):', {
        id: challan106.id,
        challanNumber: challan106.challanNumber,
        status: 'VOID',
        amount: challan106.amount,
        settledAmount: 5000,
      });

      console.log('Challan #107 (superseding, PAID):', {
        id: challan107.id,
        challanNumber: challan107.challanNumber,
        status: 'PAID',
        amount: challan107.amount,
        paidAmount: 8000,
      });

      // Fetch #107 to check if settlementSnapshot exists
      const challan107Check = await prisma.feeChallan.findUnique({
        where: { id: challan107.id },
        include: {
          supersedes: true,
        },
      });

      console.log('Challan #107 settlement data:', {
        id: challan107Check?.id,
        status: challan107Check?.status,
        paidAmount: challan107Check?.paidAmount,
        settlementSnapshot: challan107Check?.settlementSnapshot,
        supersedes: challan107Check?.supersedes.map(c => ({
          id: c.id,
          challanNumber: c.challanNumber,
          settledAmount: c.settledAmount,
        })),
      });

      // CRITICAL ASSERTION: Settlement snapshot should be created
      // On UNFIXED code, this assertion will FAIL because settlementSnapshot field doesn't exist
      // On FIXED code, this should PASS with a JSON object containing settlement details
      expect(challan107Check?.settlementSnapshot).toBeDefined();
      expect(challan107Check?.settlementSnapshot).not.toBeNull();
      
      // Verify settlement snapshot structure
      const snapshot = challan107Check?.settlementSnapshot as any;
      expect(snapshot).toHaveProperty('settledChallans');
      expect(Array.isArray(snapshot.settledChallans)).toBe(true);
      expect(snapshot.settledChallans.length).toBeGreaterThan(0);
      
      // Verify settlement details for challan #106
      const challan106Settlement = snapshot.settledChallans.find(
        (s: any) => s.challanId === challan106.id
      );
      expect(challan106Settlement).toBeDefined();
      expect(challan106Settlement.amountSettled).toBe(5000);
      expect(challan106Settlement.challanNumber).toBe(challan106.challanNumber);
    });
  });

  /**
   * Test Case 2: Locked Challan Edit
   * 
   * Scenario:
   * - Create challan #106 (VOID, superseded, settledAmount = 3000)
   * - Verify that #106 has isLocked = true
   * - Attempt to edit #106's amount
   * - Verify that the edit is blocked with "locked" error message
   * 
   * **EXPECTED OUTCOME**: Test FAILS (isLocked field doesn't exist, confirms bug exists)
   * **Counterexample**: "Superseded challan with settledAmount > 0 doesn't have isLocked field"
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  describe('Test Case 2: Locked Challan Edit', () => {
    it('should have isLocked field set to true for superseded challan with settledAmount > 0', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-LOCKED-${Date.now()}`,
          description: 'Test Program Locked Challan',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      const localProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-LOCKED-${Date.now()}`,
          programId: program.id,
        },
      });
      const localClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-LOCKED-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      const localSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student Locked',
          rollNumber: `TEST-ROLL-LOCKED-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      const localStudentId = student.id;

      // Create challan #106 (VOID, superseded, settledAmount = 3000)
      const challan106 = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-106-LOCKED-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          dueDate: new Date('2025-09-15'),
          issueDate: new Date('2025-09-01'),
          status: 'VOID',
          installmentNumber: 1,
          month: 'September',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 0,
          settledAmount: 3000, // Partially settled
        },
      });

      // Create superseding challan #107 (PAID)
      const challan107 = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-107-LOCKED-${Date.now()}`,
          studentId: student.id,
          amount: 8000,
          paidAmount: 8000,
          dueDate: new Date('2025-10-15'),
          issueDate: new Date('2025-10-01'),
          paidDate: new Date('2025-10-10'),
          status: 'PAID',
          installmentNumber: 2,
          month: 'October',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          lateFeeFine: 0,
        },
      });

      // Link #106 as superseded by #107
      await prisma.feeChallan.update({
        where: { id: challan106.id },
        data: {
          supersededById: challan107.id,
        },
      });

      console.log('Challan #106 (superseded with settledAmount):', {
        id: challan106.id,
        status: 'VOID',
        amount: challan106.amount,
        settledAmount: 3000,
        supersededById: challan107.id,
      });

      // Fetch #106 to check isLocked field
      const challan106Check = await prisma.feeChallan.findUnique({
        where: { id: challan106.id },
      });

      console.log('Challan #106 lock status:', {
        id: challan106Check?.id,
        isLocked: challan106Check?.isLocked,
        settledAmount: challan106Check?.settledAmount,
      });

      // CRITICAL ASSERTION: isLocked field should exist and be true
      // On UNFIXED code, isLocked will be undefined (field doesn't exist, bug confirmed)
      // On FIXED code, isLocked should be true
      expect(challan106Check?.isLocked).toBeDefined();
      expect(challan106Check?.isLocked).toBe(true);

      // Cleanup
      await prisma.feeChallan.deleteMany({
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
   * Test Case 3: Recursive Calculation
   * 
   * Scenario:
   * - Create a chain of 3 superseded challans: #105 (VOID) -> #106 (VOID) -> #107 (PAID)
   * - Verify that #107 has a settlement snapshot (not recursive calculation)
   * - Verify that both #105 and #106 have isLocked = true
   * 
   * **EXPECTED OUTCOME**: Test FAILS (settlement tracking is confusing/inconsistent, confirms bug)
   * **Counterexample**: "Multi-level supersession chain has no clear audit trail"
   * 
   * **Validates: Requirements 2.1, 2.4, 2.5**
   */
  describe('Test Case 3: Recursive Calculation', () => {
    it('should provide clear settlement tracking for multi-level supersession chain', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-RECURSIVE-${Date.now()}`,
          description: 'Test Program Recursive',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      const localProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-RECURSIVE-${Date.now()}`,
          programId: program.id,
        },
      });
      const localClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-RECURSIVE-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      const localSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student Recursive',
          rollNumber: `TEST-ROLL-RECURSIVE-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      const localStudentId = student.id;

      // Create challan #105 (VOID, first in chain, Rs. 5000, already settled)
      const challan105 = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-105-${Date.now()}`,
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
          settledAmount: 5000,
        },
      });

      // Create challan #106 (VOID, supersedes #105, Rs. 10000, already settled)
      const challan106 = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-106-RECURSIVE-${Date.now()}`,
          studentId: student.id,
          amount: 10000,
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
          settledAmount: 10000,
        },
      });

      // Create challan #107 (PAID, supersedes #106, Rs. 15000)
      const challan107 = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-107-RECURSIVE-${Date.now()}`,
          studentId: student.id,
          amount: 15000,
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

      // Link #105 as superseded by #106
      await prisma.feeChallan.update({
        where: { id: challan105.id },
        data: {
          supersededById: challan106.id,
        },
      });

      // Link #106 as superseded by #107
      await prisma.feeChallan.update({
        where: { id: challan106.id },
        data: {
          supersededById: challan107.id,
        },
      });

      // Build the arrears chain: #107 -> #106 -> #105
      await prisma.feeChallan.update({
        where: { id: challan106.id },
        data: {
          previousChallans: {
            connect: { id: challan105.id },
          },
        },
      });

      await prisma.feeChallan.update({
        where: { id: challan107.id },
        data: {
          previousChallans: {
            connect: [{ id: challan105.id }, { id: challan106.id }],
          },
        },
      });

      console.log('Multi-level chain:', {
        challan105: { id: challan105.id, status: 'VOID', amount: 5000, settledAmount: 5000 },
        challan106: { id: challan106.id, status: 'VOID', amount: 10000, settledAmount: 10000 },
        challan107: { id: challan107.id, status: 'PAID', amount: 15000, paidAmount: 15000 },
      });

      // Fetch all challans to check settlement tracking
      const challan105After = await prisma.feeChallan.findUnique({
        where: { id: challan105.id },
      });

      const challan106After = await prisma.feeChallan.findUnique({
        where: { id: challan106.id },
      });

      const challan107After = await prisma.feeChallan.findUnique({
        where: { id: challan107.id },
        include: {
          supersedes: true,
        },
      });

      console.log('Settlement tracking check:', {
        challan105: {
          id: challan105After?.id,
          settledAmount: challan105After?.settledAmount,
          isLocked: challan105After?.isLocked,
        },
        challan106: {
          id: challan106After?.id,
          settledAmount: challan106After?.settledAmount,
          isLocked: challan106After?.isLocked,
        },
        challan107: {
          id: challan107After?.id,
          status: challan107After?.status,
          settlementSnapshot: challan107After?.settlementSnapshot,
        },
      });

      // CRITICAL ASSERTION: Settlement snapshot should exist and be clear
      // On UNFIXED code, this will FAIL (no settlement snapshot, recursive calculation)
      // On FIXED code, this should PASS with a clear settlement snapshot
      expect(challan107After?.settlementSnapshot).toBeDefined();
      expect(challan107After?.settlementSnapshot).not.toBeNull();

      const snapshot = challan107After?.settlementSnapshot as any;
      expect(snapshot).toHaveProperty('settledChallans');
      expect(Array.isArray(snapshot.settledChallans)).toBe(true);
      
      // Verify settlement details for both #105 and #106
      expect(snapshot.settledChallans.length).toBe(2);
      
      const challan105Settlement = snapshot.settledChallans.find(
        (s: any) => s.challanId === challan105.id
      );
      const challan106Settlement = snapshot.settledChallans.find(
        (s: any) => s.challanId === challan106.id
      );
      
      expect(challan105Settlement).toBeDefined();
      expect(challan106Settlement).toBeDefined();
      
      // Verify both challans are locked
      expect(challan105After?.isLocked).toBe(true);
      expect(challan106After?.isLocked).toBe(true);

      // Cleanup
      await prisma.feeChallan.deleteMany({
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
   * Test Case 4: Settlement Distribution
   * 
   * Scenario:
   * - Create challan #105 (VOID, Rs. 5000, settled)
   * - Create challan #106 (VOID, Rs. 3000, settled)
   * - Create challan #107 that supersedes both #105 and #106 (PAID, Rs. 10000)
   * - Verify settlement distribution is clearly tracked in #107's settlementSnapshot
   * 
   * **EXPECTED OUTCOME**: Test FAILS (settlement distribution not clearly tracked, confirms bug)
   * **Counterexample**: "Settlement distribution across multiple superseded challans is not tracked"
   * 
   * **Validates: Requirements 2.1, 2.4, 2.5**
   */
  describe('Test Case 4: Settlement Distribution', () => {
    it('should clearly track settlement distribution when one challan supersedes multiple challans', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-DISTRIBUTION-${Date.now()}`,
          description: 'Test Program Distribution',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      const localProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-DISTRIBUTION-${Date.now()}`,
          programId: program.id,
        },
      });
      const localClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-DISTRIBUTION-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      const localSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student Distribution',
          rollNumber: `TEST-ROLL-DISTRIBUTION-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      const localStudentId = student.id;

      // Create challan #105 (VOID, Rs. 5000, settled)
      const challan105 = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-105-DIST-${Date.now()}`,
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
          settledAmount: 5000,
        },
      });

      // Create challan #106 (VOID, Rs. 3000, settled)
      const challan106 = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-106-DIST-${Date.now()}`,
          studentId: student.id,
          amount: 3000,
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
          settledAmount: 3000,
        },
      });

      // Create challan #107 that supersedes both #105 and #106 (PAID, Rs. 10000)
      const challan107 = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-107-DIST-${Date.now()}`,
          studentId: student.id,
          amount: 10000,
          paidAmount: 10000,
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

      // Link #105 and #106 as superseded by #107
      await prisma.feeChallan.update({
        where: { id: challan105.id },
        data: {
          supersededById: challan107.id,
        },
      });

      await prisma.feeChallan.update({
        where: { id: challan106.id },
        data: {
          supersededById: challan107.id,
        },
      });

      // Build the arrears chain: #107 -> #105, #106
      await prisma.feeChallan.update({
        where: { id: challan107.id },
        data: {
          previousChallans: {
            connect: [{ id: challan105.id }, { id: challan106.id }],
          },
        },
      });

      console.log('Multiple supersession setup:', {
        challan105: { id: challan105.id, status: 'VOID', amount: 5000, settledAmount: 5000 },
        challan106: { id: challan106.id, status: 'VOID', amount: 3000, settledAmount: 3000 },
        challan107: { id: challan107.id, status: 'PAID', amount: 10000, paidAmount: 10000 },
      });

      // Fetch all challans to check settlement distribution
      const challan105After = await prisma.feeChallan.findUnique({
        where: { id: challan105.id },
      });

      const challan106After = await prisma.feeChallan.findUnique({
        where: { id: challan106.id },
      });

      const challan107After = await prisma.feeChallan.findUnique({
        where: { id: challan107.id },
        include: {
          supersedes: true,
        },
      });

      console.log('Settlement distribution check:', {
        challan105: {
          id: challan105After?.id,
          settledAmount: challan105After?.settledAmount,
          isLocked: challan105After?.isLocked,
        },
        challan106: {
          id: challan106After?.id,
          settledAmount: challan106After?.settledAmount,
          isLocked: challan106After?.isLocked,
        },
        challan107: {
          id: challan107After?.id,
          status: challan107After?.status,
          settlementSnapshot: challan107After?.settlementSnapshot,
        },
      });

      // CRITICAL ASSERTION: Settlement snapshot should clearly show distribution
      // On UNFIXED code, this will FAIL (no settlement snapshot)
      // On FIXED code, this should PASS with clear distribution details
      expect(challan107After?.settlementSnapshot).toBeDefined();
      expect(challan107After?.settlementSnapshot).not.toBeNull();

      const snapshot = challan107After?.settlementSnapshot as any;
      expect(snapshot).toHaveProperty('settledChallans');
      expect(Array.isArray(snapshot.settledChallans)).toBe(true);
      
      // Verify settlement details for both #105 and #106
      expect(snapshot.settledChallans.length).toBe(2);
      
      const challan105Settlement = snapshot.settledChallans.find(
        (s: any) => s.challanId === challan105.id
      );
      const challan106Settlement = snapshot.settledChallans.find(
        (s: any) => s.challanId === challan106.id
      );
      
      expect(challan105Settlement).toBeDefined();
      expect(challan106Settlement).toBeDefined();
      
      // Verify settlement amounts
      expect(challan105Settlement.amountSettled).toBe(5000);
      expect(challan106Settlement.amountSettled).toBe(3000);
      
      // Verify both challans are locked
      expect(challan105After?.isLocked).toBe(true);
      expect(challan106After?.isLocked).toBe(true);
      
      // Verify total settlement
      expect(snapshot.totalSettled).toBe(8000); // 5000 + 3000

      // Cleanup
      await prisma.feeChallan.deleteMany({
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
