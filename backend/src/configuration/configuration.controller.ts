import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { CreateReportCardTemplateDto } from './dtos/create-report-card-template.dto';
import { UpdateReportCardTemplateDto } from './dtos/update-report-card-template.dto';

@Controller('configuration/report-card-templates')
export class ConfigurationController {
  constructor(private readonly configService: ConfigurationService) {}

  @Post()
  create(@Body() createDto: CreateReportCardTemplateDto) {
    return this.configService.createReportCardTemplate(createDto);
  }

  @Get('default')
  getDefaultTemplate() {
    return this.configService.findDefaultReportCardTemplate();
  }

  @Get()
  findAll() {
    return this.configService.findAllReportCardTemplates();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.configService.findOneReportCardTemplate(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateReportCardTemplateDto) {
    return this.configService.updateReportCardTemplate(Number(id), updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.configService.removeReportCardTemplate(Number(id));
  }
}
