import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { DepartmentModule } from './department/department.module';
import { TeacherModule } from './teacher/teacher.module';
import { AcademicsModule } from './academics/academics.module';
import { StudentModule } from './student/student.module';
import { AttendanceModule } from './attendance/attendance.module';
import { HrModule } from './hr/hr.module';
import { FrontOfficeModule } from './front-office/front-office.module';
import { ExaminationModule } from './examination/examination.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { HostelModule } from './hostel/hostel.module';
import { InventoryModule } from './inventory/inventory.module';
import { FeeManagementModule } from './fee-management/fee-management.module';
import { FinanceModule } from './finance/finance.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LocalFileModule } from './local-file/local-file.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AdminModule,
    DepartmentModule,
    TeacherModule,
    AcademicsModule,
    StudentModule,
    AttendanceModule,
    HrModule,
    FrontOfficeModule,
    ExaminationModule,
    ConfigurationModule,
    HostelModule,
    InventoryModule,
    FeeManagementModule,
    FinanceModule,
    DashboardModule,
    LocalFileModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
