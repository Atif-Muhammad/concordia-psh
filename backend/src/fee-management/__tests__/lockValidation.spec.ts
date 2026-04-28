import { Test, TestingModule } from '@nestjs/testing';
import { FeeManagementService } from '../fee-management.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

/**
 * Unit Tests for Lock Validation in updateFeeChallan
 * 
 * **Validates: Requirements 2.2, 2.3, 3.1, 3.2**
 * 
 * These tests verify that:
 * 1. Locked challans cannot have protected fields (amount, fineAmount, selectedHeads) edited
 * 2. Locked challans can still have status and payment-related fields updated
 * 3. Non-locked challans continue to allow normal editing
 */
describe('FeeManagementService - Lock Validation (Task 4.1)', () => {
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
   * Test Case 1: Locked challan - attempt to edit amount (should fail)
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('should throw error when attempting to edit amount on locked challan', async () => {
    // Setup test data
    const program = await prisma.program.create({
      data: {
        name: `TEST-PROGRAM-LOCK-AMOUNT-${Date.now()}`,
        description: 'Test Program Lock Amount',
        level: 'UNDERGRADUATE',
        duration: '4 years',
      },
    });
    testProgramId = program.id;

    const classData = await prisma.class.create({
      data: {
        name: `TEST-CLASS-LOCK-AMOUNT-${Date.now()}`,
        programId: program.id,
      },
    });
    testClassId = classData.id;

    const session = await prisma.academicSession.create({
      data: {
        name: `TEST-SESSION-LOCK-AMOUNT-${Date.now()}`,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
    });
    testSessionId = session.id;

    const student = await prisma.student.create({
      data: {
        fName: 'Test',
        lName: 'Student Lock Amount',
        rollNumber: `TEST-ROLL-LOCK-AMOUNT-${Date.now()}`,
        dob: new Date('2010-01-01'),
        gender: 'MALE',
        classId: classData.id,
        programId: program.id,
        session: '2025',
      },
    });
    testStudentId = student.id;

    // Create a locked challan
    const lockedChallan = await prisma.feeChallan.create({
      data: {
        challanNumber: `TEST-LOCKED-${Date.now()}`,
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
        settledAmount: 5000,
        isLocked: true, // Locked challan
      },
    });

    // Attempt to edit amount - should throw error
    await expect(
      service.updateFeeChallan(lockedChallan.id, { amount: 6000 })
    ).rejects.toThrow('Cannot edit locked challan. This challan has been superseded and settled.');
  });

  /**
   * Test Case 2: Locked challan - attempt to edit fineAmount (should fail)
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('should throw error when attempting to edit fineAmount on locked challan', async () => {
    // Create a locked challan
    const lockedChallan = await prisma.feeChallan.create({
      data: {
        challanNumber: `TEST-LOCKED-FINE-${Date.now()}`,
        studentId: testStudentId,
        amount: 5000,
        fineAmount: 500,
        dueDate: new Date('2025-09-15'),
        issueDate: new Date('2025-09-01'),
        status: 'VOID',
        installmentNumber: 1,
        month: 'September',
        session: '2025',
        sessionId: testSessionId,
        studentClassId: testClassId,
        studentProgramId: testProgramId,
        lateFeeFine: 0,
        settledAmount: 5000,
        isLocked: true,
      },
    });

    // Attempt to edit fineAmount - should throw error
    await expect(
      service.updateFeeChallan(lockedChallan.id, { fineAmount: 1000 })
    ).rejects.toThrow('Cannot edit locked challan. This challan has been superseded and settled.');
  });

  /**
   * Test Case 3: Locked challan - attempt to edit selectedHeads (should fail)
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('should throw error when attempting to edit selectedHeads on locked challan', async () => {
    // Create a locked challan
    const lockedChallan = await prisma.feeChallan.create({
      data: {
        challanNumber: `TEST-LOCKED-HEADS-${Date.now()}`,
        studentId: testStudentId,
        amount: 5000,
        selectedHeads: JSON.stringify([{ type: 'additional', amount: 500, isSelected: true }]),
        dueDate: new Date('2025-09-15'),
        issueDate: new Date('2025-09-01'),
        status: 'VOID',
        installmentNumber: 1,
        month: 'September',
        session: '2025',
        sessionId: testSessionId,
        studentClassId: testClassId,
        studentProgramId: testProgramId,
        lateFeeFine: 0,
        settledAmount: 5000,
        isLocked: true,
      },
    });

    // Attempt to edit selectedHeads - should throw error
    await expect(
      service.updateFeeChallan(lockedChallan.id, {
        selectedHeads: [{ type: 'additional', amount: 1000, isSelected: true }],
      })
    ).rejects.toThrow('Cannot edit locked challan. This challan has been superseded and settled.');
  });

  /**
   * Test Case 4: Locked challan - allow status update (should succeed)
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('should allow status update on locked challan', async () => {
    // Create a locked challan
    const lockedChallan = await prisma.feeChallan.create({
      data: {
        challanNumber: `TEST-LOCKED-STATUS-${Date.now()}`,
        studentId: testStudentId,
        amount: 5000,
        dueDate: new Date('2025-09-15'),
        issueDate: new Date('2025-09-01'),
        status: 'VOID',
        installmentNumber: 1,
        month: 'September',
        session: '2025',
        sessionId: testSessionId,
        studentClassId: testClassId,
        studentProgramId: testProgramId,
        lateFeeFine: 0,
        settledAmount: 5000,
        isLocked: true,
      },
    });

    // Update status - should succeed (status is not a protected field)
    const updated = await service.updateFeeChallan(lockedChallan.id, {
      remarks: 'Updated remarks',
    });

    expect(updated).toBeDefined();
    expect(updated.remarks).toBe('Updated remarks');
  });

  /**
   * Test Case 5: Non-locked challan - allow amount edit (should succeed)
   * 
   * **Validates: Requirements 3.1, 3.2**
   */
  it('should allow amount edit on non-locked challan', async () => {
    // Create a non-locked challan
    const nonLockedChallan = await prisma.feeChallan.create({
      data: {
        challanNumber: `TEST-NONLOCKED-${Date.now()}`,
        studentId: testStudentId,
        amount: 5000,
        dueDate: new Date('2025-09-15'),
        issueDate: new Date('2025-09-01'),
        status: 'PENDING',
        installmentNumber: 1,
        month: 'September',
        session: '2025',
        sessionId: testSessionId,
        studentClassId: testClassId,
        studentProgramId: testProgramId,
        lateFeeFine: 0,
        isLocked: false, // Not locked
      },
    });

    // Update amount - should succeed
    const updated = await service.updateFeeChallan(nonLockedChallan.id, {
      amount: 6000,
    });

    expect(updated).toBeDefined();
    expect(updated.amount).toBe(6000);
  });

  /**
   * Test Case 6: Locked challan - attempt to edit multiple protected fields (should fail)
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('should throw error when attempting to edit multiple protected fields on locked challan', async () => {
    // Create a locked challan
    const lockedChallan = await prisma.feeChallan.create({
      data: {
        challanNumber: `TEST-LOCKED-MULTI-${Date.now()}`,
        studentId: testStudentId,
        amount: 5000,
        fineAmount: 500,
        dueDate: new Date('2025-09-15'),
        issueDate: new Date('2025-09-01'),
        status: 'VOID',
        installmentNumber: 1,
        month: 'September',
        session: '2025',
        sessionId: testSessionId,
        studentClassId: testClassId,
        studentProgramId: testProgramId,
        lateFeeFine: 0,
        settledAmount: 5000,
        isLocked: true,
      },
    });

    // Attempt to edit multiple protected fields - should throw error
    await expect(
      service.updateFeeChallan(lockedChallan.id, {
        amount: 6000,
        fineAmount: 1000,
      })
    ).rejects.toThrow('Cannot edit locked challan. This challan has been superseded and settled.');
  });
});
