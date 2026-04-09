import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { LeaveDto } from './dtos/leave.dto';
import { JwtAccGuard } from 'src/common/guards/jwt-access.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('generate')
  async generateAttendance(
    @Query('date') date: string,
    @Query('attenFor') attenFor: 'teacher' | 'student',
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    let targetDate: Date;
    if (date) {
      // Support both yyyy-MM-dd and dd/MM/yyyy formats
      let year: number, month: number, day: number;
      if (date.includes('-')) {
        [year, month, day] = date.split('-').map(Number);
      } else {
        [day, month, year] = date.split('/').map(Number);
      }
      targetDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      const now = new Date();
      targetDate = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
      );
    }
    if (attenFor === 'teacher')
      return await this.attendanceService.generateAttendanceStaff(targetDate);
    if (attenFor === 'student')
      return await this.attendanceService.generateAttendanceForDate(
        targetDate,
        Number(classId) || undefined,
        Number(sectionId) || undefined,
      );
    throw new ForbiddenException();
  }

  @Get('report')
  async getAttendanceReport(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.attendanceService.getAttendanceReport(
      start,
      end,
      classId,
      sectionId,
    );
  }

  @UseGuards(JwtAccGuard)
  @Get('student/fetch')
  async fetchStudentAttendance(
    @Req() req: any,
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
    @Query('subjectId') subjectId: string,
    @Query('date') date: string,
  ) {
    const { user } = req;
    return await this.attendanceService.fetchClassAttendance(
      Number(classId),
      sectionId ? Number(sectionId) : null,
      Number(subjectId),
      date,
      user,
    );
  }

  @UseGuards(JwtAccGuard)
  @Patch('student/update')
  async updateStudentAttendance(
    @Req() req: any,
    @Body()
    payload: {
      classId: number;
      sectionId: number | null;
      subjectId: number;
      teacherId: number | null;
      date: string;
      students: {
        studentId: string;
        status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY';
      }[];
    },
  ) {
    const { user } = req;
    return await this.attendanceService.updateAttendance(
      payload.classId,
      payload.sectionId,
      payload.subjectId,
      payload.teacherId ?? null,
      payload.date,
      payload.students,
      user,
    );
  }

  // leaves
  @Get('leaves/get')
  async allLeaves(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ) {
    return await this.attendanceService.leaves(page, limit);
  }

  @Post('leaves/create')
  async createLeave(@Body() payload: LeaveDto) {
    return await this.attendanceService.createLeave(payload);
  }
  @UseGuards(JwtAccGuard)
  @UseGuards(PermissionsGuard)
  @Patch('leaves/update')
  async updateLeave(
    @Req() req: { user: { id: string } },
    @Query('id') id: string,
    @Body() payload: { status: 'APPROVED' | 'REJECTED' },
  ) {
    const approverId = req.user?.id ? Number(req.user.id) : null;
    return await this.attendanceService.updateLeave(
      Number(id),
      approverId,
      payload,
    );
  }
  @Delete('leave')
  async deleteLeave(@Query('id') id: string) {
    return await this.attendanceService.deleteLeave(Number(id));
  }

  @Post('holiday')
  async createHoliday(@Body() body: { date: string; title?: string }) {
    return this.attendanceService.createHolidayForDate(body.date, body.title);
  }

  // teacher attendance and leave
}
