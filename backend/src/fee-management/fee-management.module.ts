import { Module } from '@nestjs/common';
import { FeeManagementController } from './fee-management.controller';
import { FeeController } from './fee.controller';
import { FeeManagementService } from './fee-management.service';
import { LateFeeCronService } from './late-fee.cron';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LateFeeService } from './late-fee.service';
import { InstallmentService } from './installment.service';
import { ChallanService } from './challan.service';
import { ExtraChallanService } from './extra-challan.service';
import { PaymentService } from './payment.service';
import { MigrationService } from './migration.service';

@Module({
  imports: [PrismaModule],
  controllers: [FeeManagementController, FeeController],
  providers: [
    FeeManagementService,
    LateFeeCronService,
    LateFeeService,
    InstallmentService,
    ChallanService,
    ExtraChallanService,
    PaymentService,
    MigrationService,
  ],
  exports: [FeeManagementService, InstallmentService, ChallanService, ExtraChallanService, PaymentService, MigrationService],
})
export class FeeManagementModule {}
