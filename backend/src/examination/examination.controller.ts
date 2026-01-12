import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CreateExamDto } from './dtos/exam.dto';
import { ExaminationService } from './examination.service';
import { CreateMarksDto, UpdateMarksDto, BulkCreateMarksDto } from './dtos/marks.dto';
import { CreateResultDto, UpdateResultDto } from './dtos/result.dto';
import { CreatePositionDto, UpdatePositionDto } from './dtos/position.dto';

@Controller('exams')
export class ExaminationController {
  constructor(private readonly examService: ExaminationService) { }
  // exams
  @Post('create')
  create(@Body() dto: CreateExamDto) {
    return this.examService.create(dto);
  }

  @Get('all')
  findAll() {
    return this.examService.findAll();
  }

  @Put('update')
  update(@Query('id') id: string, @Body() dto: Partial<CreateExamDto>) {
    return this.examService.update(Number(id), dto);
  }

  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.examService.delete(Number(id));
  }

  //   marks
  @Post('marks/create')
  createMarks(@Body() dto: CreateMarksDto) {
    return this.examService.createMarks(dto);
  }

  @Post('marks/bulk-create')
  createMarksBulk(@Body() dto: BulkCreateMarksDto) {
    return this.examService.bulkCreateMarks(dto);
  }

  @Get('marks/all')
  findAllMarks(
    @Query('examId') examId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.examService.findAllMarks(
      examId ? Number(examId) : undefined,
      sectionId ? Number(sectionId) : undefined,
    );
  }

  @Put('marks/update')
  updateMarks(@Query('id') id: string, @Body() dto: UpdateMarksDto) {
    return this.examService.updateMarks(id, dto);
  }

  @Delete('marks/delete')
  removeMarks(@Query('id') id: string) {
    return this.examService.deleteMarks(id);
  }

  //results
  @Post('result/create')
  createResult(@Body() dto: CreateResultDto) {
    return this.examService.createResult(dto);
  }

  @Get('result/all')
  findAllResults() {
    return this.examService.findAllResults();
  }

  @Post('result/generate')
  generateResults(
    @Query('examId') examId: string,
    @Query('classId') classId?: string,
  ) {
    return this.examService.generateResultsForExam(
      Number(examId),
      classId ? Number(classId) : undefined,
    );
  }

  @Put('result/update')
  updateResult(@Query('id') id: string, @Body() dto: UpdateResultDto) {
    return this.examService.updateResult(id, dto);
  }

  @Delete('result/delete')
  removeResult(@Query('id') id: string) {
    return this.examService.deleteResult(id);
  }

  @Get('result/student')
  getStudentResult(
    @Query('studentId') studentId: string,
    @Query('examId') examId: string,
  ) {
    return this.examService.getStudentResult(Number(studentId), Number(examId));
  }

  //positions
  @Post('positions/generate')
  generatePositions(
    @Query('examId') examId: string,
    @Query('classId') classId?: string,
  ) {
    return this.examService.generatePositionsForExam(
      Number(examId),
      classId ? Number(classId) : undefined,
    );
  }

  @Get('positions/all')
  findAllPositions(
    @Query('examId') examId?: string,
    @Query('classId') classId?: string,
  ) {
    return this.examService.findAllPositions(
      examId ? Number(examId) : undefined,
      classId ? Number(classId) : undefined,
    );
  }

  @Put('positions/update')
  updatePosition(@Query('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.examService.updatePosition(id, dto);
  }

  @Delete('positions/delete')
  removePosition(@Query('id') id: string) {
    return this.examService.deletePosition(id);
  }
}
