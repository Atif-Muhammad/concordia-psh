import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentDto } from './dtos/student.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  @Get('get/all/passout')
  async getPassoutStudents(
    @Query('programId') programId?: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('searchQuery') searchQuery?: string,
  ) {
    if (!programId && !classId && !sectionId && !searchQuery) return [];

    if (searchQuery && searchQuery.trim() !== '') {
      return await this.studentService.search(searchQuery, true);
    }

    return await this.studentService.getPassedOutStudents({
      programId: (programId && Number(programId)) || null,
      classId: (classId && Number(classId)) || null,
      sectionId: (sectionId && Number(sectionId)) || null,
    });
  }
  @Get('get/all')
  async getStudents(
    @Query('programId') programId?: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('searchQuery') searchQuery?: string,
  ) {
    if (!programId && !classId && !sectionId) return [];

    if (searchQuery && searchQuery.trim() !== '') {
      return await this.studentService.search(searchQuery, false);
    }
    return await this.studentService.getAllStudents({
      programId: (programId && Number(programId)) || null,
      classId: (classId && Number(classId)) || null,
      sectionId: (sectionId && Number(sectionId)) || null,
    });
  }

  @Get('search')
  async searchStudent(@Query('searchFor') searchFor: string) {
    return await this.studentService.search(searchFor);
  }

  @Post('create')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async createStudent(
    @UploadedFile() file: Express.Multer.File,
    @Body() payload: StudentDto,
  ) {
    // check if the roll number is already taken
    const takenRoll = await this.studentService.getStudentByNumber(
      payload.rollNumber,
    );
    if (takenRoll)
      throw new ConflictException(
        'Student Roll Number is already taken -- try assigning another',
      );
    let url: string | null = null;
    let public_id: string | null = null;

    if (file) {
      // upload photo
      const uploaded = await this.cloudinaryService.uploadFile(file);

      if (!uploaded?.url || !uploaded?.public_id) {
        throw new ConflictException('Failed to upload student photo');
      }

      url = uploaded.url;
      public_id = uploaded.public_id;
    }

    // Parse documents safely
    const documents = payload.documents ? JSON.parse(payload.documents) : [];

    return await this.studentService.createStudent({
      ...payload,
      documents,
      photo_url: url || undefined,
      photo_public_id: public_id || undefined,
    });
  }

  @Patch('update')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async updateStudent(
    @UploadedFile() file: Express.Multer.File,
    @Query() studentID: { studentID: string },
    @Body() payload: Partial<StudentDto>,
  ) {
    if (!studentID.studentID) {
      throw new BadRequestException('studentID is required');
    }
    let photo_url: string | undefined;
    let photo_public_id: string | undefined;

    // Only process photo if a new file is uploaded
    if (file) {
      const existingStudent = await this.studentService.findOne(
        Number(studentID.studentID),
      );
      if (!existingStudent) {
        throw new NotFoundException(`Student with ID ${studentID} not found`);
      }

      // Upload new photo
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      if (!uploadResult.url || !uploadResult.public_id) {
        throw new ConflictException('Failed to upload student photo');
      }

      photo_url = uploadResult.url;
      photo_public_id = uploadResult.public_id;

      // Delete old photo from Cloudinary (if exists)
      if (existingStudent.photo_public_id) {
        await this.cloudinaryService
          .removeFile(existingStudent.photo_public_id)
          .catch(() => {
            console.warn(
              `Failed to delete old photo: ${existingStudent.photo_public_id}`,
            );
          });
      }
    }
    let documents = payload.documents;
    if (typeof documents === 'string') {
      try {
        documents = JSON.parse(documents);
      } catch {
        throw new BadRequestException('Invalid JSON in documents field');
      }
    }
    const updateData: any = {
      ...payload,
      documents,
    };
    if (photo_url && photo_public_id) {
      updateData.photo_url = photo_url;
      updateData.photo_public_id = photo_public_id;
    }
    return await this.studentService.updateStudent(
      Number(studentID.studentID),
      updateData,
    );
  }

  @Delete('remove')
  async deleteStudent(@Query('studentID') studentID: string) {
    this.studentService.removeStudent(Number(studentID));
  }

  @Patch('promote')
  async promoteStudents(
    @Query('studentID') studentID: string,
    @Query('forcePromote') forcePromote?: string, // Query params are always strings!
  ) {
    console.log(
      '🔵 Controller received forcePromote:',
      forcePromote,
      'typeof:',
      typeof forcePromote,
    );
    const forceBool = forcePromote === 'true';
    console.log('🔵 Converting to boolean:', forceBool);
    console.log('🔵 Calling promote service...');

    try {
      const result = await this.studentService.promote(
        Number(studentID),
        forceBool,
      );
      console.log('🔵 Promote service returned:', result);
      return result;
    } catch (error) {
      console.error('❌ Promote controller error:', error);
      throw error;
    }
  }
  @Patch('demote')
  async demoteStudents(@Query('studentID') studentID: string) {
    return await this.studentService.demote(Number(studentID));
  }
  @Patch('passout')
  async passoutStudents(@Query('studentID') studentID: string) {
    return await this.studentService.passout(Number(studentID));
  }

  // Get attendance records for a specific student
  @Get('attendance/:id')
  async getStudentAttendance(@Param('id') id: string) {
    if (!id) throw new BadRequestException('Student ID is required');
    return await this.studentService.getStudentAttendance(Number(id));
  }

  // Get exam results for a specific student
  @Get('results/:id')
  async getStudentResults(@Param('id') id: string) {
    if (!id) throw new BadRequestException('Student ID is required');
    return await this.studentService.getStudentResults(Number(id));
  }

  // Generate attendance report for a specific student
  @Get('attendance-report/:id')
  async getAttendanceReport(@Param('id') id: string) {
    if (!id) throw new BadRequestException('Student ID is required');
    return await this.studentService.generateAttendanceReport(Number(id));
  }

  // Generate result report for a specific student
  @Get('result-report/:id')
  async getResultReport(@Param('id') id: string) {
    if (!id) throw new BadRequestException('Student ID is required');
    return await this.studentService.generateResultReport(Number(id));
  }
}
