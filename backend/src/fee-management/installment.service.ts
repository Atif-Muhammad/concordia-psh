import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LateFeeService } from './late-fee.service';
import { UpdateInstallmentDto } from './dtos/update-installment.dto';

/**
 * InstallmentService — manages FeeInstallment records.
 *
 * Responsibilities:
 * - Creating installment plans for students at admission
 * - Retrieving installments with live late fee injected
 * - Updating installment fields (with lock guard)
 * - Cascading arrears changes downstream
 *
 * Requirements: 1.1, 1.5, 2.1, 2.2, 2.3, 5.6, 7.1, 7.2, 7.3, 7.4, 7.5, 11.2, 11.3, 17.4, 18.2
 */
@Injectable()
export class InstallmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lateFeeService: LateFeeService,
  ) {}

  /**
   * Create N FeeInstallment records for a student.
   *
   * - Reads `lateFeeRatePerDay` from the first `InstituteSettings` record (Requirement 18.2).
   * - Derives `classId` from the student record.
   * - Sets `totalAmount = basePayable` and `pendingAmount = basePayable` initially
   *   (no arrears at creation time — arrears are computed at challan generation).
   * - Assigns `installmentNumber` 1..N and the corresponding `dueDate` from `dueDates[i]`.
   *
   * @param studentId   The student to create installments for.
   * @param N           Number of installments to create.
   * @param basePayable The fixed per-installment amount.
   * @param dueDates    Array of due dates, one per installment (length must equal N).
   * @param sessionId   The academic session these installments belong to (nullable).
   *
   * Requirements: 2.1, 2.2, 2.3, 18.2
   */
  async createInstallmentsForStudent(
    studentId: number,
    N: number,
    basePayable: number,
    dueDates: Date[],
    sessionId: number | null,
  ) {
    // Load student to get classId (Requirement 2.1)
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, classId: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${studentId} not found`);
    }

    // Read global lateFeeRatePerDay from InstituteSettings (Requirement 18.2)
    const settings = await this.prisma.instituteSettings.findFirst({
      select: { lateFeeRatePerDay: true },
    });

    const lateFeeRatePerDay = settings?.lateFeeRatePerDay
      ? Number(settings.lateFeeRatePerDay)
      : 0;

    // Create all N installments in a single transaction (Requirement 2.1)
    const installments = await this.prisma.$transaction(
      dueDates.slice(0, N).map((dueDate, index) =>
        this.prisma.feeInstallment.create({
          data: {
            studentId,
            classId: student.classId,
            sessionId: sessionId ?? null,
            installmentNumber: index + 1,
            basePayable,
            lateFeeRatePerDay,
            // totalAmount = basePayable at creation (no arrears yet)
            totalAmount: basePayable,
            // pendingAmount = basePayable at creation (nothing paid yet)
            pendingAmount: basePayable,
            dueDate,
          },
        }),
      ),
    );

    return installments;
  }

  /**
   * Return all FeeInstallment records for a student, ordered by
   * (sessionId ASC, installmentNumber ASC), with live late fee injected.
   *
   * Requirements: 1.1, 1.5, 5.6, 20.4
   */
  async getStudentInstallments(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${studentId} not found`);
    }

    const installments = await this.prisma.feeInstallment.findMany({
      where: { studentId },
      orderBy: [
        { sessionId: 'asc' },
        { installmentNumber: 'asc' },
      ],
      include: {
        heads: true,
        session: true,
        challans: {
          select: {
            id: true,
            challanNumber: true,
            status: true,
            generatedDate: true,
            snapshotBaseAmount: true,
            snapshotArrearsAmount: true,
            snapshotLateFee: true,
            snapshotTotalDue: true,
            amountReceived: true,
            paidAt: true,
            advanceAmount: true,
            advanceFromChallanNo: true,
            settledByChallanNumber: true,
            settledAmount: true,
          },
        },
      },
    });

    // Inject live late fee into each installment (Requirement 5.6, 20.4)
    return installments.map((installment) =>
      this.lateFeeService.injectLiveLateFee(installment),
    );
  }

  /**
   * Return a single FeeInstallment by id with live late fee injected.
   *
   * Requirements: 1.1, 5.6, 20.4
   */
  async getInstallment(id: number) {
    const installment = await this.prisma.feeInstallment.findUnique({
      where: { id },
      include: {
        heads: true,
        session: true,
        challans: {
          select: {
            id: true,
            challanNumber: true,
            status: true,
            generatedDate: true,
            snapshotBaseAmount: true,
            snapshotArrearsAmount: true,
            snapshotLateFee: true,
            snapshotTotalDue: true,
            amountReceived: true,
            paidAt: true,
            advanceAmount: true,
            advanceFromChallanNo: true,
            settledByChallanNumber: true,
            settledAmount: true,
          },
        },
      },
    });

    if (!installment) {
      throw new NotFoundException(`FeeInstallment with id ${id} not found`);
    }

    // Inject live late fee (Requirement 5.6, 20.4)
    return this.lateFeeService.injectLiveLateFee(installment);
  }

  /**
   * Update allowed fields on a FeeInstallment, then cascade arrears downstream.
   *
   * Allowed fields: `basePayable`, `discount`, `dueDate`, `lateFeeRatePerDay`, `extraFine`.
   *
   * - Rejects the update with HTTP 400 if the installment is locked (`isLocked = TRUE`).
   * - After persisting the update, recalculates `totalAmount` and `pendingAmount` on the
   *   same installment, then calls `cascadeArrears` to propagate the change to all
   *   subsequent unlocked installments.
   *
   * @param id  The FeeInstallment id to update.
   * @param dto Fields to update (all optional).
   * @returns   The updated installment with live late fee injected.
   *
   * Requirements: 7.1, 11.2, 11.3, 17.4
   */
  async updateInstallment(id: number, dto: UpdateInstallmentDto) {
    // Load the installment to check lock status (Requirement 11.2)
    const existing: any = await this.prisma.feeInstallment.findUnique({
      where: { id },
      select: {
        id: true,
        isLocked: true,
        studentId: true,
        installmentNumber: true,
        basePayable: true,
        arrears: true,
        lateFeeFine: true,
        lateFeeRatePerDay: true,
        extraFine: true,
        absentiesFine: true,
        discount: true,
        paidAmount: true,
      } as any,
    });

    if (!existing) {
      throw new NotFoundException(`FeeInstallment with id ${id} not found`);
    }

    // Requirement 11.2, 11.3: reject update on locked installment
    if (existing.isLocked) {
      const isPaid = Number(existing.paidAmount) > 0;
      const reason = isPaid ? "it has been paid" : "it has been fully settled by a future challan";
      throw new BadRequestException(
        `FeeInstallment ${id} (installment #${existing.installmentNumber}) is locked because ${reason} and cannot be modified.`,
      );
    }

    // Resolve updated field values, falling back to existing values for fields not in dto
    const newBasePayable =
      dto.basePayable !== undefined
        ? dto.basePayable
        : Number(existing.basePayable);

    const newDiscount =
      dto.discount !== undefined ? dto.discount : Number(existing.discount);

    const newExtraFine =
      dto.extraFine !== undefined ? dto.extraFine : Number(existing.extraFine);

    const newLateFeeRatePerDay =
      dto.lateFeeRatePerDay !== undefined
        ? dto.lateFeeRatePerDay
        : Number(existing.lateFeeRatePerDay); // keep existing rate if not provided

    // Recalculate totalAmount and pendingAmount after the update
    // totalAmount = basePayable + arrears + lateFeeFine + extraFine + absentiesFine - discount (Requirement 4.6, 17.3)
    const arrears = Number(existing.arrears);
    const lateFeeFine = Number(existing.lateFeeFine);
    const absentiesFine = Number((existing as any).absentiesFine || 0);
    const paidAmount = Number(existing.paidAmount);

    const newTotalAmount =
      newBasePayable + arrears + lateFeeFine + newExtraFine + absentiesFine - newDiscount;
    const newPendingAmount = newTotalAmount - paidAmount;

    // Build the update payload — only include fields present in dto
    const updateData: Record<string, unknown> = {
      totalAmount: newTotalAmount,
      pendingAmount: newPendingAmount,
    };

    if (dto.basePayable !== undefined) updateData.basePayable = dto.basePayable;
    if (dto.discount !== undefined) updateData.discount = dto.discount;
    if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
    if (dto.lateFeeRatePerDay !== undefined)
      updateData.lateFeeRatePerDay = dto.lateFeeRatePerDay;
    if (dto.extraFine !== undefined) updateData.extraFine = dto.extraFine;

    // Persist the update (Requirement 7.1)
    await this.prisma.feeInstallment.update({
      where: { id },
      data: updateData,
    });

    // Cascade arrears to all subsequent unlocked installments (Requirement 7.1, 7.2)
    await this.cascadeArrears(
      existing.studentId,
      existing.installmentNumber + 1,
    );

    // Return the updated installment with live late fee injected
    return this.getInstallment(id);
  }

  /**
   * Propagate a change in one installment's `pendingAmount` to all subsequent
   * unlocked installments in the student's global chain.
   *
   * For each installment K (starting from `fromInstallmentNumber`):
   *   - Sets `arrears = prevInstallment.pendingAmount`
   *   - Recalculates `totalAmount = basePayable + arrears + lateFeeFine + extraFine + absentiesFine - discount`
   *   - Recalculates `pendingAmount = totalAmount - paidAmount`
   *
   * Stops at the first locked installment and returns a warning identifying it.
   * All updates are performed in a single Prisma transaction.
   *
   * NOTE: This is a stub implementation. The full implementation will be provided
   * in Task 3.3. This stub correctly handles the cascade logic for the common case
   * but Task 3.3 will add the locked-installment warning return value and full
   * cross-session ordering.
   *
   * @param studentId              The student whose installment chain to cascade.
   * @param fromInstallmentNumber  The first installment number to update (inclusive).
   * @returns                      An object with `warning` if cascade was blocked by a
   *                               locked installment, otherwise `{ warning: null }`.
   *
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  async cascadeArrears(
    studentId: number,
    fromInstallmentNumber: number,
  ): Promise<{ warning: string | null }> {
    // Load all installments for the student ordered globally
    // (sessionId ASC, installmentNumber ASC) — Requirement 7.1
    const allInstallments: any[] = await this.prisma.feeInstallment.findMany({
      where: { studentId },
      orderBy: [{ sessionId: 'asc' }, { installmentNumber: 'asc' }],
      select: {
        id: true,
        installmentNumber: true,
        sessionId: true,
        isLocked: true,
        status: true,
        basePayable: true,
        arrears: true,
        lateFeeFine: true,
        extraFine: true,
        absentiesFine: true,
        discount: true,
        paidAmount: true,
        advancePaid: true,
        pendingAmount: true,
        month: true,
        heads: true,
      } as any,
    });

    // Pre-fetch all active challans for this student and group by installmentId.
    // This avoids N+1 queries inside the loop.
    const studentChallans = await this.prisma.feeChallanV2.findMany({
      where: {
        installment: { studentId },
        status: { notIn: ['VOID', 'SUPERSEDED', 'SETTLED'] },
      },
      select: { installmentId: true, amountReceived: true, advanceAmount: true },
    });
    const challansByInstId = new Map<number, { totalReceived: number; totalAdvance: number }>();
    for (const c of studentChallans) {
      const key = Number(c.installmentId);
      const existing = challansByInstId.get(key) || { totalReceived: 0, totalAdvance: 0 };
      existing.totalReceived += Number(c.amountReceived ?? 0);
      existing.totalAdvance += Number(c.advanceAmount ?? 0);
      challansByInstId.set(key, existing);
    }

    // Build a map for O(1) lookup of the previous installment by its position index
    // We need the globally-ordered previous installment, not just installmentNumber - 1
    const updates: Array<{
      id: number;
      arrears: number;
      totalAmount: number;
      pendingAmount: number;
      paidAmount: number;
      advancePaid: number;
    }> = [];

    let blockedInstallment: { installmentNumber: number; month: string | null } | null = null;

    for (let i = 0; i < allInstallments.length; i++) {
      const current = allInstallments[i];

      // Only process installments at or after fromInstallmentNumber
      if (current.installmentNumber < fromInstallmentNumber) {
        continue;
      }

      // Requirement 7.4: stop cascade at first locked installment
      if (current.isLocked) {
        blockedInstallment = {
          installmentNumber: current.installmentNumber,
          month: current.month,
        };
        break;
      }

      // Skip SUPERSEDED, SETTLED, and VOID installments — their financial state is
      // frozen and managed by the challan chain. Touching them here would corrupt
      // the superseding chain (e.g. overwriting arrears that were absorbed into a
      // leading challan). Also skip them as the "prev" source for the next iteration
      // by finding the last non-frozen installment before the current one.
      const frozenStatuses = ['SUPERSEDED', 'SETTLED', 'VOID'];
      if (frozenStatuses.includes((current as any).status)) {
        continue;
      }

      // Find the effective previous installment: walk backwards from i-1 and skip
      // any frozen installments. Their pendingAmount is already embedded in the
      // leading challan's snapshotArrearsAmount, so we must not double-count it.
      let prev: (typeof allInstallments)[number] | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (!frozenStatuses.includes((allInstallments[j] as any).status)) {
          prev = allInstallments[j];
          break;
        }
      }

      const newArrears = prev ? Number(prev.pendingAmount) : 0;

      const basePayable = Number(current.basePayable);
      const lateFeeFine = Number(current.lateFeeFine);
      const extraFine = Number(current.extraFine);
      const absentiesFine = Number((current as any).absentiesFine || 0);
      const discount = Number(current.discount);
      const headsSum = (current.heads || []).reduce((sum, h) => sum + Number(h.amount), 0);

      // Recalculate paidAmount from actual active challans for this installment.
      // This ensures paidAmount is always in sync with challan data after deletions.
      const challanData = challansByInstId.get(current.id) || { totalReceived: 0, totalAdvance: 0 };
      const newPaidAmount = challanData.totalReceived;
      const newAdvancePaid = challanData.totalAdvance;

      const newTotalAmount =
        basePayable + newArrears + lateFeeFine + extraFine + absentiesFine + headsSum - discount;
      const newPendingAmount = newTotalAmount - newPaidAmount;

      // Only queue an update if something actually changed
      // Note: we also check if totalAmount matches the new calculation precisely
      const currentTotalInDB = Number(current.basePayable) + Number(current.arrears) + lateFeeFine + extraFine + absentiesFine + headsSum - discount;

      if (
        newArrears !== Number(current.arrears) ||
        newTotalAmount !== currentTotalInDB ||
        newPendingAmount !== Number(current.pendingAmount) ||
        newPaidAmount !== Number(current.paidAmount) ||
        newAdvancePaid !== Number(current.advancePaid)
      ) {
        updates.push({
          id: current.id,
          arrears: newArrears,
          totalAmount: newTotalAmount,
          pendingAmount: newPendingAmount,
          paidAmount: newPaidAmount,
          advancePaid: newAdvancePaid,
        });

        // Update the in-memory record so subsequent iterations see the new pendingAmount.
        // Cast via unknown because we're intentionally storing plain numbers in place of
        // Decimal fields for the in-memory cascade calculation only (never written back
        // to the DB as-is — the actual DB update uses the typed `updates` array above).
        allInstallments[i] = {
          ...current,
          arrears: newArrears,
          pendingAmount: newPendingAmount,
          paidAmount: newPaidAmount,
          advancePaid: newAdvancePaid,
        } as unknown as typeof current;
      }
    }

    // Requirement 7.3: all updates in a single DB transaction
    if (updates.length > 0) {
      await this.prisma.$transaction(
        updates.map(({ id, arrears, totalAmount, pendingAmount, paidAmount, advancePaid }) =>
          this.prisma.feeInstallment.update({
            where: { id },
            data: { arrears, totalAmount, pendingAmount, paidAmount, advancePaid },
          }),
        ),
      );
    }

    // Requirement 7.5: return warning if cascade was blocked by a locked installment
    if (blockedInstallment) {
      const monthLabel = blockedInstallment.month
        ? ` (${blockedInstallment.month})`
        : '';
      return {
        warning: `Cascade stopped at installment #${blockedInstallment.installmentNumber}${monthLabel} because it is locked (paid). Subsequent installments were not updated.`,
      };
    }

    return { warning: null };
  }
}
