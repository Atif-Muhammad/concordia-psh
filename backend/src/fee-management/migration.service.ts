import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * MigrationService — stub after full cutover to new fee schema.
 *
 * The old tables (StudentFeeInstallment, FeeChallan, StudentArrear, ChallanSettlement)
 * have been dropped. This service is kept as a no-op stub so the module structure
 * is preserved and the migration endpoint still responds gracefully.
 */
@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * No-op migration — old tables have been dropped.
   * Returns a summary indicating the cutover is complete.
   */
  async migrate(): Promise<{
    installmentsMigrated: number;
    installmentsSkipped: number;
    headsMigrated: number;
    challansMigrated: number;
    challansSkipped: number;
    message: string;
  }> {
    this.logger.log('Migration is a no-op: full cutover to new fee schema is complete.');
    return {
      installmentsMigrated: 0,
      installmentsSkipped: 0,
      headsMigrated: 0,
      challansMigrated: 0,
      challansSkipped: 0,
      message: 'Full cutover complete. Old tables have been dropped. No migration needed.',
    };
  }

  /**
   * Return counts of new records.
   */
  async getMigrationStats(): Promise<{
    new: {
      feeInstallments: number;
      installmentHeads: number;
      feeChallanV2s: number;
      challanPayments: number;
    };
    message: string;
  }> {
    const [
      feeInstallments,
      installmentHeads,
      feeChallanV2s,
      challanPayments,
    ] = await Promise.all([
      this.prisma.feeInstallment.count(),
      this.prisma.installmentHead.count(),
      this.prisma.feeChallanV2.count(),
      this.prisma.challanPayment.count(),
    ]);

    return {
      new: {
        feeInstallments,
        installmentHeads,
        feeChallanV2s,
        challanPayments,
      },
      message: 'Full cutover complete. Old tables have been dropped.',
    };
  }

  /**
   * Parse a JSON string of selected heads from the old schema.
   * Returns an empty array if parsing fails.
   */
  private parseSelectedHeads(json: string): Array<{ name: string; amount: number }> {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  }
}
