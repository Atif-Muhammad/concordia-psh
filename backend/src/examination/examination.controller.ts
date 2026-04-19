import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateExamDto, UpdateExamDto } from './dtos/exam.dto';
import { ExaminationService } from './examination.service';
import {
  CreateMarksDto,
  UpdateMarksDto,
  BulkCreateMarksDto,
} from './dtos/marks.dto';
import { CreateResultDto, UpdateResultDto } from './dtos/result.dto';
import { JwtAccGuard } from 'src/common/guards/jwt-access.guard';
import { UpdatePositionDto } from './dtos/position.dto';

@Controller('exams')
export class ExaminationController {
  constructor(private readonly examinationService: ExaminationService) {}

  // exams
  @UseGuards(JwtAccGuard)
  @Post()
  create(@Body() createExamDto: CreateExamDto, @Req() req: any) {
    return this.examinationService.create(createExamDto, req.user);
  }

  @UseGuards(JwtAccGuard)
  @Get()
  findAll(@Req() req: any, @Query('sessionId') sessionId?: string) {
    return this.examinationService.findAll(req.user, sessionId ? +sessionId : undefined);
  }

  @UseGuards(JwtAccGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExamDto: UpdateExamDto,
    @Req() req: any,
  ) {
    return this.examinationService.update(+id, updateExamDto, req.user);
  }

  @UseGuards(JwtAccGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.examinationService.delete(+id, req.user);
  }

  //   marks
  @UseGuards(JwtAccGuard)
  @Post('marks')
  createMarks(@Body() createMarksDto: CreateMarksDto, @Req() req: any) {
    return this.examinationService.createMarks(createMarksDto, req.user);
  }

  @UseGuards(JwtAccGuard)
  @Post('marks/bulk')
  bulkCreateMarks(@Body() dto: BulkCreateMarksDto, @Req() req: any) {
    return this.examinationService.bulkCreateMarks(dto, req.user);
  }

  @UseGuards(JwtAccGuard)
  @Get('marks')
  findAllMarks(
    @Req() req: any,
    @Query('examId') examId: string,
    @Query('sectionId') sectionId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.examinationService.findAllMarks(
      examId ? +examId : undefined,
      sectionId ? +sectionId : undefined,
      req.user,
      sessionId ? +sessionId : undefined,
    );
  }

  @UseGuards(JwtAccGuard)
  @Patch('marks/:id')
  updateMarks(
    @Param('id') id: string,
    @Body() updateMarksDto: UpdateMarksDto,
    @Req() req: any,
  ) {
    return this.examinationService.updateMarks(id, updateMarksDto, req.user);
  }

  @Delete('marks/delete')
  removeMarks(@Query('id') id: string) {
    return this.examinationService.deleteMarks(id);
  }

  //results
  @Post('result/create')
  createResult(@Body() dto: CreateResultDto) {
    return this.examinationService.createResult(dto);
  }

  @UseGuards(JwtAccGuard)
  @Get('result/all')
  findAllResults(@Req() req: any, @Query('sessionId') sessionId?: string) {
    return this.examinationService.findAllResults(req.user, sessionId ? +sessionId : undefined);
  }

  @Post('result/generate')
  generateResults(
    @Query('examId') examId: string,
    @Query('classId') classId?: string,
  ) {
    return this.examinationService.generateResultsForExam(
      Number(examId),
      classId ? Number(classId) : undefined,
    );
  }

  @Patch('result/update')
  updateResult(@Query('id') id: string, @Body() dto: UpdateResultDto) {
    return this.examinationService.updateResult(id, dto);
  }

  @Delete('result/delete')
  removeResult(@Query('id') id: string) {
    return this.examinationService.deleteResult(id);
  }

  @Get('result/student')
  getStudentResult(
    @Query('studentId') studentId: string,
    @Query('examId') examId: string,
  ) {
    return this.examinationService.getStudentResult(
      Number(studentId),
      Number(examId),
    );
  }

  //positions
  @Post('positions/generate')
  generatePositions(
    @Query('examId') examId: string,
    @Query('classId') classId?: string,
  ) {
    return this.examinationService.generatePositionsForExam(
      Number(examId),
      classId ? Number(classId) : undefined,
    );
  }

  @UseGuards(JwtAccGuard)
  @Get('positions/all')
  findAllPositions(
    @Query('examId') examId: string,
    @Query('classId') classId: string,
    @Req() req: any,
  ) {
    return this.examinationService.findAllPositions(
      examId ? Number(examId) : undefined,
      classId ? Number(classId) : undefined,
      req.user,
    );
  }

  @Patch('positions/update')
  updatePosition(@Query('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.examinationService.updatePosition(id, dto);
  }

  @Delete('positions/delete')
  removePosition(@Query('id') id: string) {
    return this.examinationService.deletePosition(id);
  }
}
