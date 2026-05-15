import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, FeeInstallmentStatus } from '@prisma/client';
import { LateFeeService } from './late-fee.service';
import { InstallmentService } from './installment.service';
import { UpdateFeeChallanDto } from './dtos/update-fee-challan.dto';

/**
 * ChallanService — manages feeChallanV2 records.
 *
 * Responsibilities:
 * - Generating challan snapshots from FeeInstallment records
 * - Enforcing sequential challan generation (no gaps in the chain)
 * - Calculating arrears, late fee, and total amounts at generation time
 * - Creating frozen snapshot records in a single atomic transaction
 * - Bulk generation, extra challans, voiding, and HTML rendering
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 8.1, 8.3, 8.4,
 *               10.1, 10.3, 10.4, 12.1, 12.2, 12.3, 16.1, 16.2, 16.4, 16.5, 20.5
 */
@Injectable()
export class ChallanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lateFeeService: LateFeeService,
    private readonly installmentService: InstallmentService,
  ) {}

  /**
   * Generate a feeChallanV2 snapshot for a given FeeInstallment.
   *
   * Steps:
   * 1. Load FeeInstallment K — throw 404 if not found.
   * 2. Throw 409 if `challanGenerated = TRUE` (already generated).
   * 3. Load all installments for the student ordered globally
   *    (sessionId ASC, installmentNumber ASC); throw 400 if any prior
   *    installment has `challanGenerated = FALSE`.
   * 4. Calculate `arrears = FeeInstallment[K-1].pendingAmount` (0 if K=1).
   *    Populate `arrearsMonths` and `arrearsInstallments` from prior
   *    installments where `pendingAmount > 0`.
   * 5. Calculate `lateFeeFine` via `LateFeeService.calculate` applied to
   *    `(basePayable + arrears)` — the rate is a flat PKR-per-day value.
   * 6. Calculate `totalAmount = basePayable + arrears + lateFeeFine + extraFine - discount`.
   * 7. In a single transaction:
   *    - Update FeeInstallment K with computed fields + set `challanGenerated = TRUE`
   *    - Create feeChallanV2 snapshot with frozen fields
   * 8. Return the created challan with the updated installment.
   *
   * @param installmentId  The FeeInstallment id to generate a challan for.
   * @param dueDate        The due date to set on the challan (used for late fee calc).
   *
   * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 10.1, 10.4, 20.5
   */
  async generateChallan(installmentId: number, dueDate: Date) {
    // ── Step 1: Load FeeInstallment K ────────────────────────────────────────
    // Requirement 20.2: throw 404 if not found
    const installmentK = await this.prisma.feeInstallment.findUnique({
      where: { id: installmentId },
      include: { heads: true },
    });

    if (!installmentK) {
      throw new NotFoundException(
        `FeeInstallment with id ${installmentId} not found`,
      );
    }

    // ── Step 2: Duplicate generation guard ───────────────────────────────────
    // Requirement 20.3: throw 409 if challanGenerated = TRUE
    if (installmentK.challanGenerated) {
      throw new ConflictException(
        `A challan has already been generated for FeeInstallment ${installmentId} ` +
          `(installment #${installmentK.installmentNumber}). ` +
          `Void the existing challan before regenerating.`,
      );
    }

    // ── Step 2: Ensure no duplicate generation ────────────────────────────────
    // We must not allow generating a new challan if one already exists for this 
    // installment that is not VOID or SUPERSEDED.
    const existingChallan = await this.prisma.feeChallanV2.findFirst({
      where: { 
        installmentId: installmentK.id,
        status: { notIn: ['VOID', 'SUPERSEDED'] }
      }
    });

    if (existingChallan) {
      throw new BadRequestException(
        `Challan already exists for this installment (Challan No: ${existingChallan.challanNumber}). ` +
        `If you need to regenerate, please delete the existing one first.`
      );
    }

    // ── Step 3: Sequential chain check ───────────────────────────────────────
    // Requirement 3.1, 3.2, 3.3: all prior installments must have challanGenerated = TRUE
    const allInstallments = await this.prisma.feeInstallment.findMany({
      where: { studentId: installmentK.studentId },
      orderBy: [{ sessionId: 'asc' }, { installmentNumber: 'asc' }],
      select: {
        id: true,
        installmentNumber: true,
        sessionId: true,
        month: true,
        challanGenerated: true,
        pendingAmount: true,
        status: true,
      },
    });

    // Find the global position of installment K in the ordered list
    const indexK = allInstallments.findIndex((i) => i.id === installmentId);

    // Collect all prior installments (position 0..indexK-1) that are missing a challan
    const missingChallans = allInstallments
      .slice(0, indexK)
      .filter((i) => !i.challanGenerated);

    if (missingChallans.length > 0) {
      // Requirement 3.2: error message must identify the specific missing installments
      const details = missingChallans
        .map(
          (i) =>
            `installment #${i.installmentNumber}` +
            (i.month ? ` (${i.month})` : ''),
        )
        .join(', ');

      throw new BadRequestException(
        `Cannot generate challan for installment #${installmentK.installmentNumber}: ` +
          `the following prior installments have not had a challan generated yet — ${details}. ` +
          `Please generate challans for those installments first.`,
      );
    }

    // ── Step 4: Arrears calculation ───────────────────────────────────────────
    // Requirement 4.1, 4.2, 4.3: arrears = pendingAmount of K-1 (0 if K=1)
    // IMPORTANT: Skip SUPERSEDED installments — their debt is already embedded
    // in the active (PENDING/PARTIAL) installment's pendingAmount. Counting them
    // again would double the arrears.
    const prevInstallment = indexK > 0 ? allInstallments[indexK - 1] : null;
    const arrears = prevInstallment
      ? Number(prevInstallment.pendingAmount)
      : 0;

    // Requirement 4.4, 4.5: arrearsMonths and arrearsInstallments
    // List all prior installments that have contributed to the current arrears chain.
    // We include SUPERSEDED installments here so the challan's metadata correctly
    // reflects the full history of the debt (by number).
    const priorUnpaid = allInstallments
      .slice(0, indexK)
      .filter((i) => (Number(i.pendingAmount) > 0 || i.status === 'SUPERSEDED') && i.status !== 'VOID' && i.status !== 'SETTLED');

    const arrearsMonths: string[] = priorUnpaid
      .map((i) => i.month)
      .filter((m): m is string => m !== null && m !== undefined);

    const arrearsInstallments: number[] = priorUnpaid.map((i) => i.installmentNumber);

    // ── Step 5: Late fee calculation ──────────────────────────────────────────
    // Requirement 5.1, 5.3: apply rate to (basePayable + arrears)
    //
    // NOTE — two different "due dates" exist in this flow:
    //   • installmentK.dueDate  → the ORIGINAL installment due date stored in the
    //     fee plan.  This is the accrual start date: late fee begins accruing the
    //     day after this date.  Always use THIS for the late-fee calculation.
    //   • dueDate (parameter)   → the challan's payment collection deadline set
    //     by the admin at generation time (may be later than the installment due
    //     date, e.g. a grace period).  Used only for the challan record itself.
    //
    // The rate is a flat PKR-per-day value (not a percentage).
    const basePayable = Number(installmentK.basePayable);
    const extraFine = Number(installmentK.extraFine);
    const discount = Number(installmentK.discount);

    // Fetch the global late fee rate (ignoring the local installment rate as requested)
    const settings = await this.prisma.instituteSettings.findFirst({ select: { lateFeeRatePerDay: true } });
    const effectiveRate = settings?.lateFeeRatePerDay ? Number(settings.lateFeeRatePerDay) : 0;

    const lateFeeFine = this.lateFeeService.calculate(
      installmentK.dueDate,
      effectiveRate,
    );

    const headsSnapshot = installmentK.heads.map((h) => ({
      id: h.id,
      feeHeadId: h.feeHeadId,
      headName: h.headName,
      amount: Number(h.amount),
      discountAmount: Number(h.discountAmount),
    }));

    const headsSum = headsSnapshot.reduce((sum, h) => sum + h.amount, 0);
    // total = base + arrears + lateFee + extraFine + headsSum - abs(discount)
    const totalAmount = basePayable + arrears + lateFeeFine + extraFine + headsSum - Math.abs(discount);
    const paidAmount = Number(installmentK.paidAmount);
    const pendingAmount = totalAmount - paidAmount;

    // ── Step 7: Generate challan number ───────────────────────────────────────
    const challanNumber = this.generateChallanNumber();

    // ── Step 9: Single transaction — update installment + create challan ──────
    // Requirement 3.4, 10.1, 20.5: all steps in one atomic transaction
    const [updatedInstallment, challan] = await this.prisma.$transaction(
      async (tx) => {
        // Atomic update: Only update if challanGenerated is still false
        // This prevents race conditions where two requests try to generate a challan simultaneously
        const updated = await tx.feeInstallment.updateMany({
          where: { 
            id: installmentId,
            challanGenerated: false, // Only update if still false
          },
          data: {
            arrears,
            arrearsMonths: arrearsMonths.length > 0 ? arrearsMonths : [],
            arrearsInstallments:
              arrearsInstallments.length > 0 ? arrearsInstallments : [],
            lateFeeFine,
            totalAmount,
            pendingAmount,
            lateFeeRatePerDay: effectiveRate,
            challanGenerated: true,
            // Set status to OVERDUE if pending and past due, otherwise restore from VOID to PENDING
            status: pendingAmount <= 0 ? 'PAID' : ((totalAmount > 0 && new Date() > (dueDate || installmentK.dueDate)) 
              ? 'OVERDUE' 
              : (installmentK.status === 'VOID' ? 'PENDING' : installmentK.status)),
            isLocked: pendingAmount <= 0,
          },
        });

        // Check if the update actually affected any rows
        if (updated.count === 0) {
          throw new ConflictException(
            `Cannot generate challan for FeeInstallment ${installmentId}: ` +
              `a challan has already been generated by another process.`,
          );
        }

        // Fetch the updated installment with heads for return
        const updatedInstallmentWithHeads = await tx.feeInstallment.findUnique({
          where: { id: installmentId },
          include: { heads: true },
        });

        if (!updatedInstallmentWithHeads) {
          throw new NotFoundException(`FeeInstallment ${installmentId} not found after update`);
        }

        // Find the source challan for the advance (the one that generated the excess)
        let advanceFromChallanNo: string | null = null;
        const advanceAmount = Number(installmentK.advancePaid || 0);
        if (advanceAmount > 0) {
            const prevChallan = await tx.feeChallanV2.findFirst({
                where: {
                    installment: {
                        studentId: installmentK.studentId,
                        installmentNumber: installmentK.installmentNumber - 1
                    },
                    status: { in: ['PAID', 'PARTIAL'] }
                },
                orderBy: { generatedDate: 'desc' }
            });
            advanceFromChallanNo = prevChallan?.challanNumber ?? null;
        }

        const newChallan = await tx.feeChallanV2.create({
          data: {
            challanNumber,
            installmentId,
            installmentNo: installmentK.installmentNumber,
            generatedDate: new Date(),
            dueDate: installmentK.dueDate,
            snapshotBaseAmount: basePayable,
            snapshotArrearsAmount: arrears,
            snapshotLateFee: lateFeeFine,
            snapshotExtraFine: extraFine,
            snapshotDiscount: discount,
            snapshotTotalDue: totalAmount,
            amountReceived: advanceAmount,
            advanceAmount: advanceAmount,
            advanceFromChallanNo: advanceFromChallanNo,
            status: advanceAmount >= totalAmount ? 'PAID' : (advanceAmount > 0 ? 'PARTIAL' : (new Date() > installmentK.dueDate ? 'OVERDUE' : 'PENDING')),
            challanHeads: {
              create: headsSnapshot
                .filter(h => h.feeHeadId)
                .map(h => ({
                  feeHeadId: h.feeHeadId!,
                  amount: h.amount,
                  headName: h.headName
                }))
            }
          },
        });

        // ── Mark prior installments' challans as SUPERSEDED ───────────────────
        // When arrears from prior installments are absorbed into this challan,
        // mark those prior installments and their active challans as SUPERSEDED.
        // Rule:
        //   - If prior installment is 100% paid → leave it as PAID (not superseded)
        //   - If prior installment has pendingAmount > 0 → mark as SUPERSEDED
        //     (its remaining debt is now tracked in this new challan's snapshotArrearsAmount)
        // Also set settledByChallanNumber on ALL ancestor superseded challans so that
        // when the leading challan is paid, the settlement propagation can find the
        // full transitive chain (e.g. May → June → July: both May and June must point
        // to the July challan as their settler).
        if (priorUnpaid.length > 0) {
          for (const prior of priorUnpaid) {
            // Mark the installment as SUPERSEDED and record which installment superseded it
            await tx.feeInstallment.update({
              where: { id: prior.id },
              data: { 
                status: 'SUPERSEDED',
                supersededBy: installmentId, // Record which installment superseded this one
              },
            });

            // Mark the active challan for this installment as SUPERSEDED
            // and record which leading challan absorbed its debt
            await tx.feeChallanV2.updateMany({
              where: {
                installmentId: prior.id,
                status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
              },
              data: {
                status: 'SUPERSEDED',
                settledByChallanNumber: challanNumber,
              },
            });
          }
        }

        // ── Re-point all existing SUPERSEDED ancestor challans to this new leader ──
        // When a chain grows (e.g. May→June→July), the May challan was already
        // SUPERSEDED pointing at June. Now July becomes the new leader, so May must
        // also point at July. We update all SUPERSEDED challans for this student
        // (except the one we just created) to point at the new challan number.
        // This ensures the settlement propagation in recordPayment() finds the full
        // ancestor chain when the leading challan is eventually paid.
        await tx.feeChallanV2.updateMany({
          where: {
            installmentId: { in: allInstallments.slice(0, indexK).map((i) => i.id) },
            status: 'SUPERSEDED',
            // Only re-point challans that were pointing at a now-superseded challan
            // (i.e. any prior settledByChallanNumber that is no longer the leader)
            NOT: { settledByChallanNumber: challanNumber },
          },
          data: { settledByChallanNumber: challanNumber },
        });

        return [updatedInstallmentWithHeads, newChallan] as const;
      },
    );

    return {
      challan,
      installment: updatedInstallment,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Task 4.2 — Bulk Challan Generation
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate challans in bulk for all students matching the given filters.
   *
   * For each student the method finds their next installment where
   * `challanGenerated = FALSE` (the lowest installmentNumber with that flag).
   * It then calls `generateChallan` for that installment, catching per-student
   * errors so that one failure never aborts the whole batch.
   *
   * @param filters  `programId?`, `classId?`, `sectionId?`, `sessionId` (required)
   * @param dueDate  Due date to set on every generated challan.
   * @returns        Per-student result list with status CREATED | SKIPPED | BLOCKED.
   *
   * Requirements: 12.1, 12.2, 12.3
   */
  async bulkGenerateChallans(
    filters: {
      programId?: number;
      classId?: number;
      sectionId?: number;
      sessionId?: number;
      studentIds?: number[];
      targetInstallmentNumber?: number;
      targetMonth?: string;
      targetYear?: number;
    },
    dueDate: Date,
  ): Promise<
    Array<{
      studentId: number;
      studentName: string;
      rollNumber: string;
      status: 'CREATED' | 'SKIPPED' | 'BLOCKED' | 'ALREADY_EXISTS';
      challanNumber?: string;
      error?: string;
      installmentNumber?: number;
      month?: string;
    }>
  > {
    // ── Find all students matching the filters ────────────────────────────────
    // We use StudentAcademicRecord to filter by class/section/program within a
    // session, then fall back to the Student's own classId/sectionId/programId
    // when no academic record exists for the session.
    const studentWhere: Record<string, unknown> = {};

    // If specific student IDs are provided, use them directly (ignore other filters)
    if (filters.studentIds && filters.studentIds.length > 0) {
      studentWhere.id = { in: filters.studentIds };
    } else {
      if (filters.classId !== undefined) studentWhere.classId = filters.classId;
      if (filters.sectionId !== undefined) studentWhere.sectionId = filters.sectionId;
      if (filters.programId !== undefined) studentWhere.programId = filters.programId;
    }

    const students = await this.prisma.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        fName: true,
        lName: true,
        rollNumber: true,
      },
    });

    const results: Array<{
      studentId: number;
      studentName: string;
      rollNumber: string;
      status: 'CREATED' | 'SKIPPED' | 'BLOCKED' | 'ALREADY_EXISTS';
      challanNumber?: string;
      error?: string;
      installmentNumber?: number;
      month?: string;
    }> = [];

    // ── Process each student independently (Requirement 12.1) ─────────────────
    for (const student of students) {
      const studentName = [student.fName, student.lName]
        .filter(Boolean)
        .join(' ');

      let targetInstallment;

      // 1. Determine which installment to generate for (Requirement: MUST specify target to avoid auto-delegation)
      const installmentWhere: any = {
        studentId: student.id,
      };

      if (!filters.targetInstallmentNumber && !filters.targetMonth) {
        // Requirement: No auto-delegation. If no target is specified, skip with error.
        results.push({
          studentId: student.id,
          studentName,
          rollNumber: student.rollNumber,
          status: 'FAILED' as any,
          error: 'Please specify a target month or installment number for generation.',
        });
        continue;
      }

      if (filters.sessionId) {
        installmentWhere.sessionId = Number(filters.sessionId);
      }

      if (filters.targetInstallmentNumber) {
        installmentWhere.installmentNumber = Number(filters.targetInstallmentNumber);
      }
      
      if (filters.targetMonth) {
        installmentWhere.month = filters.targetMonth;
      }

      if (filters.targetYear) {
        const year = Number(filters.targetYear);
        installmentWhere.dueDate = {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        };
      }

      targetInstallment = await this.prisma.feeInstallment.findFirst({
        where: installmentWhere,
        select: { 
          id: true, 
          installmentNumber: true, 
          month: true, 
          challanGenerated: true,
          status: true,
        },
      });

      if (!targetInstallment) {
        // Specific installment not found for this student
        results.push({
          studentId: student.id,
          studentName,
          rollNumber: student.rollNumber,
          status: 'SKIPPED',
          error: `No installment found for ${filters.targetMonth ? `month "${filters.targetMonth}"` : `installment number ${filters.targetInstallmentNumber}`}`,
        });
        continue;
      }

      if (targetInstallment.challanGenerated) {
        // Requirement: Show error/info message if already generated instead of delegating
        results.push({
          studentId: student.id,
          studentName,
          rollNumber: student.rollNumber,
          status: 'ALREADY_EXISTS',
          installmentNumber: targetInstallment.installmentNumber,
          month: targetInstallment.month,
          error: `Challan already generated for ${targetInstallment.month ? `${targetInstallment.month} (installment #${targetInstallment.installmentNumber})` : `installment #${targetInstallment.installmentNumber}`}.`,
        });
        continue;
      }

      // Attempt to generate the challan; catch errors per-student (Requirement 12.1)
      try {
        const { challan } = await this.generateChallan(
          targetInstallment.id,
          dueDate,
        );

        results.push({
          studentId: student.id,
          studentName,
          rollNumber: student.rollNumber,
          status: 'CREATED',
          challanNumber: challan.challanNumber,
          installmentNumber: targetInstallment.installmentNumber,
          month: targetInstallment.month,
        });
      } catch (err: unknown) {
        // Sequential check failure or any other error → BLOCKED (Requirement 12.3)
        const message =
          err instanceof Error ? err.message : 'Unknown error occurred';

        results.push({
          studentId: student.id,
          studentName,
          rollNumber: student.rollNumber,
          status: 'BLOCKED',
          error: message,
          installmentNumber: targetInstallment.installmentNumber,
          month: targetInstallment.month,
        });
      }
    }

    return results;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Task 4.3 — Extra Challan Generation
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create a standalone EXTRA-type feeChallanV2 for a student.
   *
   * EXTRA challans are not linked to any FeeInstallment — they represent
   * ad-hoc fines or charges billed directly to a student.
   *
   * @param studentId  The student to bill.
   * @param heads      Array of `{ headName, amount }` objects describing the charges.
   * @param dueDate    Due date for this challan.
   * @param remarks    Optional free-text remarks.
   * @returns          The created feeChallanV2 record.
   *
   * Requirements: 8.1, 8.3, 8.4
   */
  async generateExtraChallan(
    studentId: number,
    feeHeadIds: number[],
    dueDate: Date,
    remarks?: string,
    legacyHeads?: Array<{ headName: string; amount: number }>,
  ) {
    // Verify the student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${studentId} not found`);
    }

    // Load fee heads
    const heads = feeHeadIds && feeHeadIds.length > 0
      ? await this.prisma.feeHead.findMany({ where: { id: { in: feeHeadIds } } })
      : [];

    // Calculate total from all head amounts (Requirement 8.3)
    const snapshotTotalDue = heads.reduce((sum, h) => sum + Number(h.amount), 0)
      + (legacyHeads?.reduce((sum, h) => sum + h.amount, 0) || 0);

    // Generate a unique challan number
    const challanNumber = this.generateChallanNumber();

    // Create the EXTRA challan (dedicated table)
    const challan = await this.prisma.extraChallan.create({
      data: {
        challanNumber,
        studentId,
        generatedAt: new Date(),
        dueDate: dueDate,
        totalAmount: snapshotTotalDue,
        paidAmount: 0,
        status: 'PENDING',
        heads: {
          create: [
            ...heads.map(h => ({
              feeHeadId: h.id,
              headName: h.name,
              amount: h.amount
            })),
            ...(legacyHeads || []).map(lh => ({
              headName: lh.headName,
              amount: lh.amount
            }))
          ]
        },
        remarks: remarks ?? null,
      },
    });

    return challan;
  }

  /**
   * Bulk generate EXTRA challans for students matching filters.
   */
  async bulkGenerateExtraChallans(
    filters: {
      programId?: number;
      classId?: number;
      sectionId?: number;
      studentIds?: number[];
    },
    feeHeadIds: number[],
    legacyHeads: Array<{ headName: string; amount: number }>,
    dueDate: Date,
    remarks?: string,
  ) {
    const studentWhere: any = {};
    if (filters.studentIds && filters.studentIds.length > 0) {
      studentWhere.id = { in: filters.studentIds };
    } else {
      if (filters.programId) studentWhere.programId = Number(filters.programId);
      if (filters.classId) studentWhere.classId = Number(filters.classId);
      if (filters.sectionId) studentWhere.sectionId = Number(filters.sectionId);
    }

    const students = await this.prisma.student.findMany({
      where: studentWhere,
      select: { id: true }
    });

    const results: any[] = [];
    for (const student of students) {
      try {
        const challan = await this.generateExtraChallan(
          student.id,
          feeHeadIds,
          dueDate,
          remarks,
          legacyHeads
        );
        results.push({ studentId: student.id, status: 'CREATED', challanNumber: challan.challanNumber });
      } catch (err) {
        results.push({ studentId: student.id, status: 'FAILED', error: err.message });
      }
    }

    return results;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Task 4.4 — Void Challan
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Void a feeChallanV2.
   *
   * - Throws 400 if the challan is already PAID (cannot void a paid challan).
   * - Sets challan `status = VOID`.
   * - Resets `FeeInstallment.challanGenerated = FALSE` so a new challan can be
   *   generated for the same installment.
   * - If partial payments existed (`amountReceived > 0`), recalculates
   *   `pendingAmount` on the linked installment by reversing those payments.
   * - Triggers `cascadeArrears` via `InstallmentService` to propagate the
   *   change to all subsequent unlocked installments.
   * - All DB writes happen in a single transaction.
   *
   * @param challanId  The feeChallanV2 id to void.
   * @returns          The voided challan record.
   *
   * Requirements: 20.5
   */
  async voidChallan(challanId: number) {
    // Load the challan with its linked installment
    const challan = await this.prisma.feeChallanV2.findUnique({
      where: { id: challanId },
      include: {
        installment: true,
      },
    });

    if (!challan) {
      throw new NotFoundException(
        `feeChallanV2 with id ${challanId} not found`,
      );
    }

    // Cannot void a paid or settled challan
    if (challan.status === 'PAID') {
      throw new BadRequestException('Cannot void a paid challan.');
    }
    if (challan.status === 'SETTLED') {
      throw new BadRequestException('Cannot void a fully settled challan.');
    }

    // ── Chain-aware voiding in a single transaction ──────────────────────────
    // Flow C: When voiding challan X (which may have SUPERSEDED ancestors),
    // restore the specific chain linked to X. Do NOT touch other chains.
    await this.prisma.$transaction(async (tx) => {
      // Step 1: Find all SUPERSEDED challans that X superseded (ancestors in the chain)
      // Only query SUPERSEDED status — do not touch SETTLED challans (Req 1.2, 1.3).
      const supersededChallans = await tx.feeChallanV2.findMany({
        where: {
          settledByChallanNumber: challan.challanNumber,
          status: 'SUPERSEDED',
        },
      });

      // Step 2: Restore each superseded challan to PENDING and reset its installment
      for (const sc of supersededChallans) {
        await tx.feeChallanV2.update({
          where: { id: sc.id },
          data: {
            status: 'PENDING',
            settledByChallanNumber: null,
            settledAmount: null,
            settledAt: null,
            paidAt: null,
            paymentInfo: Prisma.DbNull,
            amountReceived: 0,
          },
        });

        // Step 3: Restore the installment linked to this superseded challan.
        // Reset to PENDING with base amounts — no arrears, no payment state (Req 6.3).
        if (sc.installmentId) {
          const scInst = await tx.feeInstallment.findUnique({ where: { id: sc.installmentId } });
          if (scInst) {
            await tx.feeInstallment.update({
              where: { id: sc.installmentId },
              data: {
                status: 'PENDING',
                supersededBy: null,
                settled: null,
                settledByInstallmentId: null,
                challanGenerated: false,
                isLocked: false,
                paidAmount: 0,
                pendingAmount: Number(scInst.basePayable),
                totalAmount: Number(scInst.basePayable),
                arrears: 0,
                arrearsMonths: [],
                arrearsInstallments: [],
                lastPaymentDate: null,
                lastPaymentAmount: null,
              },
            });
          }
        }
      }

      // Step 4: Restore the installment linked to challan X itself
      if (challan.installmentId) {
        const restorationData = await this.getRestorationData(tx, challan.installmentId);
        if (restorationData) {
          await tx.feeInstallment.update({
            where: { id: challan.installmentId },
            data: restorationData as any,
          });
        }
      }

      // Step 5: Set the challan itself to VOID
      await tx.feeChallanV2.update({
        where: { id: challanId },
        data: { status: 'VOID' },
      });
    });

    // Trigger cascadeArrears outside the transaction (it opens its own transaction)
    // so that the installment updates above are visible to the cascade query.
    if ((challan as any).installment) {
      await this.installmentService.cascadeArrears(
        (challan as any).installment.studentId,
        (challan as any).installment.installmentNumber + 1,
      );
    }

    // Return the voided challan
    return this.prisma.feeChallanV2.findUnique({
      where: { id: challanId },
    });
  }

  async deleteChallan(challanId: number) {
    // 1. Load the challan and its installment
    const challan = await this.prisma.feeChallanV2.findUnique({
      where: { id: challanId },
      include: { 
        installment: true 
      } as any,
    });

    if (!challan) throw new NotFoundException(`Challan ${challanId} not found`);
    if (challan.status === 'SETTLED') throw new BadRequestException('Cannot delete a settled challan. Delete the leading challan instead.');

    const isPaid = challan.status === 'PAID';

    await this.prisma.$transaction(async (tx) => {
      // Step 1: Find all challans that were superseded/settled by this challan.
      // For a PAID challan, these will be SETTLED challans that need to be
      // restored to SUPERSEDED (their pre-payment state).
      // For a non-paid challan, these will be SUPERSEDED challans.
      const supersededChallans = await tx.feeChallanV2.findMany({
        where: { settledByChallanNumber: challan.challanNumber },
      });

      // Step 2: Restore each superseded/settled challan
      for (const sc of supersededChallans) {
        if (isPaid && sc.status === 'SETTLED') {
          // Restore SETTLED → SUPERSEDED (undo the settlement caused by this payment)
          // Keep settledByChallanNumber pointing to this challan so the chain
          // metadata is preserved — but clear the settlement fields.
          await tx.feeChallanV2.update({
            where: { id: sc.id },
            data: {
              status: 'SUPERSEDED' as any,
              settledAmount: null,
              settledAt: null,
              paidAt: null,
              paymentInfo: Prisma.DbNull,
            },
          });

          // Restore the installment: SETTLED → SUPERSEDED, clear payment fields
          if (sc.installmentId) {
            const scInst = await tx.feeInstallment.findUnique({ where: { id: sc.installmentId } });
            if (scInst) {
              // Restore totalAmount and pendingAmount from the ancestor challan's snapshot.
              // The ancestor was SUPERSEDED before it was SETTLED, so its pending amount
              // was snapshotTotalDue - amountReceived (money paid before superseding).
              const scSnapshotTotal = Number(sc.snapshotTotalDue);
              const scPrePaidAmount = Number(sc.amountReceived); // paid before being superseded
              const scRestoredPending = Math.max(0, scSnapshotTotal - scPrePaidAmount);

              await tx.feeInstallment.update({
                where: { id: sc.installmentId },
                data: {
                  status: 'SUPERSEDED' as any,
                  settled: null,
                  settledByInstallmentId: null,
                  isLocked: false,
                  paidAmount: scPrePaidAmount,
                  pendingAmount: scRestoredPending,
                  totalAmount: scSnapshotTotal,
                  settledAmount: 0,
                  lastPaymentDate: null,
                  lastPaymentAmount: null,
                },
              });
            }
          }
        } else {
          // Non-paid deletion: restore the ancestor chain correctly.
          //
          // Because generateChallan re-points ALL ancestors to the latest leader,
          // all ancestors have settledByChallanNumber = deleted challan's number.
          // We must reconstruct the original chain:
          //   - The direct predecessor (highest installmentNo among ancestors) becomes
          //     the new leading challan → restore to PENDING/PARTIAL/OVERDUE
          //   - All other ancestors remain SUPERSEDED but now point to the new leader
          //
          // Sort ancestors by installmentNo descending to find the direct predecessor.
          const sortedAncestors = [...supersededChallans]
            .filter(a => a.status === 'SUPERSEDED')
            .sort((a, b) => (b.installmentNo ?? 0) - (a.installmentNo ?? 0));
          const newLeader = sortedAncestors[0]; // highest installmentNo = direct predecessor

          if (sc.id === newLeader?.id) {
            // This is the new leading challan — restore to active status
            const scStatus = Number(sc.amountReceived) > 0
              ? 'PARTIAL'
              : (sc.dueDate && new Date() > new Date(sc.dueDate) ? 'OVERDUE' : 'PENDING');

            await tx.feeChallanV2.update({
              where: { id: sc.id },
              data: {
                status: scStatus as any,
                settledByChallanNumber: null,
                settledAmount: null,
                settledAt: null,
                paidAt: null,
                paymentInfo: Prisma.DbNull,
              },
            });

            if (sc.installmentId) {
              const restorationData = await this.getRestorationData(tx, sc.installmentId, sc);
              if (restorationData) {
                await tx.feeInstallment.update({
                  where: { id: sc.installmentId },
                  data: restorationData,
                });
              }
            }
          } else {
            // This is a deeper ancestor — keep it SUPERSEDED but re-point to the new leader
            await tx.feeChallanV2.update({
              where: { id: sc.id },
              data: {
                status: 'SUPERSEDED' as any,
                settledByChallanNumber: newLeader?.challanNumber ?? null,
                settledAmount: null,
                settledAt: null,
                paidAt: null,
                paymentInfo: Prisma.DbNull,
              },
            });

            // Also restore the installment's supersededBy to point to the new leader's installment
            if (sc.installmentId && newLeader?.installmentId) {
              await tx.feeInstallment.update({
                where: { id: sc.installmentId },
                data: {
                  supersededBy: newLeader.installmentId,
                },
              });
            }
          }
        }
      }

      // Step 3: Restore the installment linked to THIS challan.
      // For a PAID challan deletion, the leading installment must be fully reset
      // to PENDING with paidAmount=0 — the payment is being erased.
      // For a non-paid deletion, use getRestorationData which preserves any
      // partial payment state.
      if (challan.installmentId) {
        if (isPaid) {
          // Fully reset the leading installment — payment is being erased
          const inst = await tx.feeInstallment.findUnique({
            where: { id: challan.installmentId },
            include: { heads: true },
          });
          if (inst) {
            const basePayable = Number(inst.basePayable);
            const extraFine = Number(challan.snapshotExtraFine || 0);
            const discount = Number(challan.snapshotDiscount || 0);
            const arrears = Number(challan.snapshotArrearsAmount || 0);
            const headsSum = (inst.heads || []).reduce((sum, h) => sum + Number(h.amount), 0);
            const lateFeeFine = this.lateFeeService.calculate(
              inst.dueDate,
              Number(inst.lateFeeRatePerDay || 0),
            );
            const totalAmount = basePayable + headsSum + extraFine + Number(lateFeeFine) + arrears - Math.abs(discount);

            await tx.feeInstallment.update({
              where: { id: challan.installmentId },
              data: {
                status: new Date() > inst.dueDate ? 'OVERDUE' : 'PENDING',
                supersededBy: null,
                settled: null,
                settledByInstallmentId: null,
                isLocked: false,
                challanGenerated: false,
                paidAmount: 0,
                pendingAmount: totalAmount,
                totalAmount,
                lateFeeFine,
                settledAmount: 0,
                lastPaymentDate: null,
                lastPaymentAmount: null,
              } as any,
            });
          }
        } else {
          const restorationData = await this.getRestorationData(tx, challan.installmentId, challan);
          if (restorationData) {
            await tx.feeInstallment.update({
              where: { id: challan.installmentId },
              data: restorationData as any,
            });
          }
        }
      }

      // Step 4: Delete payment audit records
      await tx.challanPayment.deleteMany({ where: { challanId } });

      // Step 5: Delete the challan record itself
      await tx.feeChallanV2.delete({ where: { id: challanId } });
    });

    // Step 6: Trigger cascadeArrears
    if ((challan as any).installment) {
      await this.installmentService.cascadeArrears(
        (challan as any).installment.studentId,
        (challan as any).installment.installmentNumber + 1,
      );
    }

    return { success: true };
  }

  private async getRestorationData(tx: any, installmentId: number, fromChallan?: any) {
    const inst = await tx.feeInstallment.findUnique({
      where: { id: installmentId },
      include: { heads: true }
    });
    
    if (!inst) return null;

    const basePayable = Number(inst.basePayable);
    // Restore figures from challan snapshot if available
    const extraFine = fromChallan ? Number(fromChallan.snapshotExtraFine || 0) : Number(inst.extraFine || 0);
    const discount = fromChallan ? Number(fromChallan.snapshotDiscount || 0) : Number(inst.discount || 0);
    const arrears = fromChallan ? Number(fromChallan.snapshotArrearsAmount || 0) : 0;
    
    const headsSum = (inst.heads || []).reduce((sum, h) => sum + Number(h.amount), 0);
    
    // Recalculate late fee fine up to now (or based on due date)
    const lateFeeFine = this.lateFeeService.calculate(
      inst.dueDate,
      Number(inst.lateFeeRatePerDay || 0)
    );

    // total = base + heads + extraFine + lateFee + arrears - discount
    const totalAmount = basePayable + headsSum + extraFine + Number(lateFeeFine) + arrears - Math.abs(discount);
    const pendingAmount = totalAmount - Number(inst.paidAmount || 0);

    // Determine if challanGenerated should be true.
    // If we are restoring a SUPERSEDED installment, it still has its own challan, so it should stay true.
    // If we are restoring the PRIMARY installment whose challan was just deleted, it should be false.
    // We check if the challan we are restoring FROM is the one that was recently deleted.
    const isPrimaryDelete = fromChallan && fromChallan.installmentId === installmentId && fromChallan.status !== 'SUPERSEDED';

    return {
      status: (Number(inst.paidAmount) > 0 
        ? 'PARTIAL' 
        : (new Date() > inst.dueDate ? 'OVERDUE' : 'PENDING')) as any,
      supersededBy: null,
      settled: null,
      settledByInstallmentId: null,
      isLocked: false,
      challanGenerated: !isPrimaryDelete,
      paidAmount: Number(inst.paidAmount || 0),
      pendingAmount,
      totalAmount,
      lateFeeFine,
      arrears: arrears,
      arrearsMonths: inst.arrearsMonths,
      arrearsInstallments: inst.arrearsInstallments,
      lastPaymentDate: null,
      lastPaymentAmount: null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Task 4.5 — Challan HTML Rendering
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Render a feeChallanV2 into an HTML string using a FeeChallanTemplate.
   *
   * Uses frozen snapshot fields from the challan record — never reads live
   * FeeInstallment values for the printed amounts (Requirement 10.3, 16.2).
   *
   * Placeholder mapping:
   *   {{Tuition Fee}}   → snapshotBaseAmount
   *   {{arrears}}       → snapshotArrearsAmount
   *   {{lateFee}}       → snapshotLateFee
   *   {{totalPayable}}  → snapshotTotalDue
   *   {{feeHeadsRows}}  → HTML table rows from heads JSON
   *   {{studentName}}   → student full name (from installment → student)
   *   {{rollNumber}}    → student roll number
   *   {{challanNumber}} → challan number
   *   {{dueDate}}       → formatted due date from installment
   *   {{totalInWords}}  → total due in words
   *
   * @param challanId   The feeChallanV2 id to render.
   * @param templateId  Optional template id; falls back to the default template.
   * @returns           Rendered HTML string.
   *
   * Requirements: 10.3, 16.1, 16.2, 16.4, 16.5
   */
  async getChallanHtml(
    challanId: number,
    templateId?: number,
  ): Promise<string> {
    // ── Fetch the challan with its linked installment and student ─────────────
    const challan = await this.prisma.feeChallanV2.findUnique({
      where: { id: challanId },
      include: {
        installment: {
          include: {
            student: {
              include: {
                section: true,
                program: true
              }
            },
            class: {
              include: {
                program: true
              }
            },
            session: true,
            heads: true
          },
        },
        challanHeads: { include: { feeHead: true } }
      } as any,
    });

    if (!challan) {
      throw new NotFoundException(
        `feeChallanV2 with id ${challanId} not found`,
      );
    }

    const c = challan as any;

    // ── Fetch the template ────────────────────────────────────────────────────
    let template: { htmlContent: string } | null = null;

    if (templateId !== undefined) {
      template = await this.prisma.feeChallanTemplate.findUnique({
        where: { id: templateId },
        select: { htmlContent: true },
      });

      if (!template) {
        throw new NotFoundException(
          `FeeChallanTemplate with id ${templateId} not found`,
        );
      }
    } else {
      // Fall back to the default template (Requirement 16.1)
      // Prioritize the template that matches the challan's type
      const targetType = c.type || 'INSTALLMENT';
      template = await this.prisma.feeChallanTemplate.findFirst({
        where: { type: targetType, isDefault: true },
        select: { htmlContent: true },
      });

      if (!template) {
        template = await this.prisma.feeChallanTemplate.findFirst({
          where: { type: targetType },
          select: { htmlContent: true },
        });
      }

      if (!template) {
        template = await this.prisma.feeChallanTemplate.findFirst({
          where: { isDefault: true },
          select: { htmlContent: true },
        });
      }

      if (!template) {
        throw new NotFoundException(
          `No suitable FeeChallanTemplate found for type ${targetType}. Please configure a template in the database.`,
        );
      }
    }

    // ── Resolve student and context info ─────────────────────────────────────
    const inst = c.installment || {};
    
    // Fetch Global Late Fee Settings
    const settings = await this.prisma.instituteSettings.findFirst();
    const globalLateFeeRate = settings?.lateFeeRatePerDay ? Number(settings.lateFeeRatePerDay) : 0;
    const finalLateFeeRate = Number(inst.lateFeeRatePerDay || globalLateFeeRate);
    const student = inst.student ?? {};
    const studentName = [student.fName, student.lName].filter(Boolean).join(' ') || '';
    const fatherName = student.fatherOrguardian || '';
    const programName = inst.class?.program?.name || student.program?.name || '';
    const className = inst.class?.name || '';
    const sectionName = student.section?.name || '';
    const sessionName = inst.session?.name || '';
    const fullClassPath = [programName, className, sectionName].filter(Boolean).join(' / ');
    const rollNo = student.rollNumber || '';
    const installmentNo = inst.installmentNumber || '';
    const month = inst.month || '';

    // ── Resolve dates ─────────────────────────────────────────────────────────
    const issueDate = this.formatDate(c.generatedDate);
    const dueDateRaw = c.dueDate ?? inst.dueDate ?? c.generatedDate;
    const dueDate = this.formatDate(dueDateRaw);

    // ── Build Arrears Chain Breakdown ────────────────────────────────────────
    let arrearsRows = '';
    const snapshotArrearsAmount = Number(c.snapshotArrearsAmount || 0);
    if (snapshotArrearsAmount > 0 && inst.arrearsInstallments) {
      try {
        const arrearsNums = Array.isArray(inst.arrearsInstallments) 
          ? inst.arrearsInstallments 
          : JSON.parse(inst.arrearsInstallments as string);
        
        if (Array.isArray(arrearsNums) && arrearsNums.length > 0) {
          const priorInsts = await this.prisma.feeInstallment.findMany({
            where: { 
              studentId: inst.studentId,
              sessionId: inst.sessionId,
              installmentNumber: { in: arrearsNums } 
            },
            orderBy: { installmentNumber: 'asc' }
          });
          
          arrearsRows = priorInsts.map(pi => 
            `<tr style="background-color: #fafafa; line-height: 1.2;">
              <td style="padding-left: 25px; font-style: italic; font-size: 10px; color: #555;">&#8627; ${pi.month} (#${pi.installmentNumber}) Balance</td>
              <td style="font-size: 10px; color: #555;">${(Number(pi.pendingAmount)).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>`
          ).join('\n');
          
          if (snapshotArrearsAmount > 0) {
            arrearsRows += `<tr style="background-color: #e0e0e0; line-height: 1.2;">
              <td style="padding-left: 10px; font-size: 10px;"><strong>Total Arrears Balance</strong></td>
              <td style="font-size: 11px;"><strong>${snapshotArrearsAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></td>
            </tr>`;
          }
        } else {
          arrearsRows = `<tr><td>Arrears (Previous Balance)</td><td>${snapshotArrearsAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>`;
        }
      } catch (e) {
        arrearsRows = `<tr><td>Arrears (Previous Balance)</td><td>${snapshotArrearsAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>`;
      }
    } else if (snapshotArrearsAmount > 0) {
      arrearsRows = `<tr><td>Arrears (Previous Balance)</td><td>${snapshotArrearsAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>`;
    }

    // ── Build Payment History Table ──────────────────────────────────────────
    let paymentHistoryMonths = '';
    let paymentHistoryTotals = '';
    let paymentHistoryPaid = '';

    if (inst.studentId && inst.sessionId) {
      const allInsts = await this.prisma.feeInstallment.findMany({
        where: { 
          studentId: inst.studentId, 
          sessionId: inst.sessionId,
          installmentNumber: { lt: inst.installmentNumber }
        },
        orderBy: { installmentNumber: 'asc' }
      });

      paymentHistoryMonths = allInsts.map(i => `<td>${i.month}</td>`).join('');
      paymentHistoryTotals = allInsts.map(i => `<td>${Number(i.totalAmount).toLocaleString()}</td>`).join('');
      paymentHistoryPaid = allInsts.map(i => `<td>${Number(i.paidAmount).toLocaleString()}</td>`).join('');
    }

    // ── Snapshot amounts ──────────────────────────────────────────────────────
    const snapshotBaseAmount = Number(c.snapshotBaseAmount);
    const snapshotLateFee = Number(c.snapshotLateFee);
    const snapshotTotalDue = Number(c.snapshotTotalDue);
    const snapshotDiscount = Number(c.snapshotDiscount) || Number(inst.discount) || 0;
    const extraFine = Number(inst.extraFine || 0);

    // ── Resolve Discount ──────────────────────────────────────────────────────
    const discount = snapshotDiscount;

    // ── Resolve Heads (Snapshot fallback to live) ─────────────────────────────
    let headsData: any[] = c.challanHeads || [];
    if (headsData.length === 0 && inst.heads) {
      headsData = inst.heads.map((h: any) => ({ headName: h.headName || h.name, amount: h.amount }));
    }
    const headsRowsList: string[] = [];
    if (snapshotBaseAmount > 0) {
      headsRowsList.push(`<tr><td>Tuition Fee</td><td>${snapshotBaseAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>`);
    }
    headsData.forEach((h: any) => {
      const amt = Number(h.amount);
      if (amt !== 0) {
        headsRowsList.push(`<tr><td>${this.escapeHtml(h.headName || h.name || 'Fee')}</td><td>${amt < 0 ? `- ${Math.abs(amt).toLocaleString(undefined, {minimumFractionDigits: 2})}` : amt.toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>`);
      }
    });
    if (snapshotLateFee > 0) {
      headsRowsList.push(`<tr><td>Late Fee (Overdue)</td><td>${snapshotLateFee.toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>`);
    }
    if (extraFine > 0) {
      headsRowsList.push(`<tr><td>Fine (Extra)</td><td>${extraFine.toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>`);
    }
    if (Math.abs(discount) > 0) {
      headsRowsList.push(`<tr><td>Discount</td><td>-${Math.abs(discount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>`);
    }
    const feeHeadsRows = headsRowsList.join('\n');

    // ── Replace Placeholders ──────────────────────────────────────────────────
    let html = template.htmlContent;

    // Inject print color adjust to ensure backgrounds show in PDF
    html = html.replace('</head>', '<style>body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }</style></head>');

    // Standard mappings from the provided template
    html = html.replace(/\{\{challanNo\}\}/g, this.escapeHtml(c.challanNumber));
    html = html.replace(/\{\{challanNumber\}\}/g, this.escapeHtml(c.challanNumber));
    html = html.replace(/\{\{issueDate\}\}/g, issueDate);
    html = html.replace(/\{\{dueDate\}\}/g, dueDate);
    html = html.replace(/\{\{studentName\}\}/g, this.escapeHtml(studentName));
    html = html.replace(/\{\{fatherName\}\}/g, this.escapeHtml(fatherName));
    html = html.replace(/\{\{class\}\}/g, this.escapeHtml(fullClassPath));
    html = html.replace(/\{\{rollNo\}\}/g, this.escapeHtml(rollNo));
    html = html.replace(/\{\{rollNumber\}\}/g, this.escapeHtml(rollNo));
    html = html.replace(/\{\{session\}\}/g, this.escapeHtml(sessionName));
    html = html.replace(/\{\{month\}\}/g, this.escapeHtml(month));
    html = html.replace(/\{\{installmentNo\}\}/g, installmentNo.toString());
    html = html.replace(/\{\{lateFeeRatePerDay\}\}/g, finalLateFeeRate.toFixed(2));
    
    // Fee table mappings
    html = html.replace(/\{\{Tuition Fee\}\}/g, '');
    html = html.replace(/\{\{feeHeadsRows\}\}/g, feeHeadsRows);
    html = html.replace(/\{\{arrearsRows\}\}/g, arrearsRows);
    html = html.replace(/\{\{arrears\}\}/g, snapshotArrearsAmount.toLocaleString(undefined, {minimumFractionDigits: 2}));
    html = html.replace(/\{\{discount\}\}/g, '');

    const isFullyPaid = c.status === 'PAID' || c.status === 'SETTLED';
    const cellStyle = 'background-color: #e0e0e0; font-weight: bold;';

    const totalDueStr = snapshotTotalDue.toLocaleString(undefined, {minimumFractionDigits: 2});
    const totalInWordsStr = this.numberToWords(snapshotTotalDue);

    if (isFullyPaid) {
      let latestRemarks = c.remarks || '';
      if (!latestRemarks && c.paymentInfo) {
        try {
          const info = typeof c.paymentInfo === 'string' ? JSON.parse(c.paymentInfo) : c.paymentInfo;
          latestRemarks = info.remarks || '';
        } catch (e) {}
      }
      
      // Gray out full cells for "Total Payable" row
      html = html.replace(/<td>Total Payable within due date<\/td>/gi, `<td style="${cellStyle}">Total Payable within due date</td>`);
      html = html.replace(/<td>\{\{totalPayable\}\}<\/td>/gi, `<td style="${cellStyle}">0.00</td>`);
      // Fallback for non-td placeholder
      html = html.replace(/\{\{totalPayable\}\}/g, '0.00');
      
      // Gray out full cells for "Remarks" row
      html = html.replace(/<td>Late Fee Fine after due date<\/td>/gi, `<td style="${cellStyle}">Remarks</td>`);
      html = html.replace(/<td>Rs\.\s*\d+\s*Per\s*Day<\/td>/gi, `<td style="${cellStyle}">${latestRemarks || 'FULLY PAID / SETTLED'}</td>`);
      // Fallback for placeholder
      html = html.replace(/\{\{lateFee\}\}/g, latestRemarks || 'FULLY PAID / SETTLED');
    } else {
      html = html.replace(/<td>Total Payable within due date<\/td>/gi, `<td style="${cellStyle}">Total Payable within due date</td>`);
      html = html.replace(/<td>\{\{totalPayable\}\}<\/td>/gi, `<td style="${cellStyle}">${totalDueStr}</td>`);
      
      html = html.replace(/\{\{totalPayable\}\}/g, totalDueStr);
      html = html.replace(/\{\{lateFee\}\}/g, snapshotLateFee.toLocaleString(undefined, {minimumFractionDigits: 2}));
    }
    
    html = html.replace(/\{\{totalInWords\}\}/g, `<strong>${totalInWordsStr}</strong>`);
    html = html.replace(/\{\{amountInWords\}\}/g, totalInWordsStr);

    // History table mappings
    html = html.replace(/\{\{paymentHistoryMonths\}\}/g, paymentHistoryMonths);
    html = html.replace(/\{\{paymentHistoryTotals\}\}/g, paymentHistoryTotals);
    html = html.replace(/\{\{paymentHistoryPaid\}\}/g, paymentHistoryPaid);

    // Handle extra rows if needed (placeholders that might be empty)
    const amountReceived = Number(c.amountReceived || 0);
    if (amountReceived > 0) {
      const remaining = Math.max(0, snapshotTotalDue - amountReceived);
      const paidRowHtml = `
        <tr style="color: #166534; background-color: #f0fdf4; font-weight: 600; font-size: 11px;">
          <td>Paid Amount / Advance Credits</td>
          <td>- ${amountReceived.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        </tr>
        <tr style="font-weight: 700; border-top: 1px solid #e2e8f0;">
          <td>Remaining Balance</td>
          <td>${remaining.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        </tr>
      `;
      html = html.replace(/\{\{paidRow\}\}/g, paidRowHtml);
    } else {
      html = html.replace(/\{\{paidRow\}\}/g, '');
    }

    html = html.replace(/\{\{paymentDetailsRow\}\}/g, '');
    
    html = html.replace(/\{\{paymentDetailsRow\}\}/g, '');

    return html;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate a random 8-character alphanumeric challan number.
   *
   * Uses uppercase letters and digits for readability.
   * Collision probability is negligible for typical school volumes
   * (62^8 ≈ 218 trillion combinations).
   */
  private generateChallanNumber(): string {
    // 8-digit numeric challan number (10,000,000 – 99,999,999)
    const num = Math.floor(10000000 + Math.random() * 90000000);
    return num.toString();
  }

  /**
   * Format a Date as "DD MMM YYYY" (e.g. "15 Jan 2025").
   */
  private formatDate(date: Date): string {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  /**
   * Escape HTML special characters to prevent XSS in rendered templates.
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Convert a non-negative number to its English words representation.
   *
   * Handles amounts up to 999,999,999 (sufficient for school fee amounts).
   * Decimal part is expressed as "and XX/100 Rupees".
   *
   * Examples:
   *   1500    → "One Thousand Five Hundred Rupees Only"
   *   1500.50 → "One Thousand Five Hundred and 50/100 Rupees Only"
   *
   * Requirements: 16.5
   */
  private numberToWords(amount: number): string {
    if (amount === 0) return 'Zero Rupees Only';

    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
      'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
      'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
    ];
    const tens = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
      'Sixty', 'Seventy', 'Eighty', 'Ninety',
    ];

    const convertHundreds = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) {
        const t = tens[Math.floor(n / 10)];
        const o = ones[n % 10];
        return o ? `${t} ${o}` : t;
      }
      const h = ones[Math.floor(n / 100)];
      const remainder = n % 100;
      return remainder === 0
        ? `${h} Hundred`
        : `${h} Hundred ${convertHundreds(remainder)}`;
    };

    const intPart = Math.floor(amount);
    const decPart = Math.round((amount - intPart) * 100);

    let words = '';

    if (intPart >= 1_000_000) {
      words += `${convertHundreds(Math.floor(intPart / 1_000_000))} Million `;
    }
    if (intPart >= 1_000) {
      words += `${convertHundreds(Math.floor((intPart % 1_000_000) / 1_000))} Thousand `;
    }
    words += convertHundreds(intPart % 1_000);

    words = words.trim();

    if (decPart > 0) {
      words += ` and ${decPart}/100`;
    }

    return `${words} Rupees Only`;
  }

  async updateChallan(id: number, dto: UpdateFeeChallanDto) {
    // 1. Load the challan and its installment
    const challan = await this.prisma.feeChallanV2.findUnique({
      where: { id },
      include: { 
        installment: { include: { heads: true } },
        challanHeads: true 
      } as any,
    });

    if (!challan) throw new NotFoundException(`Challan ${id} not found`);
    if (challan.status === 'PAID') throw new BadRequestException('Cannot edit a paid challan');
    if (challan.status === 'SETTLED') throw new BadRequestException('Cannot edit a settled challan');

    return await this.prisma.$transaction(async (tx) => {
      // 2. Update Installment Fields if provided
      if (challan.installmentId) {
        const updateData: any = {};
        if (dto.fineAmount !== undefined) updateData.extraFine = dto.fineAmount;
        if (dto.discount !== undefined) updateData.discount = dto.discount;
        
        if (Object.keys(updateData).length > 0) {
          await tx.feeInstallment.update({
            where: { id: challan.installmentId },
            data: updateData,
          });
        }
      }

      // 3. Update Fee Heads if provided (both predefined and custom)
      if (dto.feeHeadIds || dto.heads) {
        // Delete existing challan heads (snapshots)
        await (tx as any).feeChallanHead.deleteMany({ where: { challanId: id } });
        
        const newHeadsPayload: any[] = [];
        
        // Process predefined fee heads
        if (dto.feeHeadIds && dto.feeHeadIds.length > 0) {
          const heads = await tx.feeHead.findMany({
            where: { id: { in: dto.feeHeadIds } },
          });
          heads.forEach(h => {
            newHeadsPayload.push({
              challanId: id,
              feeHeadId: h.id,
              amount: h.amount,
              headName: h.name
            });
          });
        }
        
        // Process custom fee heads (ad-hoc)
        if (dto.heads && dto.heads.length > 0) {
          dto.heads.forEach(h => {
            newHeadsPayload.push({
              challanId: id,
              feeHeadId: null,
              amount: h.amount,
              headName: h.headName
            });
          });
        }

        // Create new challan head snapshots
        if (newHeadsPayload.length > 0) {
          await (tx as any).feeChallanHead.createMany({
            data: newHeadsPayload,
          });
        }

        // CRITICAL: If this is an installment-linked challan, sync the Source of Truth (FeeInstallmentHead)
        // This ensures that propagateChangesDownstream picks up the new headsSum for subsequent arrears calculation.
        if (challan.installmentId) {
          await tx.installmentHead.deleteMany({ where: { installmentId: challan.installmentId } });
          if (newHeadsPayload.length > 0) {
            await tx.installmentHead.createMany({
              data: newHeadsPayload.map(h => ({
                installmentId: challan.installmentId as number,
                feeHeadId: h.feeHeadId,
                headName: h.headName,
                amount: h.amount,
                discountAmount: 0
              }))
            });
          }
        }
      }

      // 4. Update Challan Fields
      const challanUpdate: any = {};
      if (dto.dueDate) challanUpdate.dueDate = new Date(dto.dueDate);
      if (dto.remarks !== undefined) challanUpdate.remarks = dto.remarks;
      
      // Fetch updated installment and heads for recalculation
      const updatedInst = await tx.feeInstallment.findUnique({
        where: { id: challan.installmentId || 0 },
      });
      
      const updatedChallanHeads = await (tx as any).feeChallanHead.findMany({
        where: { challanId: id }
      });

      // Calculate snapshot fields
      const snapshotBaseAmount = Number(updatedInst?.basePayable || challan.snapshotBaseAmount);
      const headsSum = updatedChallanHeads.reduce((sum, h) => sum + Number(h.amount), 0);
      
      // Fetch the global late fee rate (ignoring the local installment rate as requested)
      const settings = await tx.instituteSettings.findFirst({ select: { lateFeeRatePerDay: true } });
      const effectiveRate = settings?.lateFeeRatePerDay ? Number(settings.lateFeeRatePerDay) : 0;

      // Use the challan's specific dueDate (either newly provided or existing snapshot)
      // as the accrual origin. This allows late fees to be recalculated if the deadline is extended.
      const accrualOrigin = (dto.dueDate ? new Date(dto.dueDate) : (challan.dueDate || updatedInst?.dueDate || new Date())) as Date;
      
      const snapshotLateFee = this.lateFeeService.calculate(
        accrualOrigin,
        effectiveRate
      );

      // total = base + arrears + lateFee + extraFine + headsSum + discount (discount is negative)
      const extraFine = Number(updatedInst?.extraFine || 0);
      const discount = Number(updatedInst?.discount || 0);
      const arrears = Number(challan.snapshotArrearsAmount);
      
      // total = base + arrears + lateFee + extraFine + headsSum - discount
      // total = base + arrears + lateFee + extraFine + headsSum - abs(discount)
      const snapshotTotalDue = snapshotBaseAmount + arrears + Number(snapshotLateFee) + extraFine + headsSum - Math.abs(discount);

      const finalChallan = await tx.feeChallanV2.update({
        where: { id },
        data: {
          ...challanUpdate,
          snapshotBaseAmount,
          snapshotLateFee,
          snapshotTotalDue,
        },
      });

      // Update the installment's late fee and totals for consistency (Requirement: "consistency accross the system")
      if (challan.installmentId) {
        await tx.feeInstallment.update({
          where: { id: challan.installmentId },
          data: {
            lateFeeFine: snapshotLateFee,
            totalAmount: snapshotTotalDue,
            pendingAmount: snapshotTotalDue - Number(updatedInst?.paidAmount || 0),
            lateFeeRatePerDay: effectiveRate,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          },
        });
      }

      // 5. Propagation
      await this.propagateChangesDownstream(tx, challan.installmentId);

      return finalChallan;
    });
  }

  private async propagateChangesDownstream(tx: any, installmentId: number | null) {
    if (!installmentId) return;
    
    let currentInstId: number | null = installmentId;
    while (currentInstId) {
       // 1. Recalculate totalAmount and pendingAmount for the CURRENT installment
       const inst = await tx.feeInstallment.findUnique({
         where: { id: currentInstId },
         include: { heads: true }
       });
       
       if (!inst) break;

       const headsSum = (inst.heads || []).reduce((s, h) => s + Number(h.amount), 0);
       // Note: discount is subtracted
       const totalAmount = Number(inst.basePayable) + Number(inst.arrears) + Number(inst.lateFeeFine) + Number(inst.extraFine) + headsSum - Math.abs(Number(inst.discount));
       const pendingAmount = totalAmount - Number(inst.paidAmount);
        
       console.log(`[Ripple] Recalculated Inst #${inst.installmentNumber} (ID: ${inst.id}): Arrears=${inst.arrears}, Total=${totalAmount}, Pending=${pendingAmount}`);

       await tx.feeInstallment.update({
         where: { id: currentInstId },
         data: { totalAmount, pendingAmount }
       });
       
       // 2. Find the NEXT installment globally (across sessions, ordered by sessionId ASC then installmentNumber ASC)
       // We cannot filter by sessionId here — a promoted student's next installment may be in a different session.
       const allStudentInsts = await tx.feeInstallment.findMany({
         where: { studentId: inst.studentId },
         orderBy: [{ sessionId: 'asc' }, { installmentNumber: 'asc' }],
         select: { id: true, sessionId: true, installmentNumber: true, status: true },
       });
       const currentIdx = allStudentInsts.findIndex(i => i.id === currentInstId);
       // Skip frozen installments when looking for the next one to propagate to
       const frozenStatuses = ['SUPERSEDED', 'SETTLED', 'VOID', 'PAID'];
       let nextInst: { id: number } | null = null;
       for (let ni = currentIdx + 1; ni < allStudentInsts.length; ni++) {
         if (!frozenStatuses.includes(allStudentInsts[ni].status as string)) {
           nextInst = allStudentInsts[ni];
           break;
         }
       }
       
       if (nextInst) {
         // Fetch full next installment data for the challan snapshot recalculation
         const nextInstFull = await tx.feeInstallment.findUnique({
           where: { id: nextInst.id },
         });

         // Update next installment's arrears with current installment's pendingAmount
         await tx.feeInstallment.update({
           where: { id: nextInst.id },
           data: { arrears: pendingAmount }
         });
         
         // If the next installment has a challan generated, we must update it too
         const nextChallan = await tx.feeChallanV2.findFirst({
           where: { installmentId: nextInst.id, status: { not: 'VOID' } }
         });
         
         if (nextChallan && nextInstFull) {
           const snapshotArrearsAmount = pendingAmount;
           const nextChallanHeads = await (tx as any).feeChallanHead.findMany({ where: { challanId: nextChallan.id } });
           const headsSum = nextChallanHeads.reduce((s, h) => s + Number(h.amount), 0);
           const snapshotTotalDue = Number(nextChallan.snapshotBaseAmount) + snapshotArrearsAmount + Number(nextChallan.snapshotLateFee) + Number(nextInstFull.extraFine) + headsSum - Math.abs(Number(nextInstFull.discount));
           
           await tx.feeChallanV2.update({
             where: { id: nextChallan.id },
             data: { snapshotArrearsAmount, snapshotTotalDue }
           });
         }
         
         currentInstId = nextInst.id;
       } else {
        currentInstId = null;
      }
    }
  }

  /**
   * Syncs the late fee fine for a given installment.
   * Requirement: "sync-on-read" and "consistency accross the system".
   * This uses the global InstituteSettings lateFeeRatePerDay (ignoring the local field).
   */
  async syncLateFee(installmentId: number, forcedRate?: number) {
    return await this.prisma.$transaction(async (tx) => {
      const inst = await tx.feeInstallment.findUnique({
        where: { id: installmentId },
        include: { heads: true },
      });

      if (
        !inst ||
        ['PAID', 'SETTLED', 'SUPERSEDED', 'VOID'].includes(inst.status as string)
      ) {
        return inst;
      }

      let ratePerDay = forcedRate;

      // If no forcedRate is provided (e.g. not a bulk operation), fetch global settings
      if (ratePerDay === undefined) {
        const settings = await tx.instituteSettings.findFirst({
          select: { lateFeeRatePerDay: true },
        });
        ratePerDay = settings?.lateFeeRatePerDay
          ? Number(settings.lateFeeRatePerDay)
          : 0;
      }

      const liveLateFee = this.lateFeeService.calculate(
        inst.dueDate,
        ratePerDay,
      );
      const isPastDue = new Date() > inst.dueDate;
      const currentLateFee = Number(inst.lateFeeFine);

      let needsUpdate = false;
      const updateData: any = {};

      if (liveLateFee !== currentLateFee) {
        updateData.lateFeeFine = liveLateFee;
        needsUpdate = true;
      }

      if (
        isPastDue &&
        inst.status !== 'OVERDUE' &&
        Number(inst.pendingAmount) > 0
      ) {
        updateData.status = 'OVERDUE';
        needsUpdate = true;
      }

      if (needsUpdate) {
        if (updateData.lateFeeFine !== undefined) {
          const headsSum = (inst.heads || []).reduce(
            (s, h) => s + Number(h.amount),
            0,
          );
          const totalAmount =
            Number(inst.basePayable) +
            Number(inst.arrears) +
            liveLateFee +
            Number(inst.extraFine) +
            headsSum -
            Math.abs(Number(inst.discount));
          updateData.totalAmount = totalAmount;
          updateData.pendingAmount = totalAmount - Number(inst.paidAmount);
          updateData.lateFeeRatePerDay = ratePerDay;
        }

        const updated = await tx.feeInstallment.update({
          where: { id: installmentId },
          data: updateData,
        });

        // Also sync the active challan snapshot if one exists
        const activeChallan = await tx.feeChallanV2.findFirst({
          where: {
            installmentId,
            status: { notIn: ['PAID', 'VOID', 'SETTLED'] },
          },
        });

        if (activeChallan && updateData.lateFeeFine !== undefined) {
          const cHeads = await (tx as any).feeChallanHead.findMany({
            where: { challanId: activeChallan.id },
          });
          const cHeadsSum = cHeads.reduce((s, h) => s + Number(h.amount), 0);
          const newSnapshotTotal =
            Number(activeChallan.snapshotBaseAmount) +
            Number(activeChallan.snapshotArrearsAmount) +
            liveLateFee +
            Number(inst.extraFine) +
            cHeadsSum -
            Math.abs(Number(inst.discount));

          await tx.feeChallanV2.update({
            where: { id: activeChallan.id },
            data: {
              snapshotLateFee: liveLateFee,
              snapshotExtraFine: Number(inst.extraFine),
              snapshotDiscount: Number(inst.discount),
              snapshotTotalDue: newSnapshotTotal,
              status: isPastDue ? 'OVERDUE' : activeChallan.status,
            },
          });
        }

        return updated;
      }

      return inst;
    });
  }
}
