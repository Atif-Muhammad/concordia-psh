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
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UploadedFile, UseInterceptors, ConflictException, BadRequestException } from '@nestjs/common';

@Controller('teacher')
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly attendanceService: AttendanceService,
    private readonly studentService: StudentService,
    private readonly cloudinaryService: CloudinaryService,
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
  @UseInterceptors(FileInterceptor('photo'))
  async createTeacher(
    @UploadedFile() file: Express.Multer.File,
    @Body() payload: TeacherDto,
  ) {
    let url: string | null = null;
    let public_id: string | null = null;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadFile(file);
      if (!uploaded?.url || !uploaded?.public_id) {
        throw new ConflictException('Failed to upload teacher photo');
      }
      url = uploaded.url;
      public_id = uploaded.public_id;
    }

    if (payload.documents && typeof payload.documents === 'string') {
      try {
        payload.documents = JSON.parse(payload.documents);
      } catch (error) {
        throw new BadRequestException('Invalid JSON format for documents');
      }
    }

    return await this.teacherService.createTeacher({
      ...payload,
      photo_url: url || undefined,
      photo_public_id: public_id || undefined,
    });
  }
  @Patch('update')
  @UseInterceptors(FileInterceptor('photo'))
  async updateTeacher(
    @UploadedFile() file: Express.Multer.File,
    @Query() teacherID: { teacherID: string },
    @Body() payload: Partial<TeacherDto>,
  ) {
    if (!teacherID.teacherID) {
      throw new BadRequestException('teacherID is required');
    }
    const id = Number(teacherID.teacherID);
    let photo_url: string | undefined;
    let photo_public_id: string | undefined;

    if (file) {
      const existingTeacher = await this.teacherService.findOne(id);
      if (existingTeacher && existingTeacher.photo_public_id) {
        await this.cloudinaryService
          .removeFile(existingTeacher.photo_public_id)
          .catch(() => {
            console.warn(`Failed to delete old photo: ${existingTeacher.photo_public_id}`);
          });
      }

      const uploadResult = await this.cloudinaryService.uploadFile(file);
      if (!uploadResult.url || !uploadResult.public_id) {
        throw new ConflictException('Failed to upload teacher photo');
      }
      photo_url = uploadResult.url;
      photo_public_id = uploadResult.public_id;
    }

    const updateData = { ...payload };
    if (photo_url && photo_public_id) {
      updateData.photo_url = photo_url;
      updateData.photo_public_id = photo_public_id;
    }

    if (updateData.documents && typeof updateData.documents === 'string') {
      try {
        updateData.documents = JSON.parse(updateData.documents);
      } catch (error) {
        throw new BadRequestException('Invalid JSON format for documents');
      }
    }

    return await this.teacherService.updateTeacher(id, updateData);
  }
  @Delete('remove')
  async removeTeacher(@Query('teacherID') teacherID: string) {
    const id = Number(teacherID);
    const existingTeacher = await this.teacherService.findOne(id);
    if (existingTeacher && existingTeacher.photo_public_id) {
      await this.cloudinaryService.removeFile(existingTeacher.photo_public_id).catch(() => {
        console.warn(`Failed to delete photo for teacher ${id}`);
      });
    }
    return await this.teacherService.removeTeacher(id);
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
