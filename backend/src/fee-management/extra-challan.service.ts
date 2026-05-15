import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExtraChallanDto } from './dtos/extra-challan.dto';
import { LateFeeService } from './late-fee.service';

@Injectable()
export class ExtraChallanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lateFeeService: LateFeeService,
  ) {}

  /**
   * Create a new standalone extra challan using the dedicated extra_challan table.
   * Supports both single (studentId) and bulk (studentIds) generation.
   */
  async createExtraChallan(dto: ExtraChallanDto) {
    const { studentId, studentIds, ...rest } = dto;

    if (studentIds && studentIds.length > 0) {
      const results: any[] = [];
      for (const sId of studentIds) {
        try {
          const res = await this.createSingleExtraChallan({ ...rest, studentId: sId });
          results.push({ 
            studentId: sId, 
            id: res.id,
            status: res.status === 'ALREADY_EXISTS' ? 'ALREADY_EXISTS' : 'CREATED', 
            challanNumber: res.challanNumber,
            studentName: res.studentName,
            reason: res.status === 'ALREADY_EXISTS' ? 'Already generated for this month/heads' : undefined
          });
        } catch (err) {
          results.push({ studentId: sId, status: 'FAILED', error: err.message });
        }
      }
      return results;
    }

    if (!studentId) throw new BadRequestException('studentId or studentIds must be provided');
    return await this.createSingleExtraChallan({ ...rest, studentId });
  }

  /**
   * Internal helper for single extra challan generation.
   */
  private async createSingleExtraChallan(dto: any) {
    const { studentId, feeHeadIds, heads, dueDate, remarks } = dto;

    // 1. Verify student exists
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException(`Student #${studentId} not found`);

    // 2. Aggregate fee heads (predefined + custom)
    let finalHeads: { headName: string; amount: number }[] = [];
    
    // Fetch predefined heads by ID
    if (feeHeadIds && feeHeadIds.length > 0) {
      const predefined = await this.prisma.feeHead.findMany({
        where: { id: { in: feeHeadIds } },
      });
      finalHeads = predefined.map(h => ({
        headName: h.name,
        amount: Number(h.amount),
      }));
    }

    // Add ad-hoc custom heads
    if (heads && heads.length > 0) {
      finalHeads = [...finalHeads, ...heads];
    }

    if (finalHeads.length === 0) {
      throw new BadRequestException('No fee heads provided for extra challan');
    }

    // 3. Robust Idempotency Check (Logical Duplicates within the same month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const existingChallans = await this.prisma.extraChallan.findMany({
      where: {
        studentId,
        generatedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: { not: 'VOID' },
      },
      include: { heads: true },
    });

    for (const existing of existingChallans) {
      // Compare heads (set equality)
      const existingHeadNames = existing.heads.map(h => h.headName).sort();
      const incomingHeadNames = finalHeads.map(h => h.headName).sort();

      if (JSON.stringify(existingHeadNames) === JSON.stringify(incomingHeadNames)) {
        // Exactly same heads for the same month - likely a duplicate request
        return { 
          ...existing, 
          status: 'ALREADY_EXISTS', 
          challanNumber: existing.challanNumber,
          studentName: `${student.fName} ${student.lName || ''}`.trim() 
        };
      }
    }

    const totalAmount = finalHeads.reduce((sum, h) => sum + h.amount, 0);

    if (totalAmount <= 0) {
      throw new BadRequestException('Total amount for extra challan must be greater than zero');
    }

    // 4. Create Challan with snapshot of late fee rate
    const settings = await this.prisma.instituteSettings.findFirst({
      select: { extraChallanLateFee: true },
    });
    const ratePerDay = settings?.extraChallanLateFee ? Number(settings.extraChallanLateFee) : 0;

    // Generate 8 random digits for challan number
    const challanNumber = Math.floor(10000000 + Math.random() * 90000000).toString();

    const challan = await this.prisma.extraChallan.create({
      data: {
        challanNumber,
        studentId,
        dueDate: new Date(dueDate),
        remarks,
        totalAmount,
        discount: Number(dto.discount || 0),
        lateFeeRatePerDay: ratePerDay,
        heads: {
          create: finalHeads.map(h => ({
            headName: h.headName,
            amount: h.amount,
          })),
        },
      },
      include: { heads: true, student: true },
    });

    // 5. Sync late fee immediately (in case dueDate is in the past)
    const synced = await this.syncLateFee(challan.id, ratePerDay);

    if (!synced) {
      return {
        ...challan,
        studentName: `${student.fName} ${student.lName || ''}`.trim()
      };
    }

    return {
      ...synced,
      studentName: `${synced.student.fName} ${synced.student.lName || ''}`.trim(),
    };
  }

  /**
   * Sync late fee for a single extra challan
   */
  async syncLateFee(id: number, forcedRate?: number) {
    const challan = await this.prisma.extraChallan.findUnique({
      where: { id },
      include: { heads: true, student: true },
    });

    if (!challan || ['PAID', 'VOID', 'SETTLED'].includes(challan.status)) {
      return challan;
    }

    let ratePerDay = forcedRate;
    if (ratePerDay === undefined) {
      const settings = await this.prisma.instituteSettings.findFirst({
        select: { extraChallanLateFee: true },
      });
      ratePerDay = settings?.extraChallanLateFee ? Number(settings.extraChallanLateFee) : 0;
    }

    const liveLateFee = this.lateFeeService.calculate(challan.dueDate, ratePerDay);
    const currentLateFee = Number(challan.lateFeeFine);
    const isPastDue = new Date() > challan.dueDate;

    let needsUpdate = false;
    const updateData: any = {};

    if (liveLateFee !== currentLateFee) {
      updateData.lateFeeFine = liveLateFee;
      needsUpdate = true;
    }

    if (isPastDue && challan.status === 'PENDING') {
      updateData.status = 'OVERDUE';
      needsUpdate = true;
    }

    if (needsUpdate) {
      // Recalculate total if heads changed or late fee changed
      const headsSum = challan.heads.reduce((s, h) => s + Number(h.amount), 0);
      const discount = Number(challan.discount || 0);
      updateData.totalAmount = headsSum + (updateData.lateFeeFine ?? currentLateFee) - discount;
      updateData.lateFeeRatePerDay = ratePerDay;

      return await this.prisma.extraChallan.update({
        where: { id },
        data: updateData,
        include: { heads: true, student: true },
      });
    }

    return challan;
  }

  /**
   * Fetch extra challans with search and status filters.
   */
  async getExtraChallans(query: any) {
    const { studentId, status, search } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const where: any = {};
    if (studentId) where.studentId = Number(studentId);
    if (status && status !== 'all') where.status = status.toUpperCase();

    if (search) {
      const trimmed = search.trim();
      where.OR = [
        { challanNumber: { contains: trimmed } },
        { student: { fName: { contains: trimmed } } },
        { student: { lName: { contains: trimmed } } },
        { student: { rollNumber: { contains: trimmed } } },
      ];
    }

    const total = await this.prisma.extraChallan.count({ where });
    const lastPage = Math.ceil(total / limit);

    const data = await this.prisma.extraChallan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        student: {
          include: {
            class: { include: { program: true } },
            section: true,
            program: true,
          },
        },
        heads: true,
        payments: true,
      },
      orderBy: { generatedAt: 'desc' },
    });

    return {
      data,
      meta: { total, page, lastPage, limit },
    };
  }

  /**
   * Delete an extra challan if it hasn't been paid yet.
   */
  async deleteExtraChallan(id: number) {
    const challan = await this.prisma.extraChallan.findUnique({
      where: { id },
    });

    if (!challan) throw new NotFoundException('Extra challan not found');
    if (challan.status === 'PAID') throw new BadRequestException('Cannot delete a paid challan');

    return await this.prisma.extraChallan.delete({
      where: { id },
    });
  }

  /**
   * Update an extra challan's details and heads.
   */
  async updateExtraChallan(id: number, dto: any) {
    const { heads, dueDate, remarks, status } = dto;

    const challan = await this.prisma.extraChallan.findUnique({
      where: { id },
      include: { heads: true },
    });

    if (!challan) throw new NotFoundException('Extra challan not found');
    if (challan.status === 'PAID') throw new BadRequestException('Cannot edit a paid challan');

    return await this.prisma.$transaction(async (tx) => {
      const data: any = {};
      if (dueDate) data.dueDate = new Date(dueDate);
      if (remarks !== undefined) data.remarks = remarks;
      if (status) data.status = status;
      if (dto.discount !== undefined) data.discount = Number(dto.discount);

      if (heads && Array.isArray(heads)) {
        // Refresh heads snapshot
        await tx.extraChallanHead.deleteMany({ where: { extraChallanId: id } });
        
        if (heads.length > 0) {
          await tx.extraChallanHead.createMany({
            data: heads.map(h => ({
              extraChallanId: id,
              headName: h.headName || h.name,
              amount: Number(h.amount),
            })),
          });
        }
      }

      // Sync late fee and update total
      return await tx.extraChallan.update({
        where: { id },
        data,
        include: { heads: true, student: true },
      });
    }).then(updated => this.syncLateFee(updated.id));
  }

  /**
   * Record a payment against an ExtraChallan.
   */
  async recordPayment(id: number, amount: number, paymentMode: string, paymentDate: Date, remarks?: string) {
    const challan = await this.prisma.extraChallan.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!challan) throw new NotFoundException('Extra challan not found');
    if (challan.status === 'PAID') throw new BadRequestException('Challan is already fully paid');
    if (challan.status === 'VOID') throw new BadRequestException('Cannot pay a voided challan');

    const totalDue = Number(challan.totalAmount);
    const currentPaid = Number(challan.paidAmount);
    const newPaidAmount = currentPaid + amount;

    const isFullyPaid = newPaidAmount >= totalDue - 0.01;
    const newStatus = isFullyPaid ? 'PAID' : 'PARTIAL';

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create payment record
      await tx.extraChallanPayment.create({
        data: {
          extraChallanId: id,
          amount,
          paymentDate: new Date(paymentDate),
          paymentMode,
          remarks
        }
      });

      // 2. Update challan
      return await tx.extraChallan.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus as any
        },
        include: { heads: true, student: true, payments: true }
      });
    });
  }

  /**
   * Render an ExtraChallan into an HTML string for printing.
   */
  async getExtraChallanHtml(id: number): Promise<string> {
    const challan = await this.prisma.extraChallan.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: { include: { program: true } },
            section: true,
            program: true,
          },
        },
        heads: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!challan) throw new NotFoundException(`ExtraChallan #${id} not found`);

    // Fetch EXTRA type template, or fall back to default
    let template = await this.prisma.feeChallanTemplate.findFirst({
      where: { type: 'EXTRA', isDefault: true },
    });
    
    if (!template) {
      template = await this.prisma.feeChallanTemplate.findFirst({
        where: { isDefault: true },
      });
    }

    if (!template) throw new BadRequestException('No suitable fee challan template found. Please configure an EXTRA or default template.');

    const s = challan.student;
    const programName = s.class?.program?.name || s.program?.name || '';
    const className = s.class?.name || '';
    const sectionName = s.section?.name || '';
    const fullClassPath = [programName, className, sectionName].filter(Boolean).join(' / ');

    let html = template.htmlContent;

    // Inject print styles
    html = html.replace('</head>', '<style>body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }</style></head>');

    // Basic replacements
    html = html.replace(/\{\{challanNumber\}\}/g, challan.challanNumber);
    html = html.replace(/\{\{issueDate\}\}/g, this.formatDate(challan.generatedAt));
    html = html.replace(/\{\{dueDate\}\}/g, this.formatDate(challan.dueDate));
    html = html.replace(/\{\{studentName\}\}/g, `${s.fName} ${s.lName || ''}`.trim());
    html = html.replace(/\{\{fatherName\}\}/g, s.fatherOrguardian || '');
    html = html.replace(/\{\{class\}\}/g, fullClassPath);
    html = html.replace(/\{\{rollNo\}\}/g, s.rollNumber || '');
    const settings = await this.prisma.instituteSettings.findFirst({ 
      select: { extraChallanLateFee: true } 
    });
    const lateFeeRate = Number(settings?.extraChallanLateFee ?? 0);

    // Remove Month / Installment row
    // Since the template uses various structures, we look for <tr> containing "Month / Installment"
    html = html.replace(/<tr[^>]*>\s*<td[^>]*>Month \/ Installment<\/td>[\s\S]*?<\/tr>/gi, '');
    // Also handle templates where it might be in different labels
    html = html.replace(/Month \/ Installment/g, ''); 
    html = html.replace(/\{\{month\}\}/g, '');
    html = html.replace(/\{\{installmentNo\}\}/g, '');

    // Replace hardcoded 150 with dynamic late fee rate
    html = html.replace(/Rs\.\s*150\s*Per\s*Day/gi, `Rs. ${lateFeeRate} Per Day`);
    // Also check for 150 without Rs prefix just in case
    html = html.replace(/150\s*Per\s*Day/gi, `${lateFeeRate} Per Day`);

    // Fee table
    const headsTotal = challan.heads.reduce((sum, h) => sum + Number(h.amount || 0), 0);
    const lateFeeFine = Number(challan.lateFeeFine || 0);
    const discount = Number(challan.discount || 0);
    const computedTotalDue = Math.max(0, headsTotal + lateFeeFine - Math.abs(discount));
    const totalDue = Math.max(Number(challan.totalAmount || 0), computedTotalDue);
    const paidAmount = Number(challan.paidAmount || 0);
    const remainingBalance = Math.max(0, totalDue - paidAmount);

    const feeRows = challan.heads.map(h =>
      `<tr><td>${h.headName}</td><td>${Number(h.amount).toLocaleString()}</td></tr>`
    );
    if (lateFeeFine > 0) {
      feeRows.push(`<tr><td>Late Fee (Overdue)</td><td>${lateFeeFine.toLocaleString()}</td></tr>`);
    }
    const feeHeadsRows = feeRows.join('\n');

    html = html.replace(/\{\{Tuition Fee\}\}/g, '0');
    html = html.replace(/\{\{feeHeadsRows\}\}/g, feeHeadsRows);
    html = html.replace(/\{\{arrearsRows\}\}/g, '');
    html = html.replace(/\{\{arrears\}\}/g, '0');
    html = html.replace(/\{\{discount\}\}/g, discount.toLocaleString());
    html = html.replace(/\{\{lateFee\}\}/g, lateFeeFine.toLocaleString());
    html = html.replace(/\{\{totalPayable\}\}/g, remainingBalance.toLocaleString());
    html = html.replace(/\{\{totalInWords\}\}/g, `<strong>${remainingBalance.toLocaleString()} Rupees Only</strong>`);

    const paidDisplay = paidAmount > 0 ? `- ${paidAmount.toLocaleString()}` : '0';
    const paidRowHtml = `
      <tr style="color: #166534; background-color: #f0fdf4; font-weight: 600; font-size: 11px;">
        <td>Paid Amount / Advance Credits</td>
        <td>${paidDisplay}</td>
      </tr>
      <tr style="font-weight: 700; border-top: 1px solid #e2e8f0;">
        <td>Remaining Balance</td>
        <td>${remainingBalance.toLocaleString()}</td>
      </tr>
    `;
    html = html.replace(/\{\{paidRow\}\}/g, paidRowHtml);

    const isFullyPaid = challan.status === 'PAID' || remainingBalance <= 0;
    if (isFullyPaid) {
      const latestPayment = challan.payments?.[0];
      const paidRemarksStyle = 'background-color: #dcfce7; color: #14532d; font-weight: bold;';
      const remarks = latestPayment?.remarks || 'FULLY PAID / SETTLED';
      const paidAt = latestPayment?.paymentDate ? this.formatDate(latestPayment.paymentDate) : this.formatDate(challan.updatedAt || challan.generatedAt);
      const paidRowsHtml = `
        <tr class="paid-at-row"><td style="${paidRemarksStyle}">Paid At</td><td style="${paidRemarksStyle}">${paidAt}</td></tr>
        <tr class="paid-remarks-row">
          <td style="${paidRemarksStyle}; vertical-align: top;">Remarks</td>
          <td style="${paidRemarksStyle}; white-space: normal; text-align: left; line-height: 1.35;">${remarks}</td>
        </tr>
      `;
      const hideTotalRowStyle = '<style>.total-row { display: none !important; }</style>';
      html = html.includes('</head>') ? html.replace('</head>', `${hideTotalRowStyle}</head>`) : hideTotalRowStyle + html;
      html = html.replace(/<tr class="late-fee-row">[\s\S]*?<\/tr>/gi, paidRowsHtml);
      html = html.replace(
        /<div class="signatures">[\s\S]*?<div class="sig-label">Depositor Signature<\/div>\s*<\/div>\s*<\/div>/gi,
        `<div class="paid-system-note" style="padding: 8px 10px 5px 10px; margin-top: 4px; font-size: 8px; line-height: 1.35; color: #475569; font-style: italic;">* This paid challan is system generated and does not require bank/account officer or depositor signatures.</div>`
      );
    }

    // History (Empty for extra challans)
    html = html.replace(/\{\{paymentHistoryMonths\}\}/g, '');
    html = html.replace(/\{\{paymentHistoryTotals\}\}/g, '');
    html = html.replace(/\{\{paymentHistoryPaid\}\}/g, '');
    html = html.replace(/\{\{paymentDetailsRow\}\}/g, '');

    return html;
  }

  private formatDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
}
