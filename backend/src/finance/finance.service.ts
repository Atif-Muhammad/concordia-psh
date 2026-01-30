import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateClosingDto } from './dto/create-closing.dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) { }

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
    const where: any = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.date.lte = new Date(filters.dateTo);
      }
    }

    if (
      filters?.category &&
      filters.category !== 'all' &&
      filters.category !== 'Fee'
    ) {
      where.category = filters.category;
    }

    // Fetch manual income records
    const manualIncomes = await this.prisma.financeIncome.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // If category is 'Fee' or 'all', fetch PAID fee challans
    let feeChallans: any[] = [];
    if (
      !filters?.category ||
      filters.category === 'all' ||
      filters.category === 'Fee'
    ) {
      const challanWhere: any = {
        status: 'PAID',
      };

      if (filters?.dateFrom || filters?.dateTo) {
        challanWhere.paidDate = {};
        if (filters.dateFrom) {
          challanWhere.paidDate.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          challanWhere.paidDate.lte = new Date(filters.dateTo);
        }
      }

      const challans = await this.prisma.feeChallan.findMany({
        where: challanWhere,
        include: {
          student: true,
        },
        orderBy: { paidDate: 'desc' },
      });

      feeChallans = challans.map((c) => {
        const billingMonth = c.issueDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const studentName = `${c.student.fName} ${c.student.lName || ''}`.trim();
        return {
          id: `fee-${c.id}`,
          date: c.paidDate || c.createdAt,
          category: 'Fee',
          description: `Fee Payment: ${studentName} (${c.student.rollNumber}) - For ${billingMonth}`,
          amount: Number(c.paidAmount),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          source: 'fee-challan',
          sourceId: c.id,
          studentId: c.studentId,
          billingMonth: billingMonth
        };
      });
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
  }) {
    const where: any = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.date.lte = new Date(filters.dateTo);
      }
    }

    if (
      filters?.category &&
      filters.category !== 'all' &&
      filters.category !== 'Payroll'
    ) {
      where.category = filters.category;
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
      const payrollWhere: any = {
        status: 'PAID',
      };

      if (filters?.dateFrom || filters?.dateTo) {
        payrollWhere.paymentDate = {};
        if (filters.dateFrom) {
          payrollWhere.paymentDate.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          payrollWhere.paymentDate.lte = new Date(filters.dateTo);
        }
      }

      const paidPayrolls = await this.prisma.payroll.findMany({
        where: payrollWhere,
        include: {
          staff: true,
        },
        orderBy: { paymentDate: 'desc' },
      });

      payrolls = paidPayrolls.map((p) => {
        const staffName = p.staff?.name || 'Unknown';
        const staffType = p.staff?.isTeaching ? 'Teacher' : 'Staff';

        return {
          id: `payroll-${p.id}`,
          date: p.paymentDate || p.createdAt,
          category: 'Salaries',
          description: `Salary: ${staffName} (${staffType}) - Month: ${p.month}`,
          amount: Number(p.netSalary),
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          source: 'payroll',
          sourceId: p.id,
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
        if (filters.dateFrom) hostelWhere.date.gte = new Date(filters.dateFrom);
        if (filters.dateTo) hostelWhere.date.lte = new Date(filters.dateTo);
      }
      const hostelRecs = await this.prisma.hostelExpense.findMany({
        where: hostelWhere,
        orderBy: { date: 'desc' },
      });
      hostelExpenses = hostelRecs.map((h) => ({
        id: `hostel-${h.id}`,
        date: h.date,
        category: 'Hostel',
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
        if (filters.dateFrom) invPurchaseWhere.purchaseDate.gte = new Date(filters.dateFrom);
        if (filters.dateTo) invPurchaseWhere.purchaseDate.lte = new Date(filters.dateTo);
      }
      const purchases = await this.prisma.schoolInventory.findMany({
        where: invPurchaseWhere,
        orderBy: { purchaseDate: 'desc' },
      });

      // 2. InventoryExpense (Maintenance)
      const invMaintWhere: any = {};
      if (filters?.dateFrom || filters?.dateTo) {
        invMaintWhere.date = {};
        if (filters.dateFrom) invMaintWhere.date.gte = new Date(filters.dateFrom);
        if (filters.dateTo) invMaintWhere.date.lte = new Date(filters.dateTo);
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
      ...inventoryExpenses
    ].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

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
    return this.prisma.financeClosing.create({
      data: {
        ...createClosingDto,
        date: new Date(createClosingDto.date),
      },
    });
  }

  async getClosings(filters?: { dateFrom?: string; dateTo?: string }) {
    const where: any = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.date.lte = new Date(filters.dateTo);
      }
    }

    return this.prisma.financeClosing.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async updateClosing(id: number, data: any) {
    return this.prisma.financeClosing.update({
      where: { id },
      data: {
        ...data,
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
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    // Fetch manual records
    const [manualIncomes, manualExpenses] = await Promise.all([
      this.prisma.financeIncome.findMany({ where }),
      this.prisma.financeExpense.findMany({ where }),
    ]);

    // Fetch paid fee challans
    const challanWhere: any = { status: 'PAID' };
    if (dateFrom || dateTo) {
      challanWhere.paidDate = {};
      if (dateFrom) challanWhere.paidDate.gte = new Date(dateFrom);
      if (dateTo) challanWhere.paidDate.lte = new Date(dateTo);
    }
    const paidChallans = await this.prisma.feeChallan.findMany({
      where: challanWhere,
      include: { student: true },
    });

    // Fetch paid payrolls
    const payrollWhere: any = { status: 'PAID' };
    if (dateFrom || dateTo) {
      payrollWhere.paymentDate = {};
      if (dateFrom) payrollWhere.paymentDate.gte = new Date(dateFrom);
      if (dateTo) payrollWhere.paymentDate.lte = new Date(dateTo);
    }
    const paidPayrolls = await this.prisma.payroll.findMany({
      where: payrollWhere,
      include: { staff: true },
    });

    // Calculate totals
    const manualIncome = manualIncomes.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const feeIncome = paidChallans.reduce(
      (sum, item) => sum + Number(item.paidAmount),
      0,
    );
    const totalIncome = manualIncome + feeIncome;

    const manualExpense = manualExpenses.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const payrollExpense = paidPayrolls.reduce(
      (sum, item) => sum + Number(item.netSalary),
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
      ...paidChallans.map((c) => ({
        id: `fee-${c.id}`,
        date: c.paidDate || c.createdAt,
        category: 'Fee',
        description: `Fee payment from ${c.student.fName} ${c.student.lName || ''}`,
        amount: Number(c.paidAmount),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    ];

    const expenses = [
      ...manualExpenses,
      ...paidPayrolls.map((p) => ({
        id: `payroll-${p.id}`,
        date: p.paymentDate || p.createdAt,
        category: 'Salaries', // Mapped to Salaries
        description: `Salary - ${p.month} - ${p.staff?.name || 'Staff'}`,
        amount: Number(p.netSalary),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
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
}
