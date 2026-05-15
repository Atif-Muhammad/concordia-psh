import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { InstallmentService } from './installment.service';
import { ChallanService } from './challan.service';
import { PaymentService } from './payment.service';
import { MigrationService } from './migration.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstallmentDto } from './dtos/create-installment.dto';
import { UpdateInstallmentDto } from './dtos/update-installment.dto';
import { GenerateChallanDto } from './dtos/generate-challan.dto';
import { BulkGenerateDto } from './dtos/bulk-generate.dto';
import { ExtraChallanDto } from './dtos/extra-challan.dto';
import { RecordPaymentDto } from './dtos/record-payment.dto';
import { ExtraChallanService } from './extra-challan.service';

/**
 * FeeController — new REST API for the redesigned fee management system.
 *
 * All routes are prefixed with `/fee`.
 *
 * Requirements: 1.5, 14.5, 18.1, 20.1, 20.2, 20.3, 20.4
 */
@Controller('fee')
export class FeeController {
  constructor(
    private readonly installmentService: InstallmentService,
    private readonly challanService: ChallanService,
    private readonly paymentService: PaymentService,
    private readonly migrationService: MigrationService,
    private readonly prisma: PrismaService,
    private readonly extraChallanService: ExtraChallanService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Installments
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /fee/installments?studentId=
   * Returns all installments for a student with live late fee injected.
   * Requirements: 1.5, 20.4
   */
  @Get('installments')
  async getStudentInstallments(@Query('studentId') studentId: string) {
    return this.installmentService.getStudentInstallments(Number(studentId));
  }

  /**
   * GET /fee/installments/:id
   * Returns a single installment with live late fee injected.
   * Requirements: 1.5, 20.4
   */
  @Get('installments/:id')
  async getInstallment(@Param('id', ParseIntPipe) id: number) {
    return this.installmentService.getInstallment(id);
  }

  /**
   * PATCH /fee/installments/:id
   * Updates allowed fields on an installment and triggers cascade.
   * Requirements: 7.1, 11.2, 11.3, 17.4
   */
  @Patch('installments/:id')
  async updateInstallment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInstallmentDto,
  ) {
    return this.installmentService.updateInstallment(id, dto);
  }

