import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AttendanceCron } from './attendance.cron';

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceCron],
  exports: [AttendanceService]
})
export class AttendanceModule {}
