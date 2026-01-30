import { Module } from '@nestjs/common';
import { FeeManagementController } from './fee-management.controller';
import { FeeManagementService } from './fee-management.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeeManagementController],
  providers: [FeeManagementService],
  exports: [FeeManagementService],
})
export class FeeManagementModule {}
