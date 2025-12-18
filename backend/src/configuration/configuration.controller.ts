import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { CreateReportCardTemplateDto } from './dtos/create-report-card-template.dto';
import { UpdateReportCardTemplateDto } from './dtos/update-report-card-template.dto';
import { CreateStaffIDCardTemplateDto } from './dtos/create-staff-id-card-template.dto';
import { UpdateStaffIDCardTemplateDto } from './dtos/update-staff-id-card-template.dto';
import { CreateStudentIDCardTemplateDto } from './dtos/create-student-id-card-template.dto';
import { UpdateStudentIDCardTemplateDto } from './dtos/update-student-id-card-template.dto';

@Controller('configuration')
export class ConfigurationController {
  constructor(private readonly configService: ConfigurationService) { }

  // ==================== INSTITUTE SETTINGS ====================

  @Get('institute-settings')
  getInstituteSettings() {
    return this.configService.getInstituteSettings();
  }

  @Patch('institute-settings')
  updateInstituteSettings(@Body() updateDto: any) {
    return this.configService.updateInstituteSettings(updateDto);
  }

  // ==================== REPORT CARD TEMPLATES ====================

  @Post('report-card-templates')
  create(@Body() createDto: CreateReportCardTemplateDto) {
    return this.configService.createReportCardTemplate(createDto);
  }

  @Get('report-card-templates/default')
  getDefaultTemplate() {
    return this.configService.findDefaultReportCardTemplate();
  }

  @Get('report-card-templates')
  findAll() {
    return this.configService.findAllReportCardTemplates();
  }

  @Get('report-card-templates/:id')
  findOne(@Param('id') id: string) {
    return this.configService.findOneReportCardTemplate(Number(id));
  }

  @Patch('report-card-templates/:id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReportCardTemplateDto,
  ) {
    return this.configService.updateReportCardTemplate(Number(id), updateDto);
  }

  @Delete('report-card-templates/:id')
  remove(@Param('id') id: string) {
    return this.configService.removeReportCardTemplate(Number(id));
  }

  // ==================== STAFF ID CARD TEMPLATES ====================

  @Post('staff-id-card-templates')
  createStaffTemplate(@Body() createDto: CreateStaffIDCardTemplateDto) {
    return this.configService.createStaffIDCardTemplate(createDto);
  }

  @Get('staff-id-card-templates/default')
  getDefaultStaffTemplate() {
    return this.configService.findDefaultStaffIDCardTemplate();
  }

  @Get('staff-id-card-templates')
  findAllStaffTemplates() {
    return this.configService.findAllStaffIDCardTemplates();
  }

  @Get('staff-id-card-templates/:id')
  findOneStaffTemplate(@Param('id') id: string) {
    return this.configService.findOneStaffIDCardTemplate(Number(id));
  }

  @Patch('staff-id-card-templates/:id')
  updateStaffTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateStaffIDCardTemplateDto,
  ) {
    return this.configService.updateStaffIDCardTemplate(Number(id), updateDto);
  }

  @Delete('staff-id-card-templates/:id')
  removeStaffTemplate(@Param('id') id: string) {
    return this.configService.removeStaffIDCardTemplate(Number(id));
  }

  // ==================== STUDENT ID CARD TEMPLATES ====================

  @Post('student-id-card-templates')
  createStudentTemplate(@Body() createDto: CreateStudentIDCardTemplateDto) {
    return this.configService.createStudentIDCardTemplate(createDto);
  }

  @Get('student-id-card-templates/default')
  getDefaultStudentTemplate() {
    return this.configService.findDefaultStudentIDCardTemplate();
  }

  @Get('student-id-card-templates')
  findAllStudentTemplates() {
    return this.configService.findAllStudentIDCardTemplates();
  }

  @Get('student-id-card-templates/:id')
  findOneStudentTemplate(@Param('id') id: string) {
    return this.configService.findOneStudentIDCardTemplate(Number(id));
  }

  @Patch('student-id-card-templates/:id')
  updateStudentTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateStudentIDCardTemplateDto,
  ) {
    return this.configService.updateStudentIDCardTemplate(Number(id), updateDto);
  }

  @Delete('student-id-card-templates/:id')
  removeStudentTemplate(@Param('id') id: string) {
    return this.configService.removeStudentIDCardTemplate(Number(id));
  }
}
