import { Module } from '@nestjs/common';
import { FeeManagementController } from './fee-management.controller';
import { FeeManagementService } from './fee-management.service';
import { LateFeeCronService } from './late-fee.cron';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeeManagementController],
  providers: [FeeManagementService, LateFeeCronService],
  exports: [FeeManagementService],
})
export class FeeManagementModule {}
