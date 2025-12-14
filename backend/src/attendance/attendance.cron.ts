import { Injectable, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from 'src/prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';
import { AttendanceService } from './attendance.service';

@Injectable()
export class AttendanceCron {
  private readonly logger = new Logger(AttendanceCron.name);

  constructor(
    private prisma: PrismaService,
    private attendance: AttendanceService,
  ) {
    this.scheduleDailyAttendance();
  }

  private scheduleDailyAttendance() {
    cron.schedule('0 6 * * *', async () => {
      this.logger.log('⏰ Running daily auto attendance generation...');

      const now = new Date();
      const today = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
      );

      // Check if today is a non-working day (weekend or holiday)
      const dateCheck = await this.attendance.isNonWorkingDay(today);
      if (dateCheck.isBlocked) {
        this.logger.log(
          `${dateCheck.reason} detected — skipping auto attendance generation.`,
        );
        return;
      }

      await this.attendance.generateAttendanceForDate(today);
      await this.attendance.generateAttendanceTeacher(today);
      await this.attendance.generateAttendanceEmployee(today);
    });
  }
}
