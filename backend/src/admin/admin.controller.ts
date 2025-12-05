import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAccGuard } from 'src/common/guards/jwt-access.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { AttendanceService } from 'src/attendance/attendance.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService, private readonly attendanceService: AttendanceService) { }

  @UseGuards(JwtAccGuard, RolesGuard)
  @Roles(RolesEnum.SUPER_ADMIN)
  @Get('get/admins')
  async getAdmins() {
    return await this.adminService.getAdmins();
  }

  @UseGuards(JwtAccGuard, RolesGuard)
  @Roles(RolesEnum.SUPER_ADMIN)
  @Patch('update/admin')
  async updateAdmin(
    @Query() adminID: { adminID: string },
    @Body() payload: Partial<CreateAdminDto>,
  ) {
    return await this.adminService.updateAdmin(
      Number(adminID?.adminID),
      payload,
    );
  }

  @UseGuards(JwtAccGuard, RolesGuard)
  @Roles(RolesEnum.SUPER_ADMIN)
  @Post('create/admin')
  async createAdmin(@Body() payload: CreateAdminDto) {
    return await this.adminService.createAdmin(payload);
  }

  @UseGuards(JwtAccGuard, RolesGuard)
  @Roles(RolesEnum.SUPER_ADMIN)
  @Delete('remove/admin')
  async removeAdmin(@Query() adminID: { adminID: string }) {
    return await this.adminService.removeAdmin(Number(adminID?.adminID));
  }

  @UseGuards(JwtAccGuard, PermissionsGuard)
  @Permissions('Teacher')
  @Get('get/teacher/attendance')
  async getTeacherAttendance(@Query('date') date: string) {
    return await this.attendanceService.getTeacherAttendance(new Date(date))
  }
  @UseGuards(JwtAccGuard, PermissionsGuard)
  @Permissions('Teacher')
  @Patch('mark/teacher')
  async markTeacher(
    @Req() req: { user: { id: string } },
    @Query('id') id: string,
    @Body() payload: { status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY', date: string }
  ) {
    return await this.attendanceService.markTeacherAttendance(
      Number(id),
      Number(req.user?.id),
      payload.status,
      new Date(payload.date)
    );
  }

}
