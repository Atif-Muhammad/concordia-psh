import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * PaymentService — manages payment recording and history retrieval.
 *
 * Responsibilities:
 * - Recording payments against a feeChallanV2 (challan-centric)
 * - Updating FeeInstallment financial state (paidAmount, pendingAmount, settled, status, isLocked)
 * - Settlement propagation: distributes leading challan payment to SUPERSEDED ancestors
 *   incrementally, filling settledAmount and settledAt.
 * - Creating ChallanPayment audit records for every transaction
 * - Returning full payment history for a student
 *
 * CRITICAL RULES:
 * - settled=null on the directly-paid installment
 * - settled=true on installments whose debt was partially or fully settled via a chain
 * - settledAmount on ancestors tracks the accumulated amount cleared by the leader's payments
 * - Money lives on the PAID/PARTIAL leading challan (amountReceived)
 * - Pre-supersede money stays on the SETTLED/SUPERSEDED ancestor (amountReceived)
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 11.1, 13.4
 */
@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a payment against a feeChallanV2.
   *
   * Flow B1/B2 (Incremental Settlement):
   * 1. Update the leading challan's amountReceived.
   * 2. Update the leading installment's paidAmount/pendingAmount.
   * 3. Distribute the payment amount to ancestors ordered by installmentNo ASC.
   *    For each ancestor sc:
   *    - Calculate remaining to settle: sc.snapshotTotalDue - sc.amountReceived - sc.settledAmount
   *    - Apply min(remainingToSettle, needed)
   *    - Update sc.settledAmount, sc.settledAt
   *    - If fully settled (amountReceived + settledAmount == total), set sc.status = SETTLED
   *    - Update sc.installment: settled=true, settledByInstallmentId, status=SETTLED, isLocked=true
   *
   * @param challanId    The feeChallanV2 id to record the payment against.
   * @param amount       The payment amount received.
   * @param paymentMode  Payment mode string (e.g. "Cash", "Bank", "Online").
   * @param paidDate     The date the payment was received.
   * @param remarks      Optional free-text remarks.
   * @returns            The updated feeChallanV2 with the new ChallanPayment.
   */
  async recordPayment(
    challanId: number,
    amount: number,
    paymentMode: string,
    paidDate: Date,
    remarks?: string,
  ) {
    // ── Step 1: Load feeChallanV2 + linked FeeInstallment ────────────
    const challan = await this.prisma.feeChallanV2.findUnique({
      where: { id: challanId },
      include: {
        installment: {
          select: {
            id: true,
            studentId: true,
            totalAmount: true,
            paidAmount: true,
            pendingAmount: true,
            installmentNumber: true,
          },
        },
      },
    });

    if (!challan) {
      throw new NotFoundException(
        `feeChallanV2 with id ${challanId} not found`,
      );
    }

    // Cannot pay a challan that's already PAID, VOID, SUPERSEDED, or SETTLED
    if (['PAID', 'VOID', 'SUPERSEDED', 'SETTLED'].includes(challan.status)) {
      throw new BadRequestException(
        `Cannot record payment on challan ${challan.challanNumber}: status is ${challan.status}.`,
      );
    }

    // ── All DB writes in a single transaction ────────────────────────────────
    const result = await this.prisma.$transaction(async (tx) => {
      // ── Step 1: Update the leading challan ─────────────────────────────────
      const currentAmountReceived = Number(challan.amountReceived);
      const newAmountReceived = currentAmountReceived + amount;
      const snapshotTotalDue = Number(challan.snapshotTotalDue);

      const isFullyPaid = newAmountReceived >= snapshotTotalDue;
      const newChallanStatus: 'PAID' | 'PARTIAL' = isFullyPaid ? 'PAID' : 'PARTIAL';

      const updatedChallan = await tx.feeChallanV2.update({
        where: { id: challanId },
        data: {
          amountReceived: newAmountReceived,
          status: newChallanStatus,
          ...(isFullyPaid ? { paidAt: paidDate } : {}),
          paymentInfo: {
            paidDate: paidDate.toISOString(),
            remarks: remarks ?? null,
          },
        },
      });

      // ── Step 2: Update the linked installment (leading one) ────────────────
      if (challan.installment) {
        const installment = challan.installment;
        const currentPaid = Number(installment.paidAmount);
        const totalAmount = Number(installment.totalAmount);
        
        // Calculate how much of this payment applies to the CURRENT installment
        const neededToPay = Math.max(0, totalAmount - currentPaid);
        const applyToCurrent = Math.min(amount, neededToPay);
        const excess = amount - applyToCurrent;

        const newPaidAmount = currentPaid + applyToCurrent;
        const newPendingAmount = Math.max(0, totalAmount - newPaidAmount);

        await tx.feeInstallment.update({
          where: { id: installment.id },
          data: {
            status: isFullyPaid ? 'PAID' : 'PARTIAL',
            paidAmount: newPaidAmount,
            pendingAmount: newPendingAmount,
            settled: null, // Lead installment is directly paid, not settled via chain
            isLocked: isFullyPaid,
            lastPaymentDate: paidDate,
            lastPaymentAmount: applyToCurrent,
          },
        });

        // ── Advance Payment Handling ──────────────────────────────────────────
        // If there is an excess, apply it to the NEXT installment (Requirement: Advance Payment)
        if (excess > 0) {
          const nextInstallment = await tx.feeInstallment.findFirst({
            where: {
              studentId: installment.studentId,
              installmentNumber: installment.installmentNumber + 1,
              // We assume same session for simplicity unless it's the last installment
            },
          });

          if (nextInstallment) {
            const nextTotal = Number(nextInstallment.totalAmount);
            const nextPaid = Number(nextInstallment.paidAmount);
            
            const updatedNextPaid = nextPaid + excess;
            const updatedNextPending = Math.max(0, nextTotal - updatedNextPaid);

            await tx.feeInstallment.update({
              where: { id: nextInstallment.id },
              data: {
                paidAmount: updatedNextPaid,
                advancePaid: { increment: excess },
                pendingAmount: updatedNextPending,
                lastPaymentDate: paidDate,
                lastPaymentAmount: excess,
                // Also update status and lock if fully paid in advance
                ...(updatedNextPaid >= nextTotal ? { status: 'PAID', isLocked: true } : { status: 'PARTIAL' })
              },
            });

            // If a challan was already generated for the next installment, update it too
            const nextChallan = await tx.feeChallanV2.findFirst({
              where: {
                installmentId: nextInstallment.id,
                status: { notIn: ['VOID', 'SUPERSEDED'] }
              }
            });

            if (nextChallan) {
              const newNextReceived = Number(nextChallan.amountReceived) + excess;
              const nextSnapshotTotal = Number(nextChallan.snapshotTotalDue);
              const isNextFullyPaid = newNextReceived >= nextSnapshotTotal;

              await tx.feeChallanV2.update({
                where: { id: nextChallan.id },
                data: {
                  amountReceived: newNextReceived,
                  advanceAmount: { increment: excess },
                  advanceFromChallanNo: challan.challanNumber,
                  status: isNextFullyPaid ? 'PAID' : 'PARTIAL',
                  ...(isNextFullyPaid ? { paidAt: paidDate } : {}),
                }
              });
            }
          } else {
            // Requirement: dont allow the extra payment if there is not leading installment
            throw new BadRequestException(
              `Cannot accept advance payment: installment #${installment.installmentNumber} is the last scheduled installment for this student.`
            );
          }
        }
      }

      // ── Step 3: Settlement Propagation ─────────────────────────────────────
      // When the leading challan is FULLY PAID, ALL ancestor challans that point
      // to it via settledByChallanNumber must be marked SETTLED — regardless of
      // whether the individual payment amount covers each ancestor's snapshotTotalDue.
      // This is correct because the leading challan's snapshotTotalDue already
      // includes all ancestor arrears, so full payment of the leader resolves the
      // entire chain.
      //
      // When the leading challan is only PARTIALLY paid, we do incremental
      // settlement: distribute the payment amount across ancestors in order.
      // Bug B2 fix: only query SUPERSEDED challans — already-SETTLED challans from a
      // prior partial-then-full payment sequence must not be re-processed (Req 4.3).
      const ancestors = await tx.feeChallanV2.findMany({
        where: {
          settledByChallanNumber: challan.challanNumber,
          status: 'SUPERSEDED',
        },
        orderBy: { installmentNo: 'asc' },
        include: { installment: true },
      });

      if (isFullyPaid) {
        // Leading challan is fully paid — settle ALL ancestors unconditionally
        for (const sc of ancestors) {
          await tx.feeChallanV2.update({
            where: { id: sc.id },
            data: {
              status: 'SETTLED',
              settledAmount: sc.snapshotTotalDue,
              settledAt: paidDate,
              paidAt: paidDate,
              paymentInfo: {
                paidDate: paidDate.toISOString(),
                remarks: `Settled by challan ${challan.challanNumber}`,
              },
            },
          });

          if (sc.installmentId && sc.installment) {
            await tx.feeInstallment.update({
              where: { id: sc.installmentId },
              data: {
                settled: true,
                settledByInstallmentId: challan.installmentId,
                status: 'SETTLED',
                isLocked: true,
                paidAmount: sc.snapshotTotalDue,
                pendingAmount: 0,
                settledAmount: sc.snapshotTotalDue,
                lastPaymentDate: paidDate,
                lastPaymentAmount: sc.snapshotTotalDue,
              },
            });
          }
        }
      } else {
        // Partial payment — distribute incrementally across ancestors
        let remainingToSettle = amount;

        for (const sc of ancestors) {
          if (remainingToSettle <= 0) break;

          const scTotalDue = Number(sc.snapshotTotalDue);
          const scAmountReceived = Number(sc.amountReceived);
          const scSettledAmount = Number(sc.settledAmount || 0);

          const needed = Math.max(0, scTotalDue - scAmountReceived - scSettledAmount);
          if (needed <= 0) continue;

          const apply = Math.min(remainingToSettle, needed);
          const newSettledAmount = scSettledAmount + apply;
          const isNowFullySettled = (scAmountReceived + newSettledAmount) >= scTotalDue;

          const scUpdateData: any = {
            settledAmount: newSettledAmount,
            settledAt: paidDate,
            status: isNowFullySettled ? 'SETTLED' : sc.status,
            paidAt: isNowFullySettled ? paidDate : sc.paidAt,
          };

          if (isNowFullySettled) {
            scUpdateData.paymentInfo = {
              paidDate: paidDate.toISOString(),
              remarks: `Settled by challan ${challan.challanNumber}`,
            };
          }

          await tx.feeChallanV2.update({
            where: { id: sc.id },
            data: scUpdateData,
          });

          if (sc.installmentId && sc.installment) {
            const scInst = sc.installment;
            const updatedPaid = Number(scInst.paidAmount) + apply;
            const updatedPending = Math.max(0, Number(scInst.totalAmount) - updatedPaid);

            await tx.feeInstallment.update({
              where: { id: sc.installmentId },
              data: {
                settled: true,
                settledByInstallmentId: challan.installmentId,
                status: isNowFullySettled ? 'SETTLED' : 'SUPERSEDED',
                isLocked: isNowFullySettled,
                paidAmount: updatedPaid,
                settledAmount: { increment: apply },
                pendingAmount: updatedPending,
                lastPaymentDate: paidDate,
                lastPaymentAmount: apply,
              },
            });
          }

          remainingToSettle -= apply;
        }
      }

      // ── Step 4: Create ChallanPayment audit record ─────────────────────────
      const payment = await tx.challanPayment.create({
        data: {
          challanId,
          amount,
          paymentDate: paidDate,
          paymentMode,
          remarks: remarks ?? null,
        },
      });

      return { challan: updatedChallan, payment };
    });

    return result;
  }

  /**
   * Validate that no double-counting exists for a student's fee records.
   *
   * Financial Validation Rule:
   * Revenue = SUM(amountReceived) FROM all challans WHERE status IN [PAID, PARTIAL, SETTLED]
   *
   * Note: amountReceived on SETTLED/SUPERSEDED challans represents money paid 
   * BEFORE it was absorbed. Leading challan's amountReceived represents money paid 
   * AFTER absorption. Summing all amountReceived fields gives the total revenue.
   *
   * @param studentId  The student to validate.
   * @returns          true if totals match (within 0.01 tolerance), false if mismatch.
   */
  async validateNoDoubleCount(studentId: number): Promise<boolean> {
    // 1. Revenue from installment-based challans
    const challanRevenueAggr = await this.prisma.feeChallanV2.aggregate({
      where: {
        status: { in: ['PAID', 'PARTIAL', 'SETTLED'] },
        installment: { studentId },
      },
      _sum: { amountReceived: true },
    });

    // 2. Revenue from new ExtraChallan model
    const extraRevenueAggr = await this.prisma.extraChallan.aggregate({
      where: {
        studentId,
        status: { in: ['PAID', 'PARTIAL'] },
      },
      _sum: { paidAmount: true },
    });

    const totalRevenue = Number(challanRevenueAggr._sum.amountReceived ?? 0) + 
                        Number(extraRevenueAggr._sum.paidAmount ?? 0);

    // 3. Paid side: Installments — only directly-paid installments (settled IS NULL).
    // Installments where settled=true have their contribution already counted inside
    // the leading installment's paidAmount (Req 7.4, 7.5).
    const installmentPaidAggr = await this.prisma.feeInstallment.aggregate({
      where: {
        studentId,
        settled: null,
      },
      _sum: { paidAmount: true },
    });

    // 4. Paid side: Extra Challans
    const extraPaidAggr = await this.prisma.extraChallan.aggregate({
      where: {
        studentId,
        status: { notIn: ['VOID', 'SUPERSEDED', 'SETTLED'] },
      },
      _sum: { paidAmount: true },
    });

    const totalPaid = Number(installmentPaidAggr._sum.paidAmount ?? 0) + 
                    Number(extraPaidAggr._sum.paidAmount ?? 0);

    return Math.abs(totalRevenue - totalPaid) <= 0.01;
  }

  /**
   * Return the full payment history for a student.
   */
  async getStudentPaymentHistory(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${studentId} not found`);
    }

    const payments = await this.prisma.challanPayment.findMany({
      where: {
        challan: {
          installment: { studentId },
        },
      },
      include: {
        challan: {
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
            installmentId: true,
            installmentNo: true,
            settledAmount: true,
            settledAt: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return payments;
  }
}
