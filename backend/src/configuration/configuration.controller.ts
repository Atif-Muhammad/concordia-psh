import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { CreateReportCardTemplateDto } from './dtos/create-report-card-template.dto';
import { UpdateReportCardTemplateDto } from './dtos/update-report-card-template.dto';

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
  update(@Param('id') id: string, @Body() updateDto: UpdateReportCardTemplateDto) {
    return this.configService.updateReportCardTemplate(Number(id), updateDto);
  }

  @Delete('report-card-templates/:id')
  remove(@Param('id') id: string) {
    return this.configService.removeReportCardTemplate(Number(id));
  }
}
