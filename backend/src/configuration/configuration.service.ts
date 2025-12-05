import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportCardTemplateDto } from './dtos/create-report-card-template.dto';
import { UpdateReportCardTemplateDto } from './dtos/update-report-card-template.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConfigurationService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new ReportCardTemplate
  async createReportCardTemplate(data: CreateReportCardTemplateDto) {
    if (data.isDefault) {
      await this.prisma.reportCardTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.reportCardTemplate.create({ data });
  }

  // Retrieve all templates
  async findAllReportCardTemplates() {
    return this.prisma.reportCardTemplate.findMany();
  }

  // Retrieve a single template by ID
  async findOneReportCardTemplate(id: number) {
    const template = await this.prisma.reportCardTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException(`ReportCardTemplate with id ${id} not found`);
    }
    return template;
  }

  // Update an existing template
  async updateReportCardTemplate(id: number, data: UpdateReportCardTemplateDto) {
    if (data.isDefault) {
      await this.prisma.reportCardTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.reportCardTemplate.update({ where: { id }, data });
  }

  // Delete a template
  async removeReportCardTemplate(id: number) {
    return this.prisma.reportCardTemplate.delete({ where: { id } });
  }

  // Retrieve the default template
  async findDefaultReportCardTemplate() {
    return this.prisma.reportCardTemplate.findFirst({
      where: { isDefault: true },
    });
  }
}
