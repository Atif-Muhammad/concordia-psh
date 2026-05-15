import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as cron from 'node-cron';
import { Prisma } from '@prisma/client';
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
 * "Locked" definition: isLocked = true OR status IN ('PAID','SETTLED','SUPERSEDED','VOID')
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

  private isMissingTableError(err: unknown): boolean {
    return (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2021'
    );
  }

  private isMissingColumnError(err: unknown): boolean {
    return (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2022'
    );
  }

  /**
   * Find all unlocked installments and sync their late fee to the DB.
   *
   * If fee module tables are missing in current DB, skip gracefully.
   */
  async runLateFeeAccrual(): Promise<{ updated: number; skipped: number }> {
    this.logger.log('Starting late fee accrual run...');

    let updated = 0;
    let skipped = 0;

    let forcedRateInst = 0;
    let forcedRateExtra = 0;
    try {
      const settings = await this.prisma.instituteSettings.findFirst({
        select: { lateFeeRatePerDay: true, extraChallanLateFee: true },
      });
      forcedRateInst = settings?.lateFeeRatePerDay
        ? Number(settings.lateFeeRatePerDay)
        : 0;
      forcedRateExtra = settings?.extraChallanLateFee
        ? Number(settings.extraChallanLateFee)
        : 0;
    } catch (err) {
      if (this.isMissingTableError(err) || this.isMissingColumnError(err)) {
        this.logger.warn(
          'Skipping institute settings late-fee columns lookup: missing table/column. Falling back to 0 rates.',
        );
      } else {
        throw err;
      }
    }

    // 1) Standard installments
    try {
      const unlockedInst = await this.prisma.feeInstallment.findMany({
        where: {
          isLocked: false,
          status: { notIn: ['PAID', 'SETTLED', 'SUPERSEDED', 'VOID'] },
          dueDate: { lte: new Date() },
        },
        select: { id: true },
      });

      for (const { id } of unlockedInst) {
        try {
          const result = await this.challanService.syncLateFee(id, forcedRateInst);
          if (result) updated++;
          else skipped++;
        } catch (err: any) {
          this.logger.warn(
            `syncLateFee failed for installment ${id}: ${err?.message ?? err}`,
          );
          skipped++;
        }
      }
    } catch (err) {
      if (this.isMissingTableError(err)) {
        this.logger.warn(
          'Skipping installment late fee accrual: fee_installment table is missing.',
        );
      } else {
        throw err;
      }
    }

    // 2) Extra challans
    try {
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
        } catch (err: any) {
          this.logger.warn(
            `syncLateFee failed for extra challan ${id}: ${err?.message ?? err}`,
          );
          skipped++;
        }
      }
    } catch (err) {
      if (this.isMissingTableError(err)) {
        this.logger.warn(
          'Skipping extra challan late fee accrual: extra_challan table is missing.',
        );
      } else {
        throw err;
      }
    }

    this.logger.log(
      `Late fee accrual complete - ${updated} updated, ${skipped} skipped. (Rates: ${forcedRateInst}/${forcedRateExtra} PKR/day)`,
    );

    return { updated, skipped };
  }
}
