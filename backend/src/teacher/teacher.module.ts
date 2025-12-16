import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AttendanceModule } from 'src/attendance/attendance.module';
import { StudentModule } from 'src/student/student.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, AttendanceModule, StudentModule, CloudinaryModule],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule { }
