import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Incremental Late Fee Cron
 *
 * Runs daily at midnight. For every overdue, unpaid installment:
 *   newDays = days_between(today, lateFeeLastCalculatedAt ?? dueDate)
 *   lateFeeAccrued += newDays * globalFinePerDay
 *   lateFeeLastCalculatedAt = today
 *
 * The accrued value is then synced to the linked active (non-VOID, non-PAID) challan's
 * lateFeeFine field so the UI always reads a consistent stored value.
 */
@Injectable()
export class LateFeeCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LateFeeCronService.name);
  private task: cron.ScheduledTask | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Run daily at 00:05 (5 minutes past midnight)
    this.task = cron.schedule('5 0 * * *', () => this.runLateFeeAccrual(), {
      timezone: 'Asia/Karachi',
    });
    this.logger.log('Late fee cron scheduled (daily 00:05 PKT)');
  }

  onModuleDestroy() {
    this.task?.stop();
  }

  /** Can also be called manually via an admin endpoint for backfill */
  async runLateFeeAccrual(): Promise<{ updated: number; skipped: number }> {
    this.logger.log('Running incremental late fee accrual...');

    const settings = await this.prisma.instituteSettings.findFirst();
    const finePerDay = settings?.lateFeeFine ?? 0;

    if (finePerDay <= 0) {
      this.logger.log('Late fee per day is 0 — skipping accrual.');
      return { updated: 0, skipped: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all overdue, unpaid installments (with or without a challan)
    const installments = await (this.prisma.studentFeeInstallment.findMany as any)({
      where: {
        status: { notIn: ['PAID'] },
        dueDate: { lt: today },
      },
      select: {
        id: true,
        amount: true,
        totalAmount: true,
        dueDate: true,
        lateFeeAccrued: true,
        lateFeeLastCalculatedAt: true,
        // Active challan for this installment (if any) — used to sync lateFeeFine
        challans: {
          where: { status: { notIn: ['PAID', 'VOID'] } },
          select: { id: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    let updated = 0;
    let skipped = 0;

    for (const inst of installments) {
      // Determine the baseline date for calculation
      const baseline: Date = inst.lateFeeLastCalculatedAt
        ? new Date(inst.lateFeeLastCalculatedAt)
        : new Date(inst.dueDate);
      baseline.setHours(0, 0, 0, 0);

      const expectedTotal = (inst.amount ?? 0) + (inst.lateFeeAccrued ?? 0);

      // Skip if already calculated today AND totalAmount is in sync
      if (baseline.getTime() >= today.getTime()) {
        // Still sync totalAmount if it's stale (e.g. field was just added via migration)
        if (Math.abs((inst as any).totalAmount - expectedTotal) > 0.01) {
          await (this.prisma.studentFeeInstallment.update as any)({
            where: { id: inst.id },
            data: { totalAmount: expectedTotal },
          });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      const diffMs = today.getTime() - baseline.getTime();
      const newDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (newDays <= 0) {
        skipped++;
        continue;
      }

      const additionalFee = newDays * finePerDay;
      const newAccrued = (inst.lateFeeAccrued ?? 0) + additionalFee;
      const newTotalAmount = (inst.amount ?? 0) + newAccrued;
      // Update installment — totalAmount = base amount + all accrued late fee
      await (this.prisma.studentFeeInstallment.update as any)({
        where: { id: inst.id },
        data: {
          lateFeeAccrued: newAccrued,
          lateFeeLastCalculatedAt: today,
          totalAmount: newTotalAmount,
        },
      });

      // Sync to the active challan if one exists.
      // Update both lateFeeFine and totalAmount on the challan.
      const activeChallan = inst.challans?.[0];
      if (activeChallan) {
        // Fetch current challan to get fineAmount (additional heads)
        const challanRecord = await this.prisma.feeChallan.findUnique({
          where: { id: activeChallan.id },
          select: { amount: true, fineAmount: true },
        });
        const challanTotal = (challanRecord?.amount || 0) + (challanRecord?.fineAmount || 0) + newAccrued;
        await this.prisma.feeChallan.update({
          where: { id: activeChallan.id },
          data: {
            lateFeeFine: newAccrued,
            totalAmount: challanTotal,
          },
        });
      }

      updated++;
    }

    this.logger.log(`Late fee accrual done: ${updated} updated, ${skipped} skipped.`);
    return { updated, skipped };
  }
}
