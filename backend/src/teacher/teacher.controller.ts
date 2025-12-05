import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherDto } from './dtos/teacher.dto';
import { JwtAccGuard } from 'src/common/guards/jwt-access.guard';
import type { Request } from 'express';
import { AttendanceService } from 'src/attendance/attendance.service';
import { StudentService } from 'src/student/student.service';
import { AttendanceStatus } from '@prisma/client';

@Controller('teacher')
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly attendanceService: AttendanceService,
    private readonly studentService: StudentService,
  ) { }
  @Get('get/names')
  async getTeacherNames() {
    return await this.teacherService.getNames();
  }
  @Get('get')
  async getTeachers() {
    return await this.teacherService.getAll();
  }

  @Post('create')
  async createTeacher(@Body() payload: TeacherDto) {
    return await this.teacherService.createTeacher(payload);
  }
  @Patch('update')
  async updateTeacher(
    @Query() teacherID: { teacherID: string },
    @Body() payload: Partial<TeacherDto>,
  ) {
    return await this.teacherService.updateTeacher(
      Number(teacherID.teacherID),
      payload,
    );
  }
  @Delete('remove')
  async removeTeacher(@Query('teacherID') teacherID: string) {
    // return await this.teacherService.removeTeacher(Number(teacherID))
  }

  @Get('subjects')
  @UseGuards(JwtAccGuard)
  async getTeacherSubjects(@Req() req: { user: { id: string } }) {
    return await this.teacherService.getSubjects(Number(req.user.id));
  }

  @Get('subjects/by-class')
  @UseGuards(JwtAccGuard)
  async getTeacherSubjectsByClass(
    @Req() req: { user: { id: string } },
    @Query('classId') classId: string,
  ) {
    return await this.teacherService.getSubjectsForClass(
      Number(req.user.id),
      Number(classId),
    );
  }


  // for attendance
  @UseGuards(JwtAccGuard)
  @Get('get/classes')
  async getClasses(@Req() req: { user: { id: string } }) {
    const { id } = req.user;
    return await this.teacherService.getClasses(Number(id));
  }

  // @UseGuards(JwtAccGuard)
  // @Get('get/class/students/attendance')
  // async getClassAttendance(
  //   @Query('id') id: string,
  //   @Query('date') date: string,
  //   @Query('fetchFor') fetchFor: 'class' | 'section',
  //   @Query('subjectId') subjectId?: string,
  // ) {
  //   const targetDate = new Date(date);
  //   const day = targetDate.getDay();

  //   // Prevent weekends
  //   if (day === 0 || day === 6) {
  //     return {
  //       isWeekend: true,
  //       message: 'Attendance cannot be marked on weekends.',
  //       attendance: [],
  //     };
  //   }

  //   // Fetch pre-filled attendance
  //   const {attendance} = await this.attendanceService.fetchAttendance(
  //     Number(id),
  //     date,
  //     fetchFor,
  //     subjectId ? Number(subjectId) : null,
  //   );

  //   return {
  //     isWeekend: false,
  //     attendance, // always attendance only
  //   };
  // }

  @UseGuards(JwtAccGuard)
  @Get('get/class/students/attendance')
  async getClassAttendance(
    @Req() req: { user: { id: string } },
    @Query('id') id: string,
    @Query('date') date: string,
    @Query('fetchFor') fetchFor: 'class' | 'section',
    @Query('subjectId') subjectId?: string,
  ) {
    const teacherId = Number(req.user.id);
    const targetDate = new Date(date);
    const day = targetDate.getDay();

    if (day === 0 || day === 6) {
      return {
        isWeekend: true,
        message: 'Attendance cannot be marked on weekends.',
        attendance: [],
      };
    }

    const { attendance } = await this.attendanceService.fetchAttendance(
      Number(id),
      date,
      subjectId ? Number(subjectId) : null,
      teacherId,
    );

    return {
      isWeekend: false,
      attendance,
    };
  }

  @UseGuards(JwtAccGuard)
  @Patch('update/class/students/attendance')
  async updateAttendance(
    @Req() req: { user: { id: string } },
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
    @Query('date') date: string,
    @Query('subjectId') subjectId: string,
    @Body()
    body:
      | { studentId: string; status: AttendanceStatus }
      | { studentId: string; status: AttendanceStatus }[],
  ) {
    const teacherId = Number(req.user.id);
    const data = Array.isArray(body) ? body : [body]; // normalize to array
    // console.log(body)
    return this.attendanceService.updateAttendance(
      Number(classId),
      sectionId ? Number(sectionId) : null,
      Number(subjectId),
      teacherId,
      date,
      data,
    );
  }
}
