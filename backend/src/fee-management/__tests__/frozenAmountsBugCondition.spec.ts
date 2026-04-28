import { Test, TestingModule } from '@nestjs/testing';
import { FeeManagementService } from '../fee-management.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Bug Condition Exploration Tests for Frozen Amounts and Settlement Tracking
 * 
 * **CRITICAL**: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bugs exist. DO NOT attempt to fix the test or code when it fails.
 * 
 * These tests encode the expected behavior - they will validate the fix when they pass after implementation.
 * 
 * **Validates: Requirements 2.1, 2.4, 2.5, 2.6, 2.7, 2.9, 2.11**
 */
describe('FeeManagementService - Frozen Amounts Bug Condition Exploration', () => {
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
   * Test Case 1: Mutable Amount Test
   * 
   * Scenario:
   * - Create a challan with specific fee heads and amount
   * - Modify the selected fee heads
   * - Verify that totalAmount recalculates (will fail on unfixed code - amount is mutable)
   * 
   * **EXPECTED OUTCOME**: Test FAILS (totalAmount is mutable and recalculates, confirms bug exists)
   * **Counterexample**: "Challan amounts are mutable and recalculate when fee heads change"
   * 
   * **Validates: Requirements 2.1, 2.9**
   */
  describe('Test Case 1: Mutable Amount Test', () => {
    it('should have frozen amounts that never change after generation', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-MUTABLE-${Date.now()}`,
          description: 'Test Program Mutable Amount',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      testProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-MUTABLE-${Date.now()}`,
          programId: program.id,
        },
      });
      testClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-MUTABLE-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      testSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student Mutable',
          rollNumber: `TEST-ROLL-MUTABLE-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      testStudentId = student.id;

      // Create challan with initial amount
      const challan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-MUTABLE-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          totalAmount: 5000,
          dueDate: new Date('2025-09-15'),
          issueDate: new Date('2025-09-01'),
          status: 'PENDING',
          installmentNumber: 1,
          month: 'September',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
          selectedHeads: JSON.stringify([1, 2, 3]), // Initial fee heads
        },
      });

      console.log('Initial challan:', {
        id: challan.id,
        challanNumber: challan.challanNumber,
        amount: challan.amount,
        totalAmount: challan.totalAmount,
        selectedHeads: challan.selectedHeads,
      });

      // Capture initial amounts
      const initialTotalAmount = challan.totalAmount;
      const initialAmount = challan.amount;

      // Modify selected fee heads (simulating a change that would recalculate amounts)
      await prisma.feeChallan.update({
        where: { id: challan.id },
        data: {
          selectedHeads: JSON.stringify([1, 2, 3, 4, 5]), // Add more fee heads
          amount: 7000, // Simulate recalculation
          totalAmount: 7000,
        },
      });

      // Fetch updated challan
      const updatedChallan = await prisma.feeChallan.findUnique({
        where: { id: challan.id },
      });

      console.log('Updated challan:', {
        id: updatedChallan?.id,
        amount: updatedChallan?.amount,
        totalAmount: updatedChallan?.totalAmount,
        selectedHeads: updatedChallan?.selectedHeads,
      });

      // CRITICAL ASSERTION: Amounts should be frozen (not change)
      // On UNFIXED code, this will FAIL because amounts are mutable
      // On FIXED code, amounts should remain frozen via computedTotalDue field
      
      // Check if frozen amount fields exist
      expect(updatedChallan).toHaveProperty('baseAmount');
      expect(updatedChallan).toHaveProperty('computedTotalDue');
      expect(updatedChallan).toHaveProperty('frozenArrearsAmount');
      expect(updatedChallan).toHaveProperty('frozenArrearsFine');
      expect(updatedChallan).toHaveProperty('frozenBaseFine');
      
      // Verify amounts are frozen (computedTotalDue should not change)
      expect(updatedChallan?.computedTotalDue).toBe(initialTotalAmount);
      
      // Verify the challan is locked to prevent mutations
      expect(updatedChallan?.isLocked).toBe(true);
    });
  });

  /**
   * Test Case 2: Missing Settlement Table Test
   * 
   * Scenario:
   * - Create a challan with arrears
   * - Record a payment that settles arrears
   * - Verify that no ChallanSettlement records are created (will fail on unfixed code - uses JSON blob)
   * 
   * **EXPECTED OUTCOME**: Test FAILS (no ChallanSettlement table exists, confirms bug)
   * **Counterexample**: "Settlement tracking uses JSON blobs instead of relational tables"
   * 
   * **Validates: Requirements 2.4, 2.5, 2.11**
   */
  describe('Test Case 2: Missing Settlement Table Test', () => {
    it('should create ChallanSettlement records when recording payments', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-SETTLEMENT-${Date.now()}`,
          description: 'Test Program Settlement Table',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      const localProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-SETTLEMENT-${Date.now()}`,
          programId: program.id,
        },
      });
      const localClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-SETTLEMENT-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      const localSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student Settlement',
          rollNumber: `TEST-ROLL-SETTLEMENT-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      const localStudentId = student.id;

      // Create arrears challan (PENDING, Rs. 3000)
      const arrearsChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-ARREARS-${Date.now()}`,
          studentId: student.id,
          amount: 3000,
          totalAmount: 3000,
          remainingAmount: 3000,
          dueDate: new Date('2025-08-15'),
          issueDate: new Date('2025-08-01'),
          status: 'PENDING',
          installmentNumber: 1,
          month: 'August',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
        },
      });

      // Create current challan that includes arrears (PENDING, Rs. 8000 = 5000 base + 3000 arrears)
      const currentChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-CURRENT-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          totalAmount: 8000, // Includes arrears
          remainingAmount: 8000,
          dueDate: new Date('2025-09-15'),
          issueDate: new Date('2025-09-01'),
          status: 'PENDING',
          installmentNumber: 2,
          month: 'September',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
        },
      });

      // Link arrears chain
      await prisma.feeChallan.update({
        where: { id: currentChallan.id },
        data: {
          previousChallans: {
            connect: { id: arrearsChallan.id },
          },
        },
      });

      console.log('Challans before payment:', {
        arrearsChallan: {
          id: arrearsChallan.id,
          amount: arrearsChallan.amount,
          status: 'PENDING',
        },
        currentChallan: {
          id: currentChallan.id,
          totalAmount: 8000,
          status: 'PENDING',
        },
      });

      // Record payment of Rs. 8000 (should settle arrears first, then current)
      await prisma.feeChallan.update({
        where: { id: currentChallan.id },
        data: {
          paidAmount: 8000,
          remainingAmount: 0,
          status: 'PAID',
          paidDate: new Date('2025-09-10'),
        },
      });

      // Update arrears challan as settled
      await prisma.feeChallan.update({
        where: { id: arrearsChallan.id },
        data: {
          paidAmount: 3000,
          remainingAmount: 0,
          status: 'PAID',
          paidDate: new Date('2025-09-10'),
        },
      });

      console.log('Challans after payment:', {
        arrearsChallan: { id: arrearsChallan.id, status: 'PAID', paidAmount: 3000 },
        currentChallan: { id: currentChallan.id, status: 'PAID', paidAmount: 8000 },
      });

      // CRITICAL ASSERTION: ChallanSettlement table should exist and have records
      // On UNFIXED code, this will FAIL because ChallanSettlement table doesn't exist
      // On FIXED code, this should PASS with relational settlement records
      
      // Check if ChallanSettlement table exists by querying it
      let settlementRecords;
      try {
        settlementRecords = await prisma.challanSettlement.findMany({
          where: {
            payingChallanId: currentChallan.id,
          },
        });
      } catch (error) {
        // Table doesn't exist - this is expected on unfixed code
        console.log('ChallanSettlement table does not exist (expected on unfixed code)');
        settlementRecords = null;
      }

      console.log('Settlement records:', settlementRecords);

      // Verify ChallanSettlement records exist
      expect(settlementRecords).not.toBeNull();
      expect(Array.isArray(settlementRecords)).toBe(true);
      expect(settlementRecords.length).toBeGreaterThan(0);
      
      // Verify settlement record for arrears challan
      const arrearsSettlement = settlementRecords.find(
        (s) => s.settledChallanId === arrearsChallan.id
      );
      expect(arrearsSettlement).toBeDefined();
      expect(arrearsSettlement.amountApplied).toBe(3000);
      expect(arrearsSettlement.payingChallanId).toBe(currentChallan.id);

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
   * Test Case 3: Missing Fingerprint Test
   * 
   * Scenario:
   * - Create a challan with arrears
   * - Modify the source challan
   * - Verify that no integrity check detects the mismatch (will fail on unfixed code - no fingerprint)
   * 
   * **EXPECTED OUTCOME**: Test FAILS (no arrearsFingerprint field exists, confirms bug)
   * **Counterexample**: "No arrears integrity validation via fingerprints"
   * 
   * **Validates: Requirements 2.6**
   */
  describe('Test Case 3: Missing Fingerprint Test', () => {
    it('should have arrearsFingerprint field for integrity validation', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-FINGERPRINT-${Date.now()}`,
          description: 'Test Program Fingerprint',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      const localProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-FINGERPRINT-${Date.now()}`,
          programId: program.id,
        },
      });
      const localClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-FINGERPRINT-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      const localSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student Fingerprint',
          rollNumber: `TEST-ROLL-FINGERPRINT-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      const localStudentId = student.id;

      // Create source challan with arrears (PENDING, Rs. 3000)
      const sourceChallan = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-SOURCE-${Date.now()}`,
          studentId: student.id,
          amount: 3000,
          totalAmount: 3000,
          remainingAmount: 3000,
          dueDate: new Date('2025-08-15'),
          issueDate: new Date('2025-08-01'),
          status: 'PENDING',
          installmentNumber: 1,
          month: 'August',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
        },
      });

      // Create challan that references arrears from source challan
      const challanWithArrears = await prisma.feeChallan.create({
        data: {
          challanNumber: `TEST-WITH-ARREARS-${Date.now()}`,
          studentId: student.id,
          amount: 5000,
          totalAmount: 8000, // 5000 base + 3000 arrears
          remainingAmount: 8000,
          dueDate: new Date('2025-09-15'),
          issueDate: new Date('2025-09-01'),
          status: 'PENDING',
          installmentNumber: 2,
          month: 'September',
          session: '2025',
          sessionId: session.id,
          studentClassId: classData.id,
          studentProgramId: program.id,
        },
      });

      // Link arrears chain
      await prisma.feeChallan.update({
        where: { id: challanWithArrears.id },
        data: {
          previousChallans: {
            connect: { id: sourceChallan.id },
          },
        },
      });

      console.log('Challans before modification:', {
        sourceChallan: {
          id: sourceChallan.id,
          amount: sourceChallan.amount,
          remainingAmount: 3000,
        },
        challanWithArrears: {
          id: challanWithArrears.id,
          totalAmount: 8000,
        },
      });

      // Modify source challan (simulating a change that invalidates downstream challan)
      await prisma.feeChallan.update({
        where: { id: sourceChallan.id },
        data: {
          amount: 2500, // Changed from 3000 to 2500
          totalAmount: 2500,
          remainingAmount: 2500,
        },
      });

      // Fetch challan with arrears to check for fingerprint
      const challanWithArrearsCheck = await prisma.feeChallan.findUnique({
        where: { id: challanWithArrears.id },
      });

      console.log('Challan with arrears check:', {
        id: challanWithArrearsCheck?.id,
        totalAmount: challanWithArrearsCheck?.totalAmount,
        arrearsFingerprint: challanWithArrearsCheck?.arrearsFingerprint,
        arrearsBreakdown: challanWithArrearsCheck?.arrearsBreakdown,
      });

      // CRITICAL ASSERTION: arrearsFingerprint field should exist
      // On UNFIXED code, this will FAIL because arrearsFingerprint field doesn't exist
      // On FIXED code, this should PASS with SHA-256 fingerprint
      expect(challanWithArrearsCheck).toHaveProperty('arrearsFingerprint');
      expect(challanWithArrearsCheck?.arrearsFingerprint).toBeDefined();
      expect(challanWithArrearsCheck?.arrearsFingerprint).not.toBeNull();
      
      // Verify arrearsBreakdown field exists
      expect(challanWithArrearsCheck).toHaveProperty('arrearsBreakdown');
      expect(challanWithArrearsCheck?.arrearsBreakdown).toBeDefined();

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
   * Test Case 4: Out-of-Sequence Test
   * 
   * Scenario:
   * - Attempt to generate challan for month 3 before month 2
   * - Verify that it's allowed (will fail on unfixed code - no sequential validation)
   * 
   * **EXPECTED OUTCOME**: Test FAILS (out-of-sequence generation is allowed, confirms bug)
   * **Counterexample**: "Out-of-sequence challan generation is allowed"
   * 
   * **Validates: Requirements 2.7**
   */
  describe('Test Case 4: Out-of-Sequence Test', () => {
    it('should enforce sequential challan generation by installment number', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-SEQUENCE-${Date.now()}`,
          description: 'Test Program Sequential',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      const localProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-SEQUENCE-${Date.now()}`,
          programId: program.id,
        },
      });
      const localClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-SEQUENCE-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      const localSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student Sequential',
          rollNumber: `TEST-ROLL-SEQUENCE-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      const localStudentId = student.id;

      // Create installments for the student
      const installment1 = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 1,
          amount: 5000,
          totalAmount: 5000,
          outstandingPrincipal: 5000,
          dueDate: new Date('2025-08-15'),
          month: 'August',
          session: '2025',
          sessionId: session.id,
        },
      });

      const installment2 = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 2,
          amount: 5000,
          totalAmount: 5000,
          outstandingPrincipal: 5000,
          dueDate: new Date('2025-09-15'),
          month: 'September',
          session: '2025',
          sessionId: session.id,
        },
      });

      const installment3 = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 3,
          amount: 5000,
          totalAmount: 5000,
          outstandingPrincipal: 5000,
          dueDate: new Date('2025-10-15'),
          month: 'October',
          session: '2025',
          sessionId: session.id,
        },
      });

      console.log('Installments created:', {
        installment1: { id: installment1.id, installmentNumber: 1, month: 'August' },
        installment2: { id: installment2.id, installmentNumber: 2, month: 'September' },
        installment3: { id: installment3.id, installmentNumber: 3, month: 'October' },
      });

      // Attempt to create challan for installment 3 (October) WITHOUT creating challan for installment 2 (September)
      // On UNFIXED code, this should succeed (no sequential validation)
      // On FIXED code, this should fail with error message
      
      let challan3Created = false;
      let errorMessage = null;
      
      try {
        // Use the service method to create the challan (this is where validation happens)
        const challan3 = await service.createFeeChallan({
          studentId: student.id,
          amount: 5000,
          dueDate: new Date('2025-10-15').toISOString(),
          installmentNumber: 3,
        });
        
        challan3Created = true;
        console.log('Challan 3 created (out-of-sequence):', {
          id: challan3.id,
          challanNumber: challan3.challanNumber,
          installmentNumber: 3,
          month: 'October',
        });
      } catch (error) {
        errorMessage = error.message;
        console.log('Challan 3 creation failed (expected on fixed code):', errorMessage);
      }

      // CRITICAL ASSERTION: Out-of-sequence generation should be blocked
      // On UNFIXED code, challan3Created will be TRUE (bug exists)
      // On FIXED code, challan3Created should be FALSE with error message
      expect(challan3Created).toBe(false);
      expect(errorMessage).toBeDefined();
      // The error should mention the first missing installment (August/installment #1)
      expect(errorMessage).toContain('August');
      expect(errorMessage).toContain('installment');

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

    it('should allow sequential challan generation when all prior installments have challans', async () => {
      // Setup: Create test data
      const program = await prisma.program.create({
        data: {
          name: `TEST-PROGRAM-SEQ-POSITIVE-${Date.now()}`,
          description: 'Test Program Sequential Positive',
          level: 'UNDERGRADUATE',
          duration: '4 years',
        },
      });
      const localProgramId = program.id;

      const classData = await prisma.class.create({
        data: {
          name: `TEST-CLASS-SEQ-POSITIVE-${Date.now()}`,
          programId: program.id,
        },
      });
      const localClassId = classData.id;

      const session = await prisma.academicSession.create({
        data: {
          name: `TEST-SESSION-SEQ-POSITIVE-${Date.now()}`,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      const localSessionId = session.id;

      const student = await prisma.student.create({
        data: {
          fName: 'Test',
          lName: 'Student Sequential Positive',
          rollNumber: `TEST-ROLL-SEQ-POS-${Date.now()}`,
          dob: new Date('2010-01-01'),
          gender: 'MALE',
          classId: classData.id,
          programId: program.id,
          session: '2025',
        },
      });
      const localStudentId = student.id;

      // Create installments for the student
      const installment1 = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 1,
          amount: 5000,
          totalAmount: 5000,
          outstandingPrincipal: 5000,
          dueDate: new Date('2025-08-15'),
          month: 'August',
          session: '2025',
          sessionId: session.id,
        },
      });

      const installment2 = await prisma.studentFeeInstallment.create({
        data: {
          studentId: student.id,
          classId: classData.id,
          installmentNumber: 2,
          amount: 5000,
          totalAmount: 5000,
          outstandingPrincipal: 5000,
          dueDate: new Date('2025-09-15'),
          month: 'September',
          session: '2025',
          sessionId: session.id,
        },
      });

      // Create challan for installment 1 first
      const challan1 = await service.createFeeChallan({
        studentId: student.id,
        amount: 5000,
        dueDate: new Date('2025-08-15').toISOString(),
        installmentNumber: 1,
      });

      console.log('Challan 1 created:', {
        id: challan1.id,
        challanNumber: challan1.challanNumber,
        installmentNumber: 1,
      });

      // Now create challan for installment 2 - this should succeed
      let challan2Created = false;
      let errorMessage = null;

      try {
        const challan2 = await service.createFeeChallan({
          studentId: student.id,
          amount: 5000,
          dueDate: new Date('2025-09-15').toISOString(),
          installmentNumber: 2,
        });

        challan2Created = true;
        console.log('Challan 2 created (sequential):', {
          id: challan2.id,
          challanNumber: challan2.challanNumber,
          installmentNumber: 2,
        });
      } catch (error) {
        errorMessage = error.message;
        console.log('Challan 2 creation failed (unexpected):', errorMessage);
      }

      // ASSERTION: Sequential generation should be allowed
      expect(challan2Created).toBe(true);
      expect(errorMessage).toBeNull();

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
