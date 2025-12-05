import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AttendanceModule } from 'src/attendance/attendance.module';
import { StudentModule } from 'src/student/student.module';

@Module({
  imports:[PrismaModule, AttendanceModule, StudentModule],
  controllers: [TeacherController],
  providers: [TeacherService]
})
export class TeacherModule {}
