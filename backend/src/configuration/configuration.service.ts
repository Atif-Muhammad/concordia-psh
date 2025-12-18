import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportCardTemplateDto } from './dtos/create-report-card-template.dto';
import { UpdateReportCardTemplateDto } from './dtos/update-report-card-template.dto';
import { CreateInstituteSettingsDto } from './dtos/create-institute-settings.dto';
import { UpdateInstituteSettingsDto } from './dtos/update-institute-settings.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStaffIDCardTemplateDto } from './dtos/create-staff-id-card-template.dto';
import { UpdateStaffIDCardTemplateDto } from './dtos/update-staff-id-card-template.dto';
import { CreateStudentIDCardTemplateDto } from './dtos/create-student-id-card-template.dto';
import { UpdateStudentIDCardTemplateDto } from './dtos/update-student-id-card-template.dto';

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
    const template = await this.prisma.reportCardTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException(`ReportCardTemplate with id ${id} not found`);
    }
    return template;
  }

  // Update an existing template
  async updateReportCardTemplate(
    id: number,
    data: UpdateReportCardTemplateDto,
  ) {
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

  // ==================== STAFF ID CARD TEMPLATES ====================

  async createStaffIDCardTemplate(data: any) {
    if (data.isDefault) {
      await this.prisma.staffIDCardTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.staffIDCardTemplate.create({ data });
  }

  async findAllStaffIDCardTemplates() {
    return this.prisma.staffIDCardTemplate.findMany();
  }

  async findOneStaffIDCardTemplate(id: number) {
    const template = await this.prisma.staffIDCardTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException(`StaffIDCardTemplate with id ${id} not found`);
    }
    return template;
  }

  async updateStaffIDCardTemplate(id: number, data: any) {
    if (data.isDefault) {
      await this.prisma.staffIDCardTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.staffIDCardTemplate.update({ where: { id }, data });
  }

  async removeStaffIDCardTemplate(id: number) {
    return this.prisma.staffIDCardTemplate.delete({ where: { id } });
  }

  async findDefaultStaffIDCardTemplate() {
    return this.prisma.staffIDCardTemplate.findFirst({
      where: { isDefault: true },
    });
  }

  // ==================== STUDENT ID CARD TEMPLATES ====================

  async createStudentIDCardTemplate(data: CreateStudentIDCardTemplateDto) {
    if (data.isDefault) {
      await this.prisma.studentIDCardTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.studentIDCardTemplate.create({ data });
  }

  async findAllStudentIDCardTemplates() {
    return this.prisma.studentIDCardTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneStudentIDCardTemplate(id: number) {
    return this.prisma.studentIDCardTemplate.findUnique({ where: { id } });
  }

  async updateStudentIDCardTemplate(id: number, data: UpdateStudentIDCardTemplateDto) {
    if (data.isDefault) {
      await this.prisma.studentIDCardTemplate.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.studentIDCardTemplate.update({
      where: { id },
      data,
    });
  }

  async removeStudentIDCardTemplate(id: number) {
    return this.prisma.studentIDCardTemplate.delete({ where: { id } });
  }

  async findDefaultStudentIDCardTemplate() {
    return this.prisma.studentIDCardTemplate.findFirst({
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
