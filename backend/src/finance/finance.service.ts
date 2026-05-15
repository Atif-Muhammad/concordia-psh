import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateClosingDto } from './dto/create-closing.dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  private parseStartOfDay(dateStr: string) {
    const raw = String(dateStr || '').trim();
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      return new Date(y, mo - 1, d, 0, 0, 0, 0);
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) throw new BadRequestException('Invalid date');
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  private parseEndOfDay(dateStr: string) {
    const raw = String(dateStr || '').trim();
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      return new Date(y, mo - 1, d, 23, 59, 59, 999);
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) throw new BadRequestException('Invalid date');
    parsed.setHours(23, 59, 59, 999);
    return parsed;
  }

  private getClosingBounds(dateStr: string, type: string) {
    const base = this.parseStartOfDay(dateStr);
    const normalizedType = String(type || '').toLowerCase();
    if (normalizedType === 'daily') {
      const start = new Date(base);
      const end = new Date(base);
      end.setHours(23, 59, 59, 999);
      return { start, end, normalizedType };
    }
    if (normalizedType === 'monthly') {
      const start = new Date(base.getFullYear(), base.getMonth(), 1);
      const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end, normalizedType };
    }
    if (normalizedType === 'quarterly') {
      const q = Math.floor(base.getMonth() / 3);
      const start = new Date(base.getFullYear(), q * 3, 1);
      const end = new Date(base.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
      return { start, end, normalizedType };
    }
    throw new BadRequestException('type must be daily, monthly, or quarterly');
  }

  private async calculateClosingSnapshot(start: Date, end: Date) {
    const [incomes, expenses] = await Promise.all([
      this.getIncomes({ dateFrom: start.toISOString(), dateTo: end.toISOString() }),
      this.getExpenses({ dateFrom: start.toISOString(), dateTo: end.toISOString() }),
    ]);
    const totalIncome = incomes.reduce((sum, item: any) => sum + Number(item.amount || 0), 0);
    const totalExpense = expenses.reduce((sum, item: any) => sum + Number(item.amount || 0), 0);
    return { totalIncome, totalExpense, netBalance: totalIncome - totalExpense };
  }

  // ==================== INCOME ====================
  async createIncome(createIncomeDto: CreateIncomeDto) {
    return this.prisma.financeIncome.create({
      data: {
        ...createIncomeDto,
        date: new Date(createIncomeDto.date),
      },
    });
  }

  async getIncomes(filters?: {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
  }) {
    const category = filters?.category;
    const isAll = !category || category === 'all';
    const wantsTuition = isAll || category === 'Tuition Fee' || category === 'Fee';
    const wantsExtra = isAll || category === 'Extra Challan' || category === 'Extra Fee';
    const wantsHostel = isAll || category === 'Hostel Challan' || category === 'Hostel Fee';
    const isChallanCategory = wantsTuition || wantsExtra || wantsHostel;
    const where: any = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = this.parseStartOfDay(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.date.lte = this.parseEndOfDay(filters.dateTo);
      }
    }

    if (category && category !== 'all' && !isChallanCategory) {
      where.category = category;
    }

    // Fetch manual income records
    const manualIncomes = await this.prisma.financeIncome.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // Fetch challan-derived incomes based on requested category
    let feeChallans: any[] = [];
    if (isChallanCategory) {
      const challanWhere: any = {};

      if (filters?.dateFrom || filters?.dateTo) {
        challanWhere.paymentDate = {};
        if (filters.dateFrom) {
          challanWhere.paymentDate.gte = this.parseStartOfDay(filters.dateFrom);
        }
        if (filters.dateTo) {
          challanWhere.paymentDate.lte = this.parseEndOfDay(filters.dateTo);
        }
      }

      let installmentFees: any[] = [];
      if (wantsTuition) {
        const challans = await this.prisma.challanPayment.findMany({
          where: challanWhere,
          include: {
            challan: {
              include: {
                installment: {
                  include: { student: true },
                },
              },
            },
          },
          orderBy: { paymentDate: 'desc' },
        });

        installmentFees = challans.map((p) => {
          const student = p.challan.installment?.student;
          const billingMonth = p.paymentDate.toLocaleString('en-US', {
            month: 'short',
            year: 'numeric',
          });
          const studentName = student
            ? `${student.fName} ${student.lName || ''}`.trim()
            : 'Unknown';
          return {
            id: `fee-${p.id}`,
            date: p.paymentDate,
            category: 'Tuition Fee',
            description: `Tuition Fee: ${studentName}${student ? ` (${student.rollNumber})` : ''} - For ${billingMonth}`,
            amount: Number(p.amount),
            createdAt: p.createdAt,
            updatedAt: p.createdAt,
            source: 'fee-challan',
            sourceId: p.challanId,
            studentId: student?.id,
            billingMonth: billingMonth,
          };
        });
      }

      // Fetch Extra Challan Payments
      let extraFees: any[] = [];
      if (wantsExtra) {
        const extraPayments = await this.prisma.extraChallanPayment.findMany({
          where: {
            paymentDate: challanWhere.paymentDate,
          },
          include: {
            extraChallan: {
              include: { student: true },
            },
          },
          orderBy: { paymentDate: 'desc' },
        });

        extraFees = extraPayments.map((p) => {
          const student = p.extraChallan.student;
          const studentName = student ? `${student.fName} ${student.lName || ''}`.trim() : 'Unknown';
          return {
            id: `extra-${p.id}`,
            date: p.paymentDate,
            category: 'Extra Challan',
            description: `Extra Challan: ${studentName} (${student?.rollNumber || 'N/A'}) - ${p.remarks || 'Ad-hoc'}`,
            amount: Number(p.amount),
            createdAt: p.createdAt,
            updatedAt: p.createdAt,
            source: 'extra-challan',
            sourceId: p.extraChallanId,
            studentId: student?.id,
          };
        });
      }

      // Fetch Hostel Challan Payments
      let hostelFees: any[] = [];
      if (wantsHostel) {
        const hostelPayments = await this.prisma.hostelChallanPayment.findMany({
          where: {
            paymentDate: challanWhere.paymentDate,
          },
          include: {
            hostelChallan: {
              include: { student: true },
            },
          },
          orderBy: { paymentDate: 'desc' },
        });

        hostelFees = hostelPayments.map((p) => {
          const student = p.hostelChallan.student;
          const studentName = student ? `${student.fName} ${student.lName || ''}`.trim() : p.hostelChallan.hostelRegNumber;
          return {
            id: `hostel-${p.id}`,
            date: p.paymentDate,
            category: 'Hostel Challan',
            description: `Hostel Challan: ${studentName} - Month: ${p.hostelChallan.month}`,
            amount: Number(p.amount),
            createdAt: p.createdAt,
            updatedAt: p.createdAt,
            source: 'hostel-challan',
            sourceId: p.hostelChallanId,
            studentId: student?.id,
          };
        });
      }

      feeChallans = [...installmentFees, ...extraFees, ...hostelFees];
    }

    // Combine and sort by date
    const allIncomes = [...manualIncomes, ...feeChallans].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return allIncomes;
  }

  async updateIncome(id: number, updateIncomeDto: UpdateIncomeDto) {
    const data: any = { ...updateIncomeDto };
    if (updateIncomeDto.date) {
      data.date = new Date(updateIncomeDto.date);
    }

    return this.prisma.financeIncome.update({
      where: { id },
      data,
    });
  }

  async deleteIncome(id: number) {
    return this.prisma.financeIncome.delete({
      where: { id },
    });
  }

  // ==================== EXPENSE ====================
  async createExpense(createExpenseDto: CreateExpenseDto) {
    return this.prisma.financeExpense.create({
      data: {
        ...createExpenseDto,
        date: new Date(createExpenseDto.date),
      },
    });
  }

  async getExpenses(filters?: {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    subCategory?: string;
  }) {
    const where: any = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = this.parseStartOfDay(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.date.lte = this.parseEndOfDay(filters.dateTo);
      }
    }

    if (
      filters?.category &&
      filters.category !== 'all' &&
      filters.category !== 'Payroll'
    ) {
      where.category = filters.category;
    }
    if (filters?.subCategory && filters.subCategory !== 'all') {
      where.subCategory = filters.subCategory;
    }

    // Fetch manual expense records
    const manualExpenses = await this.prisma.financeExpense.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // If category is 'Payroll' or 'all', fetch paid payrolls
    let payrolls: any[] = [];
    if (
      !filters?.category ||
      filters.category === 'all' ||
      filters.category === 'Payroll'
    ) {
      const payrollPaymentWhere: any = {};

      if (filters?.dateFrom || filters?.dateTo) {
        payrollPaymentWhere.paidAt = {};
        if (filters.dateFrom) {
          payrollPaymentWhere.paidAt.gte = this.parseStartOfDay(filters.dateFrom);
        }
        if (filters.dateTo) {
          payrollPaymentWhere.paidAt.lte = this.parseEndOfDay(filters.dateTo);
        }
      }

      const payrollPayments = await this.prisma.payrollPayment.findMany({
        where: payrollPaymentWhere,
        include: {
          payroll: { include: { staff: true } },
        },
        orderBy: { paidAt: 'desc' },
      });

      payrolls = payrollPayments.map((payment) => {
        const staffName = payment.payroll.staff?.name || 'Unknown';
        const staffType = payment.payroll.staff?.isTeaching ? 'Teacher' : 'Staff';

        return {
          id: `payroll-payment-${payment.id}`,
          date: payment.paidAt,
          category: 'Payroll',
          subCategory: 'Salary Payment',
          description: `Salary: ${staffName} (${staffType}) - Month: ${payment.payroll.month}`,
          amount: Number(payment.amount),
          createdAt: payment.paidAt,
          updatedAt: payment.paidAt,
          source: 'payroll',
          sourceId: payment.payrollId,
        };
      });
    }

    // Fetch Hostel Expenses
    let hostelExpenses: any[] = [];
    if (
      !filters?.category ||
      filters.category === 'all' ||
      filters.category === 'Hostel'
    ) {
      const hostelWhere: any = {};
      if (filters?.dateFrom || filters?.dateTo) {
        hostelWhere.date = {};
        if (filters.dateFrom) hostelWhere.date.gte = this.parseStartOfDay(filters.dateFrom);
        if (filters.dateTo) hostelWhere.date.lte = this.parseEndOfDay(filters.dateTo);
      }
      const hostelRecs = await this.prisma.hostelExpense.findMany({
        where: hostelWhere,
        orderBy: { date: 'desc' },
      });
      hostelExpenses = hostelRecs.map((h) => ({
        id: `hostel-${h.id}`,
        date: h.date,
        category: 'Hostel',
        subCategory: h.expenseTitle || 'Hostel Utilities',
        description: `${h.expenseTitle} (${h.remarks || ''})`,
        amount: Number(h.amount),
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
        source: 'hostel',
        sourceId: h.id,
      }));
    }

    // Fetch Inventory Expenses (Purchases + Maintenance)
    let inventoryExpenses: any[] = [];
    if (
      !filters?.category ||
      filters.category === 'all' ||
      filters.category === 'Inventory'
    ) {
      // 1. SchoolInventory (Purchases)
      const invPurchaseWhere: any = {};
      if (filters?.dateFrom || filters?.dateTo) {
        invPurchaseWhere.purchaseDate = {};
        if (filters.dateFrom)
          invPurchaseWhere.purchaseDate.gte = this.parseStartOfDay(filters.dateFrom);
        if (filters.dateTo)
          invPurchaseWhere.purchaseDate.lte = this.parseEndOfDay(filters.dateTo);
      }
      const purchases = await this.prisma.schoolInventory.findMany({
        where: invPurchaseWhere,
        orderBy: { purchaseDate: 'desc' },
      });

      // 2. InventoryExpense (Maintenance)
      const invMaintWhere: any = {};
      if (filters?.dateFrom || filters?.dateTo) {
        invMaintWhere.date = {};
        if (filters.dateFrom)
          invMaintWhere.date.gte = this.parseStartOfDay(filters.dateFrom);
        if (filters.dateTo) invMaintWhere.date.lte = this.parseEndOfDay(filters.dateTo);
      }
      const maintenances = await this.prisma.inventoryExpense.findMany({
        where: invMaintWhere,
        include: { inventoryItem: true },
        orderBy: { date: 'desc' },
      });

      const mappedPurchases = purchases.map((p) => ({
        id: `inv-buy-${p.id}`,
        date: p.purchaseDate,
        category: 'Inventory',
        subCategory: 'Inventory Purchase',
        description: `Purchase: ${p.itemName} (${p.category})`,
        amount: Number(p.totalValue), // assuming totalValue is the cost
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        source: 'inventory-purchase',
        sourceId: p.id,
      }));

      const mappedMaintenance = maintenances.map((m) => ({
        id: `inv-maint-${m.id}`,
        date: m.date,
        category: 'Inventory',
        subCategory: 'Inventory Maintenance',
        description: `Maintenance: ${m.inventoryItem?.itemName || 'Item'} - ${m.expenseType}`,
        amount: Number(m.amount),
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        source: 'inventory-maintenance',
        sourceId: m.id,
      }));

      inventoryExpenses = [...mappedPurchases, ...mappedMaintenance];
    }

    // Combine and sort by date
    const allExpenses = [
      ...manualExpenses,
      ...payrolls,
      ...hostelExpenses,
      ...inventoryExpenses,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allExpenses;
  }

  async updateExpense(id: number, updateExpenseDto: UpdateExpenseDto) {
    const data: any = { ...updateExpenseDto };
    if (updateExpenseDto.date) {
      data.date = new Date(updateExpenseDto.date);
    }

    return this.prisma.financeExpense.update({
      where: { id },
      data,
    });
  }

  async deleteExpense(id: number) {
    return this.prisma.financeExpense.delete({
      where: { id },
    });
  }

  // ==================== CLOSING ====================
  async createClosing(createClosingDto: CreateClosingDto) {
    const { start, end, normalizedType } = this.getClosingBounds(createClosingDto.date, createClosingDto.type);
    const existing = await this.prisma.financeClosing.findFirst({
      where: { type: normalizedType, periodStart: start, periodEnd: end },
    });
    if (existing) {
      throw new ConflictException('Closing already exists for this period and type');
    }
    const totals = await this.calculateClosingSnapshot(start, end);
    try {
      return await this.prisma.financeClosing.create({
        data: {
          date: start,
          type: normalizedType,
          periodStart: start,
          periodEnd: end,
          ...totals,
          remarks: createClosingDto.remarks || null,
        },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Closing already exists for this period and type');
      }
      throw error;
    }
  }

  async getClosings(filters?: { dateFrom?: string; dateTo?: string; type?: string }) {
    const where: any = {};

    if (filters?.type) {
      where.type = String(filters.type).toLowerCase();
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = this.parseStartOfDay(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.date.lte = this.parseEndOfDay(filters.dateTo);
      }
    }

    return this.prisma.financeClosing.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async updateClosing(id: number, data: any) {
    const existing = await this.prisma.financeClosing.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Closing not found');
    const inputDate = data?.date ? String(data.date) : existing.date.toISOString();
    const inputType = data?.type || existing.type;
    const { start, end, normalizedType } = this.getClosingBounds(inputDate, inputType);
    const totals = await this.calculateClosingSnapshot(start, end);
    return this.prisma.financeClosing.update({
      where: { id },
      data: {
        type: normalizedType,
        date: start,
        periodStart: start,
        periodEnd: end,
        ...totals,
        remarks: data?.remarks ?? existing.remarks,
        updatedAt: new Date(),
      },
    });
  }

  async deleteClosing(id: number) {
    return this.prisma.financeClosing.delete({
      where: { id },
    });
  }

  // ==================== DASHBOARD STATS ====================
  async getDashboardStats(dateFrom?: string, dateTo?: string) {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = this.parseStartOfDay(dateFrom);
      }
      if (dateTo) {
        where.date.lte = this.parseEndOfDay(dateTo);
      }
    }

    // Fetch manual records
    const [manualIncomes, manualExpenses] = await Promise.all([
      this.prisma.financeIncome.findMany({ where }),
      this.prisma.financeExpense.findMany({ where }),
    ]);

    // Fetch paid fee payments
    const paymentWhere: any = {};
    if (dateFrom || dateTo) {
      paymentWhere.paymentDate = {};
      if (dateFrom) paymentWhere.paymentDate.gte = this.parseStartOfDay(dateFrom);
      if (dateTo) paymentWhere.paymentDate.lte = this.parseEndOfDay(dateTo);
    }
    const feePayments = await this.prisma.challanPayment.findMany({
      where: paymentWhere,
    });

    // Fetch payroll payment audit entries.
    const payrollPaymentWhere: any = {};
    if (dateFrom || dateTo) {
      payrollPaymentWhere.paidAt = {};
      if (dateFrom) payrollPaymentWhere.paidAt.gte = this.parseStartOfDay(dateFrom);
      if (dateTo) payrollPaymentWhere.paidAt.lte = this.parseEndOfDay(dateTo);
    }
    const payrollPayments = await this.prisma.payrollPayment.findMany({
      where: payrollPaymentWhere,
      include: { payroll: { include: { staff: true } } },
    });

    // Calculate totals
    const manualIncome = manualIncomes.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const feeIncome = feePayments.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    const extraFeePayments = await this.prisma.extraChallanPayment.findMany({ where: paymentWhere });
    const extraFeeIncome = extraFeePayments.reduce((sum, item) => sum + Number(item.amount), 0);

    const hostelFeePayments = await this.prisma.hostelChallanPayment.findMany({ where: paymentWhere });
    const hostelFeeIncome = hostelFeePayments.reduce((sum, item) => sum + Number(item.amount), 0);

    const totalIncome = manualIncome + feeIncome + extraFeeIncome + hostelFeeIncome;

    const manualExpense = manualExpenses.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const payrollExpense = payrollPayments.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const totalExpense = manualExpense + payrollExpense;

    const netBalance = totalIncome - totalExpense;

    // Category breakdown for incomes
    const incomeByCategory = manualIncomes.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
      },
      {} as Record<string, number>,
    );
    if (feeIncome > 0) {
      incomeByCategory['Fee'] = feeIncome;
    }

    // Category breakdown for expenses
    const expenseByCategory = manualExpenses.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
      },
      {} as Record<string, number>,
    );
    if (payrollExpense > 0) {
      expenseByCategory['Payroll'] = payrollExpense;
    }

    // Combine all into arrays
    const incomes = [
      ...manualIncomes,
      ...feePayments.map((p) => ({
        id: `fee-${p.id}`,
        date: p.paymentDate,
        category: 'Fee',
        description: `Fee payment`,
        amount: Number(p.amount),
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
      })),
    ];

    const expenses = [
      ...manualExpenses,
      ...payrollPayments.map((p) => ({
        id: `payroll-payment-${p.id}`,
        date: p.paidAt,
        category: 'Salaries', // Mapped to Salaries
        description: `Salary - ${p.payroll.month} - ${p.payroll.staff?.name || 'Staff'}`,
        amount: Number(p.amount),
        createdAt: p.paidAt,
        updatedAt: p.paidAt,
      })),
    ];

    return {
      totalIncome,
      totalExpense,
      netBalance,
      incomeByCategory,
      expenseByCategory,
      incomes,
      expenses,
    };
  }

  async getReportsAnalytics(filters?: {
    dateFrom?: string;
    dateTo?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const groupBy = filters?.groupBy || 'month';
    const [incomes, expenses] = await Promise.all([
      this.getIncomes({ dateFrom: filters?.dateFrom, dateTo: filters?.dateTo }),
      this.getExpenses({ dateFrom: filters?.dateFrom, dateTo: filters?.dateTo }),
    ]);

    const bucketKey = (d: Date) => {
      if (groupBy === 'day') return d.toISOString().slice(0, 10);
      if (groupBy === 'week') {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        return monday.toISOString().slice(0, 10);
      }
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const seriesMap: Record<string, { bucket: string; income: number; expense: number; net: number }> = {};
    for (const inc of incomes as any[]) {
      const key = bucketKey(new Date(inc.date));
      if (!seriesMap[key]) seriesMap[key] = { bucket: key, income: 0, expense: 0, net: 0 };
      seriesMap[key].income += Number(inc.amount || 0);
    }
    for (const exp of expenses as any[]) {
      const key = bucketKey(new Date(exp.date));
      if (!seriesMap[key]) seriesMap[key] = { bucket: key, income: 0, expense: 0, net: 0 };
      seriesMap[key].expense += Number(exp.amount || 0);
    }

    const timeseries = Object.values(seriesMap)
      .map((x) => ({ ...x, net: x.income - x.expense }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket));

    const sumByCategory = (rows: any[]) =>
      Object.entries(
        rows.reduce((acc: Record<string, number>, row: any) => {
          const key = row.category || 'Other';
          acc[key] = (acc[key] || 0) + Number(row.amount || 0);
          return acc;
        }, {}),
      ).map(([name, value]) => ({ name, value }));

    const totalIncome = incomes.reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
    const totalExpense = expenses.reduce((s: number, x: any) => s + Number(x.amount || 0), 0);

    return {
      groupBy,
      totals: {
        income: totalIncome,
        expense: totalExpense,
        net: totalIncome - totalExpense,
      },
      timeseries,
      netSeries: timeseries.map((x) => ({ bucket: x.bucket, net: x.net })),
      incomeByCategory: sumByCategory(incomes as any[]),
      expenseByCategory: sumByCategory(expenses as any[]),
    };
  }
}
