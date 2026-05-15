import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private async hasColumn(table: string, column: string): Promise<boolean> {
    const rows = await this.$queryRawUnsafe<Array<{ COLUMN_NAME: string }>>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?`,
      table,
      column,
    );
    return rows.length > 0;
  }

  private async ensureSchemaCompatibility() {
    // Fee challan template: type column used throughout fee-management module
    if (await this.hasColumn('feechallantemplate', 'type')) {
      // already compatible
    } else {
      await this.$executeRawUnsafe(
        `ALTER TABLE feechallantemplate
         ADD COLUMN type ENUM('INSTALLMENT','EXTRA','HOSTEL') NOT NULL DEFAULT 'INSTALLMENT'`,
      );
    }

    // Institute settings: newer fields may be missing in older DBs
    if (!(await this.hasColumn('institutesettings', 'lateFeeRatePerDay'))) {
      await this.$executeRawUnsafe(
        `ALTER TABLE institutesettings
         ADD COLUMN lateFeeRatePerDay DECIMAL(12,2) NULL DEFAULT 0`,
      );
    }

    if (!(await this.hasColumn('institutesettings', 'extraChallanLateFee'))) {
      await this.$executeRawUnsafe(
        `ALTER TABLE institutesettings
         ADD COLUMN extraChallanLateFee DECIMAL(12,2) NULL DEFAULT 0`,
      );
    }

    if (await this.hasColumn('institutesettings', 'createdAt')) {
      await this.$executeRawUnsafe(
        `ALTER TABLE institutesettings
         MODIFY COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`,
      );
    }

    if (await this.hasColumn('institutesettings', 'updatedAt')) {
      await this.$executeRawUnsafe(
        `ALTER TABLE institutesettings
         MODIFY COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
      );
    }
  }

  async onModuleInit() {
    await this.$connect();
    try {
      await this.ensureSchemaCompatibility();
    } catch (err) {
      // Do not block startup; surface drift details for operators.
      // eslint-disable-next-line no-console
      console.warn('Schema compatibility bootstrap failed:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
