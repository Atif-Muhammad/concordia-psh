import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceModule } from '../finance/finance.module';
import { FeeManagementModule } from '../fee-management/fee-management.module';

@Module({
  imports: [FinanceModule, FeeManagementModule],
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService],
})
export class DashboardModule {}
