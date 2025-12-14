import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AttendanceModule } from 'src/attendance/attendance.module';

@Module({
  imports: [PrismaModule, AttendanceModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
