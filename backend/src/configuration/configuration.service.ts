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
  constructor(private readonly prisma: PrismaService) {}

  private async getInstituteSettingsColumns(): Promise<Set<string>> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ COLUMN_NAME: string }>>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'institutesettings'`,
    );
    return new Set(rows.map((r) => r.COLUMN_NAME));
  }

  private async getInstituteSettingsRowRaw(): Promise<any | null> {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM institutesettings LIMIT 1`,
    );
    const row = rows?.[0] ?? null;
    if (!row) return null;
    // Backward compatibility for older DBs missing newer columns
    if (row.lateFeeRatePerDay === undefined) row.lateFeeRatePerDay = 0;
    if (row.extraChallanLateFee === undefined) row.extraChallanLateFee = 0;
    if (row.hostelLateFee === undefined) row.hostelLateFee = 0;
    return row;
  }

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
      throw new NotFoundException(
        `StaffIDCardTemplate with id ${id} not found`,
      );
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

  async updateStudentIDCardTemplate(
    id: number,
    data: UpdateStudentIDCardTemplateDto,
  ) {
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
    return this.getInstituteSettingsRowRaw();
  }

  // Update institute settings (or create if doesn't exist)
  async updateInstituteSettings(data: UpdateInstituteSettingsDto) {
    const columns = await this.getInstituteSettingsColumns();
    const existing = await this.getInstituteSettingsRowRaw();

    const filteredEntries = Object.entries(data || {}).filter(
      ([key, value]) => value !== undefined && columns.has(key),
    );

    if (existing) {
      if (filteredEntries.length > 0) {
        const setClause = filteredEntries
          .map(([key]) => `\`${key}\` = ?`)
          .join(', ');
        const values = filteredEntries.map(([, value]) => value);

        await this.prisma.$executeRawUnsafe(
          `UPDATE institutesettings SET ${setClause} WHERE id = ?`,
          ...values,
          existing.id,
        );
      }
      return this.getInstituteSettingsRowRaw();
    }

    const createData: Record<string, any> = {};
    if (columns.has('instituteName')) createData.instituteName = 'My Institute';
    if (columns.has('createdAt')) createData.createdAt = new Date();
    if (columns.has('updatedAt')) createData.updatedAt = new Date();
    for (const [key, value] of filteredEntries) {
      createData[key] = value;
    }

    const createEntries = Object.entries(createData);
    if (createEntries.length > 0) {
      const colClause = createEntries.map(([key]) => `\`${key}\``).join(', ');
      const placeholders = createEntries.map(() => '?').join(', ');
      const values = createEntries.map(([, value]) => value);

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO institutesettings (${colClause}) VALUES (${placeholders})`,
        ...values,
      );
    } else {
      await this.prisma.$executeRawUnsafe(`INSERT INTO institutesettings () VALUES ()`);
    }

    return this.getInstituteSettingsRowRaw();
  }
}