  /**
   * POST /fee/installments/bulk-create
   * Creates N installments for a student at admission.
   * Requirements: 2.1, 2.2, 2.3
   */
  @Post('installments/bulk-create')
  async createInstallmentsForStudent(@Body() dto: CreateInstallmentDto) {
    const dueDates = dto.dueDates.map((d) => new Date(d));
    return this.installmentService.createInstallmentsForStudent(
      dto.studentId,
      dto.numberOfInstallments,
      dto.basePayable,
      dueDates,
      dto.sessionId ?? null,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Challans
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * POST /fee/challans/generate
   * Generates a challan snapshot for a single installment.
   * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 10.1, 20.3
   */
  @Post('challans/generate')
  async generateChallan(@Body() dto: GenerateChallanDto) {
    return this.challanService.generateChallan(
      dto.installmentId,
      new Date(dto.dueDate),
    );
  }

  /**
   * POST /fee/challans/bulk-generate
   * Generates challans in bulk for all students matching the given filters.
   * Requirements: 12.1, 12.2, 12.3
   */
  @Post('challans/bulk-generate')
  async bulkGenerateChallans(@Body() dto: BulkGenerateDto) {
    return this.challanService.bulkGenerateChallans(
      {
        programId: dto.programId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        sessionId: dto.sessionId,
        studentIds: dto.studentIds,
        targetInstallmentNumber: dto.targetInstallmentNumber,
        targetMonth: dto.targetMonth,
        targetYear: dto.targetYear,
      },
      dto.dueDate ? new Date(dto.dueDate) : new Date(),
    );
  }

  /**
   * POST /fee/challans/extra
   * Creates a standalone EXTRA-type challan for a student.
   * Requirements: 8.1, 8.3, 8.4
   */
  @Post('challans/extra')
  async generateExtraChallan(@Body() dto: ExtraChallanDto) {
    return this.extraChallanService.createExtraChallan(dto);
  }

  /**
   * POST /fee/challans/bulk-generate-extra
   * Generates EXTRA challans in bulk for students matching filters.
   */
  @Post('challans/bulk-generate-extra')
  async bulkGenerateExtraChallans(@Body() dto: ExtraChallanDto) {
    return this.extraChallanService.createExtraChallan(dto);
  }

  @Get('challans/extra/list')
  async getExtraChallans(@Query() query: any) {
    return this.extraChallanService.getExtraChallans(query);
  }

  @Get('challans/extra/:id/print')
  @Header('Content-Type', 'text/html')
  async printExtraChallan(@Param('id', ParseIntPipe) id: number) {
    return this.extraChallanService.getExtraChallanHtml(id);
  }

  @Patch('challans/extra/:id')
  async updateExtraChallan(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.extraChallanService.updateExtraChallan(id, dto);
  }

  @Delete('challans/extra/:id')
  async deleteExtraChallan(@Param('id', ParseIntPipe) id: number) {
    return this.extraChallanService.deleteExtraChallan(id);
  }

  @Post('challans/extra/:id/pay')
  async payExtraChallan(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { amount: number; paymentMode: string; paymentDate: string; remarks?: string },
  ) {
    return this.extraChallanService.recordPayment(
      id,
      body.amount,
      body.paymentMode,
      new Date(body.paymentDate),
      body.remarks,
    );
  }

  /**
   * GET /fee/challans/:id
   * Returns a single challan with all snapshot fields.
   * Requirements: 10.1, 10.2, 20.2
   */
  @Get('challans/:id')
  async getChallan(@Param('id', ParseIntPipe) id: number) {
    const challan = await this.prisma.feeChallanV2.findUnique({
      where: { id },
      include: {
        installment: {
          select: {
            id: true,
            studentId: true,
            installmentNumber: true,
            month: true,
            dueDate: true,
            status: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    return challan;
  }

  /**
   * PATCH /fee/challans/:id/void
   * Voids a challan and resets the linked installment's challanGenerated flag.
   * Requirements: 20.5
   */
  @Patch('challans/:id/void')
  async voidChallan(@Param('id', ParseIntPipe) id: number) {
    return this.challanService.voidChallan(id);
  }

  /**
   * GET /fee/challans/:id/print
   * Returns the rendered HTML for printing a challan.
   * Requirements: 10.3, 16.1, 16.2, 16.4, 16.5
   */
  @Get('challans/:id/print')
  @Header('Content-Type', 'text/html')
  async printChallan(
    @Param('id', ParseIntPipe) id: number,
    @Query('templateId') templateId?: string,
  ) {
    return this.challanService.getChallanHtml(
      id,
      templateId ? Number(templateId) : undefined,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Payments
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * POST /fee/payments
   * Records a payment against a feeChallanV2 using oldest-first attribution.
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 11.1
   */
  @Post('payments')
  async recordPayment(@Body() dto: RecordPaymentDto) {
    return this.paymentService.recordPayment(
      dto.challanId,
      dto.amount,
      dto.paymentMode,
      new Date(dto.paidDate),
      dto.remarks,
    );
  }

  /**
   * GET /fee/payments?studentId=
   * Returns the full payment history for a student.
   * Requirements: 13.4
   */
  @Get('payments')
  async getStudentPaymentHistory(@Query('studentId') studentId: string) {
    return this.paymentService.getStudentPaymentHistory(Number(studentId));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Reports
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /fee/reports/summary?sessionId=
   * Returns total paidAmount and pendingAmount aggregated from FeeInstallment.
   * Requirements: 14.1, 14.5
   */
  @Get('reports/summary')
  async getReportSummary(
    @Query('sessionId') sessionId?: string,
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const sessionFilter = sessionId ? { sessionId: Number(sessionId) } : {};
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    const hasDateFilter = Object.keys(dateFilter).length > 0;
    const paymentDateFilter = hasDateFilter ? { lastPaymentDate: dateFilter } : {};
    const normalizedType = (type || 'all').toLowerCase();
    const includeInstallment = normalizedType === 'all' || normalizedType === 'installment';
    const includeExtra = normalizedType === 'all' || normalizedType === 'extra';
    const includeHostel = normalizedType === 'all' || normalizedType === 'hostel';

    // ── Installment revenue (directly-paid only, no double-counting of SETTLED) ──
    let regularRevenue = 0;
    let installmentOutstanding = 0;
    if (includeInstallment) {
      if (hasDateFilter) {
        const regularRevenueAggr = await this.prisma.challanPayment.aggregate({
          where: {
            paymentDate: dateFilter,
            challan: { installment: { ...sessionFilter, settled: null } },
          },
          _sum: { amount: true },
        });
        regularRevenue = Number(regularRevenueAggr._sum.amount ?? 0);
      } else {
        const regularRevenueAggr = await this.prisma.feeInstallment.aggregate({
          where: { ...sessionFilter, ...paymentDateFilter, settled: null },
          _sum: { paidAmount: true },
        });
        regularRevenue = Number(regularRevenueAggr._sum.paidAmount ?? 0);
      }

      const outstandingAggr = await this.prisma.feeInstallment.aggregate({
        where: {
          ...sessionFilter,
          challanGenerated: true,
          pendingAmount: { gt: 0 },
          status: { notIn: ['SUPERSEDED', 'VOID', 'SETTLED'] },
        },
        _sum: { pendingAmount: true },
      });
      installmentOutstanding = Number(outstandingAggr._sum.pendingAmount ?? 0);
    }

    // ── Extra challan revenue ──────────────────────────────────────────────────
    let extraRevenue = 0;
    let extraOutstanding = 0;
    if (includeExtra) {
      if (hasDateFilter) {
        const extraRevenueAggr = await this.prisma.extraChallanPayment.aggregate({
          where: { paymentDate: dateFilter },
          _sum: { amount: true },
        });
        extraRevenue = Number(extraRevenueAggr._sum.amount ?? 0);
      } else {
        const extraRevenueAggr = await this.prisma.extraChallan.aggregate({
          where: { paidAmount: { gt: 0 } },
          _sum: { paidAmount: true },
        });
        extraRevenue = Number(extraRevenueAggr._sum.paidAmount ?? 0);
      }

      const extraAllAggr = await this.prisma.extraChallan.aggregate({
        where: { status: { notIn: ['VOID', 'PAID', 'SUPERSEDED', 'SETTLED'] } },
        _sum: { totalAmount: true, paidAmount: true },
      });
      extraOutstanding = Math.max(0, Number(extraAllAggr._sum.totalAmount ?? 0) - Number(extraAllAggr._sum.paidAmount ?? 0));
    }

    // ── Hostel revenue (always included, not filterable by type yet) ──────────
    let hostelRevenue = 0;
    let hostelOutstanding = 0;
    if (includeHostel) {
      if (hasDateFilter) {
        const hostelRevenueAggr = await this.prisma.hostelChallanPayment.aggregate({
          where: { paymentDate: dateFilter },
          _sum: { amount: true },
        });
        hostelRevenue = Number(hostelRevenueAggr._sum.amount ?? 0);
      } else {
        const hostelRevenueAggr = await this.prisma.hostelChallan.aggregate({
          where: { paidAmount: { gt: 0 } },
          _sum: { paidAmount: true },
        });
        hostelRevenue = Number(hostelRevenueAggr._sum.paidAmount ?? 0);
      }

      const hostelAllAggr = await this.prisma.hostelChallan.aggregate({
        where: { status: { notIn: ['VOID', 'PAID', 'SUPERSEDED', 'SETTLED'] } },
        _sum: { totalAmount: true, paidAmount: true },
      });
      hostelOutstanding = Math.max(0, Number(hostelAllAggr._sum.totalAmount ?? 0) - Number(hostelAllAggr._sum.paidAmount ?? 0));
    }

    return {
      totalRevenue: regularRevenue + extraRevenue + hostelRevenue,
      regularRevenue,
      extraRevenue,
      hostelRevenue,
      totalOutstanding: installmentOutstanding + extraOutstanding + hostelOutstanding,
      installmentOutstanding,
      extraOutstanding,
      hostelOutstanding,
    };
  }

  /**
   * GET /fee/reports/revenue-over-time?sessionId=
   * Groups ChallanPayment records by paymentDate month.
   * Always returns a full 24-month timeline (zero-filled) so charts look meaningful.
   * Requirements: 14.2, 14.5
   */
  @Get('reports/revenue-over-time')
  async getRevenueOverTime(@Query('sessionId') sessionId?: string) {
    const where = sessionId
      ? { challan: { installment: { sessionId: Number(sessionId) } } }
      : {};

    const payments = await this.prisma.challanPayment.findMany({
      where,
      select: { amount: true, paymentDate: true },
      orderBy: { paymentDate: 'asc' },
    });

    const extraPayments = await this.prisma.extraChallanPayment.findMany({
      select: { amount: true, paymentDate: true },
      orderBy: { paymentDate: 'asc' },
    });

    // Group installment and extra payments separately
    const instGrouped: Record<string, number> = {};
    const extraGrouped: Record<string, number> = {};

    for (const p of payments) {
      const d = new Date(p.paymentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      instGrouped[key] = (instGrouped[key] ?? 0) + Number(p.amount);
    }
    for (const p of extraPayments) {
      const d = new Date(p.paymentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      extraGrouped[key] = (extraGrouped[key] ?? 0) + Number(p.amount);
    }

    // Build a full 24-month timeline ending this month, zero-filled
    const months: string[] = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    return months.map((key) => ({
      name: key,
      installment: instGrouped[key] ?? 0,
      extra: extraGrouped[key] ?? 0,
      value: (instGrouped[key] ?? 0) + (extraGrouped[key] ?? 0),
    }));
  }

  /**
   * GET /fee/reports/class-stats?sessionId=
   * Groups FeeInstallment by classId showing collected vs outstanding.
   * Requirements: 14.3, 14.5
   */
  @Get('reports/class-stats')
  async getClassStats(@Query('sessionId') sessionId?: string) {
    const where = sessionId ? { sessionId: Number(sessionId) } : {};

    // Fetch all classes for name lookup
    const allClasses = await this.prisma.class.findMany({
      select: { id: true, name: true },
    });
    const classNameMap = new Map(allClasses.map(c => [c.id, c.name]));

    // 1. Fetch standard installments
    const installments = await this.prisma.feeInstallment.findMany({
      where,
      select: {
        classId: true,
        paidAmount: true,
        pendingAmount: true,
        settled: true,
        challanGenerated: true,
        status: true,
      },
    });

    // 2. Fetch extra challans
    const extraChallans = await this.prisma.extraChallan.findMany({
      include: {
        student: { select: { classId: true } },
      },
    });

    // Group by classId
    const grouped: Record<number, { classId: number; collected: number; outstanding: number }> = {};

    for (const inst of installments) {
      const cid = inst.classId;
      if (!grouped[cid]) grouped[cid] = { classId: cid, collected: 0, outstanding: 0 };
      if (inst.settled === null) {
        grouped[cid].collected += Number(inst.paidAmount);
      }
      if (
        inst.challanGenerated &&
        Number(inst.pendingAmount) > 0 &&
        !['SUPERSEDED', 'VOID', 'SETTLED'].includes(inst.status as string)
      ) {
        grouped[cid].outstanding += Number(inst.pendingAmount);
      }
    }

    for (const ec of extraChallans) {
      const cid = ec.student.classId;
      if (!grouped[cid]) grouped[cid] = { classId: cid, collected: 0, outstanding: 0 };
      grouped[cid].collected += Number(ec.paidAmount);
      grouped[cid].outstanding += Math.max(0, Number(ec.totalAmount) - Number(ec.paidAmount));
    }

    return Object.values(grouped)
      .map(g => ({
        classId: g.classId,
        name: classNameMap.get(g.classId) ?? `Class ${g.classId}`,
        collected: g.collected,
        outstanding: g.outstanding,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Settings
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /fee/settings
   * Returns the institute-level late fee rate per day.
   * Requirements: 18.1
   */
  @Get('settings')
  async getSettings() {
    const settings = await this.prisma.instituteSettings.findFirst({
      select: { lateFeeRatePerDay: true, extraChallanLateFee: true },
    });

    return {
      lateFeeRatePerDay: settings?.lateFeeRatePerDay
        ? Number(settings.lateFeeRatePerDay)
        : 0,
      extraChallanLateFee: settings?.extraChallanLateFee
        ? Number(settings.extraChallanLateFee)
        : 0,
    };
  }

  /**
   * PATCH /fee/settings
   * Updates global settings in InstituteSettings.
   * Requirements: 18.1, 18.4
   */
  @Patch('settings')
  async updateSettings(@Body() body: { lateFeeRatePerDay?: number, extraChallanLateFee?: number }) {
    // Update the first (singleton) InstituteSettings record.
    const settings = await this.prisma.instituteSettings.findFirst();
    if (!settings) {
      return await this.prisma.instituteSettings.create({
        data: {
          instituteName: 'Default',
          lateFeeRatePerDay: body.lateFeeRatePerDay ?? 0,
          extraChallanLateFee: body.extraChallanLateFee ?? 0,
        },
      });
    }

    return await this.prisma.instituteSettings.update({
      where: { id: settings.id },
      data: {
        lateFeeRatePerDay: body.lateFeeRatePerDay !== undefined ? body.lateFeeRatePerDay : undefined,
        extraChallanLateFee: body.extraChallanLateFee !== undefined ? body.extraChallanLateFee : undefined,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Migration
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * POST /fee/migration/run
   * Runs the one-time data migration from legacy schema to new schema.
   * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
   */
  @Post('migration/run')
  async runMigration() {
    return this.migrationService.migrate();
  }

  /**
   * GET /fee/migration/stats
   * Returns counts of old vs new records for monitoring migration progress.
   */
  @Get('migration/stats')
  async getMigrationStats() {
    return this.migrationService.getMigrationStats();
  }
}
