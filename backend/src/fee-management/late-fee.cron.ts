import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChallanService } from './challan.service';
import { ExtraChallanService } from './extra-challan.service';

/**
 * LateFeeCronService
 *
 * Runs every 12 hours to persist up-to-date lateFeeFine values into the
 * fee_installment table for all installments that are NOT locked (i.e. not
 * fully paid / settled / superseded / void).
 *
 * "Locked" definition: isLocked = true  OR  status IN ('PAID','SETTLED','SUPERSEDED','VOID')
 *
 * For each unlocked installment it delegates to ChallanService.syncLateFee()
 * which:
 *   1. Recalculates lateFeeFine = floor(daysPastDue) × lateFeeRatePerDay
 *   2. Persists lateFeeFine + totalAmount + pendingAmount to fee_installment
 *   3. Flips the installment status to OVERDUE when past due and still pending
 *   4. Updates snapshotLateFee + snapshotTotalDue on the active challan (if any)
 */
@Injectable()
export class LateFeeCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LateFeeCronService.name);
  private task: cron.ScheduledTask | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly challanService: ChallanService,
    private readonly extraChallanService: ExtraChallanService,
  ) {}

  onModuleInit() {
    // Run at 00:00 and 12:00 every day
    this.task = cron.schedule('0 0,12 * * *', () => {
      this.runLateFeeAccrual().catch((err) => {
        this.logger.error('Late fee accrual cron failed', err?.stack ?? err);
      });
    });

    this.logger.log(
      'Late fee accrual cron scheduled: every 12 hours (00:00 & 12:00).',
    );

    // Run immediately on startup so the DB is consistent from the first request
    this.runLateFeeAccrual().catch((err) => {
      this.logger.error('Late fee accrual (startup) failed', err?.stack ?? err);
    });
  }

  onModuleDestroy() {
    this.task?.stop();
  }

  /**
   * Find all unlocked installments and sync their late fee to the DB.
   *
   * An installment is considered "locked" when it is fully paid / settled /
   * superseded / voided, or has isLocked = true.  We skip those because their
   * financials are frozen and should not change.
   *
   * @returns  Summary counts { updated, skipped }.
   */
  async runLateFeeAccrual(): Promise<{ updated: number; skipped: number }> {
    this.logger.log('Starting late fee accrual run…');

    // ── 1. Standard Installments ───────────────────────────────────────────
    const unlockedInst = await this.prisma.feeInstallment.findMany({
      where: {
        isLocked: false,
        status: { notIn: ['PAID', 'SETTLED', 'SUPERSEDED', 'VOID'] },
        dueDate: { lte: new Date() },
      },
      select: { id: true },
    });

    const settings = await this.prisma.instituteSettings.findFirst({
      select: { lateFeeRatePerDay: true, extraChallanLateFee: true },
    });
    const forcedRateInst = settings?.lateFeeRatePerDay ? Number(settings.lateFeeRatePerDay) : 0;
    const forcedRateExtra = settings?.extraChallanLateFee ? Number(settings.extraChallanLateFee) : 0;

    let updated = 0;
    let skipped = 0;

    for (const { id } of unlockedInst) {
      try {
        const result = await this.challanService.syncLateFee(id, forcedRateInst);
        if (result) updated++;
        else skipped++;
      } catch (err) {
        this.logger.warn(`syncLateFee failed for installment ${id}: ${err.message}`);
        skipped++;
      }
    }

    // ── 2. Extra Challans ──────────────────────────────────────────────────
    const pendingExtra = await this.prisma.extraChallan.findMany({
      where: {
        status: { notIn: ['PAID', 'VOID', 'SETTLED'] },
        dueDate: { lte: new Date() },
      },
      select: { id: true },
    });

    for (const { id } of pendingExtra) {
      try {
        const result = await this.extraChallanService.syncLateFee(id, forcedRateExtra);
        if (result) updated++;
        else skipped++;
      } catch (err) {
        this.logger.warn(`syncLateFee failed for extra challan ${id}: ${err.message}`);
        skipped++;
      }
    }

    this.logger.log(
      `Late fee accrual complete — ${updated} updated, ${skipped} skipped. (Rates: ${forcedRateInst}/${forcedRateExtra} PKR/day)`,
    );
    return { updated, skipped };
  }
}
