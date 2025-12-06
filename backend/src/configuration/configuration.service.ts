import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportCardTemplateDto } from './dtos/create-report-card-template.dto';
import { UpdateReportCardTemplateDto } from './dtos/update-report-card-template.dto';
import { CreateInstituteSettingsDto } from './dtos/create-institute-settings.dto';
import { UpdateInstituteSettingsDto } from './dtos/update-institute-settings.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConfigurationService {
  constructor(private readonly prisma: PrismaService) { }

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

  // ==================== INSTITUTE SETTINGS ====================

  // Get institute settings or create default if none exist
  async getInstituteSettings() {
    let settings = await this.prisma.instituteSettings.findFirst();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await this.prisma.instituteSettings.create({
        data: {
          instituteName: 'Concordia College',
          email: 'info@concordia.edu.pk',
          phone: '+92 300 0000000',
          address: 'Main Campus, Lahore',
          facebook: 'https://facebook.com/concordia',
          instagram: 'https://instagram.com/concordia',
        },
      });
    }

    return settings;
  }

  // Update institute settings (or create if doesn't exist)
  async updateInstituteSettings(data: UpdateInstituteSettingsDto) {
    // Try to find existing settings
    const existing = await this.prisma.instituteSettings.findFirst();

    if (existing) {
      // Update existing
      return this.prisma.instituteSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      // Create new with provided data
      return this.prisma.instituteSettings.create({
        data: data as CreateInstituteSettingsDto,
      });
    }
  }
}
