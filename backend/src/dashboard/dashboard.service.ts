import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { FeeManagementService } from '../fee-management/fee-management.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private financeService: FinanceService,
    private feeService: FeeManagementService,
  ) {}
  async getDashboardStats(filters?: { month?: string; year?: string; sessionId?: string }) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let monthStart: Date | null = null;
    let monthEnd: Date | null = null;
    let isOverall = false;
    let sessionIdNum: number | null = null;

    // If sessionId provided, use the session's date range AND filter challans by sessionId
    if (filters?.sessionId && filters.sessionId !== 'all') {
      sessionIdNum = Number(filters.sessionId);
      const session = await this.prisma.academicSession.findUnique({
        where: { id: sessionIdNum },
      });
      if (session) {
        monthStart = new Date(session.startDate);
        monthEnd = new Date(session.endDate);
      } else {
        monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      }
    } else if (filters?.sessionId === 'all') {
      // All time — no date filter
      isOverall = true;
      monthStart = new Date(2000, 0, 1);
      monthEnd = new Date(today.getFullYear() + 5, 11, 31, 23, 59, 59, 999);
    } else if (filters?.year) {
      const year = parseInt(filters.year);
      if (filters.month) {
        const monthIndex = new Date(Date.parse(`${filters.month} 1, ${year}`)).getMonth();
        monthStart = new Date(year, monthIndex, 1);
        monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
      } else {
        monthStart = new Date(year, 0, 1);
        monthEnd = new Date(year, 11, 31, 23, 59, 59, 999);
      }
    } else {
      // Default to current month
      monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // For charts: last 12 months ending at monthEnd
    const chartEnd = new Date(monthEnd);
    const chartStart = new Date(
      chartEnd.getFullYear(),
      chartEnd.getMonth() - 11,
      1,
    );

    // For weekly trend: last 7 days ending at monthEnd
    const weeklyEnd = new Date(monthEnd);
    const weeklyStart = new Date(weeklyEnd);
    weeklyStart.setDate(weeklyEnd.getDate() - 6);
    weeklyStart.setHours(0, 0, 0, 0);

    // Helper to format date as YYYY-MM-DD for FinanceService
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const dateFrom = formatDate(monthStart);
    const dateTo = formatDate(monthEnd);

    // Call FinanceService to get Income and Expense (Exactly as Finance Page does)
    const [financeIncomes, financeExpenses] = await Promise.all([
      this.financeService.getIncomes({ dateFrom, dateTo }),
      this.financeService.getExpenses({ dateFrom, dateTo }),
    ]);

    // Calculate Totals using FinanceService data
    const monthlyIncome = financeIncomes.reduce(
      (sum: number, item: any) => sum + Number(item.amount),
      0,
    );
    const monthlyExpense = financeExpenses.reduce(
      (sum: number, item: any) => sum + Number(item.amount),
      0,
    );

    // Parallel queries for efficiency
    const [
      students,
      feeChallan,
      attendance,
      inventory,
      rooms,
      teachingStaff,
      nonTeachingStaff,
      exams,
      paidHistoryData,
      issuedHistoryData,
      extraHistoryData,
      hostelHistoryData,
      receivablesAgg,
      weeklyAttendanceRaw,
    ] = await Promise.all([
      // Students
      this.prisma.student.findMany({
        select: {
          id: true,
          passedOut: true,
          program: {
            select: {
              name: true,
              level: true,
            },
          },
        },
      }),

      // Fee Installments — filter by sessionId if available
      this.prisma.feeInstallment.findMany({
        where: sessionIdNum
          ? { sessionId: sessionIdNum }
          : { createdAt: { gte: monthStart, lte: monthEnd } },
        select: {
          status: true,
          basePayable: true,
          paidAmount: true,
        },
      }),

      // Period Attendance
      this.prisma.attendance.findMany({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          status: true,
        },
      }),

      // Inventory
      this.prisma.schoolInventory.findMany({
        select: {
          quantity: true,
          unitPrice: true,
        },
      }),

      // Hostel Rooms
      this.prisma.room.findMany({
        select: {
          status: true,
        },
      }),

      // Teaching Staff
      this.prisma.staff.findMany({
        where: { isTeaching: true },
        select: {
          status: true,
          specialization: true,
        },
      }),

      // Non-Teaching Staff
      this.prisma.staff.findMany({
        where: { isNonTeaching: true },
        select: {
          status: true,
          empDepartment: true,
        },
      }),

      // Exams
      this.prisma.exam.findMany({
        select: {
          program: {
            select: {
              name: true,
              level: true,
            },
          },
        },
      }),

      // Fee History - Collected (Based on Payment Date - Cash Flow)
      this.prisma.challanPayment.findMany({
        where: {
          ...(sessionIdNum
            ? { challan: { installment: { sessionId: sessionIdNum } } }
            : { paymentDate: { gte: chartStart, lte: chartEnd } }),
        },
        select: {
          paymentDate: true,
          amount: true,
        },
        orderBy: { paymentDate: 'asc' },
      }),

      // Fee History - Issued/Pending (Based on Generated Date)
      this.prisma.feeChallanV2.findMany({
        where: sessionIdNum
          ? { installment: { sessionId: sessionIdNum } }
          : { generatedDate: { gte: chartStart, lte: chartEnd } },
        select: {
          generatedDate: true,
          status: true,
          snapshotTotalDue: true,
          amountReceived: true,
        },
        orderBy: { generatedDate: 'asc' },
      }),

      // Fee History - Extra Challans
      this.prisma.extraChallan.findMany({
        where: { generatedAt: { gte: chartStart, lte: chartEnd } },
        select: {
          generatedAt: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
        },
      }),

      // Fee History - Hostel Challans
      this.prisma.hostelChallan.findMany({
        where: { generatedAt: { gte: chartStart, lte: chartEnd } },
        select: {
          generatedAt: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
        },
      }),

      // Total Receivables (All time pending)
      this.prisma.feeInstallment.aggregate({
        _sum: {
          basePayable: true,
          paidAmount: true,
        },
        where: {
          status: {
            in: ['PENDING', 'PARTIAL'],
          },
        },
      }),

      // Weekly Attendance (Trend for period)
      this.prisma.attendance.findMany({
        where: {
          date: {
            gte: weeklyStart,
            lte: weeklyEnd,
          },
        },
        select: {
          date: true,
          status: true,
        },
      }),
    ]);

    // Calculate student statistics
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => !s.passedOut).length;

    // Helper to count by program level safely
    const countByLevel = (level: string) =>
      students.filter((s) => s.program?.level === level).length;

    const studentsByStatus = {
      active: activeStudents,
      expelled: 0,
      passedOut: students.filter((s) => s.passedOut).length,
    };

    // Calculate Expected vs Collected Tuition
    // 1. Expected: Sum of Tuition Fee for ALL Active Students (Standardized per Class)
    const allActiveStudents = await this.prisma.student.findMany({
      where: { passedOut: false },
      select: { programId: true, classId: true },
    });

    const feeStructures = await this.prisma.feeStructure.findMany({
      include: { feeHeads: { include: { feeHead: true } } },
    });

    let totalExpectedTuition = 0;

    // Create lookup for structure tuition amount
    const structureTuitionMap = new Map<string, number>(); // key: "progId-classId"
    feeStructures.forEach((fs) => {
      const tuition = fs.feeHeads
        .filter((fh) => fh.feeHead.isTuition)
        .reduce((sum, fh) => sum + (fh.amount || fh.feeHead.amount), 0);
      structureTuitionMap.set(`${fs.programId}-${fs.classId}`, tuition);
    });

    allActiveStudents.forEach((stu) => {
      const tuition =
        structureTuitionMap.get(`${stu.programId}-${stu.classId}`) || 0;
      totalExpectedTuition += tuition;
    });

    // 2. Collected: Sum of paidAmount for Paid/Partial Challans in period
    const collectionWhere: any = {
      status: { in: ['PAID', 'PARTIAL'] },
    };
    if (sessionIdNum) {
      collectionWhere.sessionId = sessionIdNum;
    } else if (!isOverall) {
      collectionWhere.lastPaymentDate = { gte: monthStart, lte: monthEnd };
    }

    const collectedInstallments = await this.prisma.feeInstallment.findMany({
      where: collectionWhere,
      select: { paidAmount: true, basePayable: true, discount: true },
    });

    const totalCollectedTuition = collectedInstallments.reduce(
      (sum, c) => sum + Number(c.paidAmount),
      0,
    );

    // Calculate collection rate (max 100%)
    const feeCollectionRate =
      totalExpectedTuition > 0
        ? Math.min(
            Math.round((totalCollectedTuition / totalExpectedTuition) * 100),
            100,
          )
        : 0;

    // Fees Stats — use FeeManagementService.getFeeCollectionSummary for consistent "Total Received"
    // This matches exactly what the Fee Management page shows
    const feeCollectionSummary = await this.feeService.getFeeCollectionSummary(
      'overall',
      sessionIdNum ?? undefined,
    );
    const paidFees = feeCollectionSummary.totalRevenue;
    const pendingFees = feeCollectionSummary.totalOutstanding;
    const totalFeeAmount = paidFees + pendingFees;

    const feesByStatus = {
      paid: feeChallan.filter((f: any) => f.status === 'PAID').length,
      pending: feeChallan.filter((f: any) => f.status === 'PENDING').length,
      overdue: feeChallan.filter((f: any) => {
        if (f.status !== 'PENDING') return false;
        // Check if dueDate is in the past — not available in this query, so skip
        return false;
      }).length,
      collectionRate: feeCollectionRate,
    };

    // Calculate monthly fee history
    const feeHistoryMap = new Map<
      string,
      { collected: number; pending: number; label: string }
    >();

    // Initialize chart months — for session filter use issueDate range, otherwise last 12 months
    if (sessionIdNum && monthStart && monthEnd) {
      // Build months between session start and end
      const cursor = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
      const end = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1);
      while (cursor <= end) {
        const monthName = cursor.toLocaleString('default', { month: 'short' });
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        feeHistoryMap.set(key, { collected: 0, pending: 0, label: monthName });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(chartEnd);
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        feeHistoryMap.set(key, { collected: 0, pending: 0, label: monthName });
      }
    }

    // Process Collected (by Payment Date)
    paidHistoryData?.forEach((record: any) => {
      const dateRef = record.paymentDate;
      if (!dateRef) return;
      const d = new Date(dateRef);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (feeHistoryMap.has(key)) {
        const entry: any = feeHistoryMap.get(key);
        entry.collected += Number(record.amount);
      }
    });

    // Process Pending (by Generated Date)
    issuedHistoryData?.forEach((record: any) => {
      if (['PAID', 'VOID', 'SUPERSEDED', 'SETTLED'].includes(record.status)) return;
      const d = new Date(record.generatedDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (feeHistoryMap.has(key)) {
        const entry: any = feeHistoryMap.get(key);
        entry.pending += Number(record.snapshotTotalDue) - Number(record.amountReceived);
      }
    });

    // Process Extra Pending
    extraHistoryData?.forEach((record: any) => {
      if (['PAID', 'VOID'].includes(record.status)) return;
      const d = new Date(record.generatedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (feeHistoryMap.has(key)) {
        const entry: any = feeHistoryMap.get(key);
        entry.pending += Number(record.totalAmount) - Number(record.paidAmount);
      }
    });

    // Process Hostel Pending
    hostelHistoryData?.forEach((record: any) => {
      if (['PAID', 'VOID', 'SUPERSEDED'].includes(record.status)) return;
      const d = new Date(record.generatedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (feeHistoryMap.has(key)) {
        const entry: any = feeHistoryMap.get(key);
        entry.pending += Number(record.totalAmount) - Number(record.paidAmount);
      }
    });

    const monthlyFeeCollection = Array.from(feeHistoryMap.entries()).map(
      ([_key, data]: [string, any]) => ({
        month: data.label,
        collected: Math.round(data.collected),
        pending: Math.round(data.pending),
      }),
    );

    // Calculate receivables
    const totalReceivable =
      Number(receivablesAgg._sum.basePayable ?? 0) - Number(receivablesAgg._sum.paidAmount ?? 0);

    // Calculate attendance statistics
    const totalAttendanceToday = attendance.length;
    const presentToday = attendance.filter(
      (a) => a.status === 'PRESENT',
    ).length;
    const attendanceRate =
      totalAttendanceToday > 0
        ? (presentToday / totalAttendanceToday) * 100
        : 0;

    const attendanceByStatus = {
      present: attendance.filter((a) => a.status === 'PRESENT').length,
      absent: attendance.filter((a) => a.status === 'ABSENT').length,
      leave: attendance.filter((a) => a.status === 'LEAVE').length,
    };

    // Calculate inventory statistics
    const totalInventoryValue = inventory.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0,
    );
    const inventoryByStock = {
      inStock: inventory.filter((i) => i.quantity > 10).length,
      lowStock: inventory.filter((i) => i.quantity > 0 && i.quantity <= 10)
        .length,
      outOfStock: inventory.filter((i) => i.quantity === 0).length,
    };

    // Calculate hostel statistics
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
    const occupancyRate =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Calculate staff statistics
    const totalExams = exams.length;
    const totalStaff = teachingStaff.length + nonTeachingStaff.length;
    const teachingCount = teachingStaff.length;
    const adminStaffCount = nonTeachingStaff.filter((e) =>
      ['ADMIN', 'FINANCE', 'HR'].includes(e.empDepartment!),
    ).length;
    const supportStaffCount = nonTeachingStaff.length - adminStaffCount;

    // Calculate exam statistics
    const examsByProgram = {
      intermediate: exams.filter((e) => e.program?.level === 'INTERMEDIATE')
        .length,
      diploma: exams.filter((e) => e.program?.level === 'DIPLOMA').length,
      bs: exams.filter((e) => e.program?.level === 'UNDERGRADUATE').length,
      shortCourse: exams.filter((e) => e.program?.level === 'SHORT_COURSE')
        .length,
      coaching: exams.filter((e) => e.program?.level === 'COACHING').length,
    };

    // Calculate weekly attendance trend
    const weeklyAttendanceTrend: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleString('default', { weekday: 'short' });

      const dayStats = weeklyAttendanceRaw.filter(
        (a) => new Date(a.date).toISOString().split('T')[0] === dateStr,
      );

      const total = dayStats.length;
      const present = dayStats.filter((a) => a.status === 'PRESENT').length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      weeklyAttendanceTrend.push({
        day: dayName,
        rate: rate,
        fullDate: dateStr,
      });
    }

    // Calculate finance statistics

    return {
      students: {
        total: totalStudents,
        active: activeStudents,
        byProgram: {
          intermediate: countByLevel('INTERMEDIATE'),
          diploma: countByLevel('DIPLOMA'),
          bs: countByLevel('UNDERGRADUATE'),
          shortCourse: countByLevel('SHORT_COURSE'),
          coaching: countByLevel('COACHING'),
        },
        byStatus: studentsByStatus,
      },
      fees: {
        totalAmount: totalFeeAmount,
        paidAmount: paidFees,
        pendingAmount: pendingFees,
        collectionRate: feeCollectionRate,
        byStatus: feesByStatus,
      },
      attendance: {
        today: {
          total: totalAttendanceToday,
          present: presentToday,
          rate: Math.round(attendanceRate * 10) / 10,
        },
        byStatus: attendanceByStatus,
      },
      inventory: {
        totalItems: inventory.length,
        totalValue: totalInventoryValue,
        byStock: inventoryByStock,
      },
      hostel: {
        totalRooms,
        occupiedRooms,
        vacantRooms: totalRooms - occupiedRooms,
        occupancyRate: Math.round(occupancyRate),
      },
      staff: {
        total: totalStaff,
        teaching: teachingCount,
        admin: adminStaffCount,
        support: supportStaffCount,
      },
      exams: {
        total: totalExams,
        byProgram: examsByProgram,
      },
      finance: {
        monthlyIncome,
        monthlyExpense,
        netBalance: monthlyIncome - monthlyExpense,
        totalReceivable,
        periodPendingFees: pendingFees,
      },
      charts: {
        monthlyFeeCollection: monthlyFeeCollection.map((m) => ({
          month: m.month,
          collected: m.collected,
          pending: m.pending,
        })),
        weeklyAttendance: weeklyAttendanceTrend,
      },
    };
  }

  // ─── Section helpers ────────────────────────────────────────────────────────

  private resolveSessionFilter(sessionId?: string) {
    return sessionId && sessionId !== 'all' ? Number(sessionId) : null;
  }

  async getStudentsSection(filters?: { sessionId?: string }) {
    const students = await this.prisma.student.findMany({
      select: {
        id: true,
        passedOut: true,
        program: { select: { level: true } },
      },
    });

    const countByLevel = (level: string) =>
      students.filter((s) => s.program?.level === level).length;

    return {
      total: students.length,
      active: students.filter((s) => !s.passedOut).length,
      byProgram: {
        intermediate: countByLevel('INTERMEDIATE'),
        diploma: countByLevel('DIPLOMA'),
        bs: countByLevel('UNDERGRADUATE'),
        shortCourse: countByLevel('SHORT_COURSE'),
        coaching: countByLevel('COACHING'),
      },
      byStatus: {
        active: students.filter((s) => !s.passedOut).length,
        expelled: 0,
        passedOut: students.filter((s) => s.passedOut).length,
      },
    };
  }

  async getFeesSection(filters?: { sessionId?: string }) {
    const sessionIdNum = this.resolveSessionFilter(filters?.sessionId);
    let periodDateFilter: any = {};
    if (sessionIdNum) {
      const session = await this.prisma.academicSession.findUnique({ where: { id: sessionIdNum } });
      if (session) {
        periodDateFilter = { gte: new Date(session.startDate), lte: new Date(session.endDate) };
      }
    }

    // Only count installments that have a challan generated (billed) and are not frozen
    const baseWhere = sessionIdNum ? { sessionId: sessionIdNum } : {};
    const [
      feeChallan,
      installmentCollected,
      installmentOutstanding,
      extraCollected,
      extraOutstanding,
      hostelCollected,
      hostelOutstanding,
    ] = await Promise.all([
      this.prisma.feeInstallment.findMany({
        where: {
          ...baseWhere,
          challanGenerated: true,
          status: { notIn: ['SUPERSEDED', 'SETTLED', 'VOID'] },
        },
        select: { status: true },
      }),
      this.prisma.feeInstallment.aggregate({
        where: {
          ...baseWhere,
          settled: null,
          paidAmount: { gt: 0 },
        },
        _sum: { paidAmount: true },
      }),
      this.prisma.feeInstallment.aggregate({
        where: {
          ...baseWhere,
          challanGenerated: true,
          pendingAmount: { gt: 0 },
          status: { notIn: ['PAID', 'SUPERSEDED', 'VOID', 'SETTLED'] },
        },
        _sum: { pendingAmount: true },
      }),
      this.prisma.extraChallan.aggregate({
        where: {
          paidAmount: { gt: 0 },
          ...(periodDateFilter.gte ? { generatedAt: periodDateFilter } : {}),
        },
        _sum: { paidAmount: true },
      }),
      this.prisma.extraChallan.findMany({
        where: {
          status: { notIn: ['PAID', 'VOID', 'SUPERSEDED', 'SETTLED'] },
          ...(periodDateFilter.gte ? { generatedAt: periodDateFilter } : {}),
        },
        select: { totalAmount: true, paidAmount: true },
      }),
      this.prisma.hostelChallan.aggregate({
        where: {
          paidAmount: { gt: 0 },
          ...(periodDateFilter.gte ? { generatedAt: periodDateFilter } : {}),
        },
        _sum: { paidAmount: true },
      }),
      this.prisma.hostelChallan.findMany({
        where: {
          status: { notIn: ['PAID', 'VOID', 'SUPERSEDED', 'SETTLED'] },
          ...(periodDateFilter.gte ? { generatedAt: periodDateFilter } : {}),
        },
        select: { totalAmount: true, paidAmount: true },
      }),
    ]);

    const breakdown = {
      installment: {
        collected: Number(installmentCollected._sum.paidAmount ?? 0),
        outstanding: Number(installmentOutstanding._sum.pendingAmount ?? 0),
      },
      extraChallans: {
        collected: Number(extraCollected._sum.paidAmount ?? 0),
        outstanding: extraOutstanding.reduce(
          (sum, challan) => sum + Math.max(0, Number(challan.totalAmount) - Number(challan.paidAmount)),
          0,
        ),
      },
      hostel: {
        collected: Number(hostelCollected._sum.paidAmount ?? 0),
        outstanding: hostelOutstanding.reduce(
          (sum, challan) => sum + Math.max(0, Number(challan.totalAmount) - Number(challan.paidAmount)),
          0,
        ),
      },
    };

    const totalCollected =
      breakdown.installment.collected +
      breakdown.extraChallans.collected +
      breakdown.hostel.collected;
    const totalOutstanding =
      breakdown.installment.outstanding +
      breakdown.extraChallans.outstanding +
      breakdown.hostel.outstanding;

    return {
      paidAmount: totalCollected,
      regularRevenue: breakdown.installment.collected,
      extraRevenue: breakdown.extraChallans.collected,
      hostelRevenue: breakdown.hostel.collected,
      pendingAmount: totalOutstanding,
      installmentPendingAmount: breakdown.installment.outstanding,
      extraPendingAmount: breakdown.extraChallans.outstanding,
      hostelPendingAmount: breakdown.hostel.outstanding,
      breakdown,
      byStatus: {
        paid: feeChallan.filter((f) => f.status === 'PAID').length,
        // PENDING + PARTIAL + OVERDUE are all "unpaid" — group them as pending for the chart
        pending: feeChallan.filter((f) => ['PENDING', 'PARTIAL'].includes(f.status)).length,
        overdue: feeChallan.filter((f) => f.status === 'OVERDUE').length,
      },
    };
  }

  async getAttendanceSection(filters?: { sessionId?: string }) {
    const sessionIdNum = this.resolveSessionFilter(filters?.sessionId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let dateFilter: any = {};
    if (sessionIdNum) {
      const session = await this.prisma.academicSession.findUnique({ where: { id: sessionIdNum } });
      if (session) dateFilter = { gte: new Date(session.startDate), lte: new Date(session.endDate) };
    } else {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      dateFilter = { gte: monthStart, lte: monthEnd };
    }

    const attendance = await this.prisma.attendance.findMany({
      where: { date: dateFilter },
      select: { status: true },
    });

    const present = attendance.filter((a) => a.status === 'PRESENT').length;
    const total = attendance.length;

    return {
      today: {
        total,
        present,
        rate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0,
      },
      byStatus: {
        present,
        absent: attendance.filter((a) => a.status === 'ABSENT').length,
        leave: attendance.filter((a) => a.status === 'LEAVE').length,
      },
    };
  }

  async getStaffSection() {
    // Query all staff once to avoid double-counting dual-role staff
    const allStaff = await this.prisma.staff.findMany({
      select: { isTeaching: true, isNonTeaching: true, empDepartment: true },
    });

    // Unique staff count (each person counted once regardless of dual role)
    const total = allStaff.length;
    // Teaching: has teaching role (may also be non-teaching)
    const teaching = allStaff.filter((s) => s.isTeaching).length;
    // Non-teaching only: has non-teaching role but NOT teaching
    const nonTeachingOnly = allStaff.filter((s) => s.isNonTeaching && !s.isTeaching);
    const admin = nonTeachingOnly.filter((s) => ['ADMIN', 'FINANCE', 'HR'].includes(s.empDepartment!)).length;
    const support = nonTeachingOnly.filter((s) => !['ADMIN', 'FINANCE', 'HR'].includes(s.empDepartment!)).length;

    return { total, teaching, admin, support };
  }

  async getFinanceSection(filters?: { sessionId?: string }) {
    const sessionIdNum = this.resolveSessionFilter(filters?.sessionId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let dateFrom: string;
    let dateTo: string;
    if (filters?.sessionId === 'all') {
      dateFrom = new Date(2000, 0, 1).toISOString().split('T')[0];
      dateTo = new Date(today.getFullYear() + 5, 11, 31).toISOString().split('T')[0];
    } else if (sessionIdNum) {
      const session = await this.prisma.academicSession.findUnique({ where: { id: sessionIdNum } });
      dateFrom = session ? session.startDate.toISOString().split('T')[0] : new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      dateTo = session ? session.endDate.toISOString().split('T')[0] : new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    } else {
      dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    }

    const [incomes, expenses, installmentPending, extraPending, hostelPending] = await Promise.all([
      this.financeService.getIncomes({ dateFrom, dateTo }),
      this.financeService.getExpenses({ dateFrom, dateTo }),
      this.prisma.feeInstallment.aggregate({
        _sum: { pendingAmount: true },
        where: {
          ...(sessionIdNum ? { sessionId: sessionIdNum } : {}),
          challanGenerated: true,
          pendingAmount: { gt: 0 },
          status: { notIn: ['PAID', 'SUPERSEDED', 'VOID', 'SETTLED'] },
        },
      }),
      this.prisma.extraChallan.aggregate({
        _sum: { totalAmount: true, paidAmount: true },
        where: { status: { notIn: ['PAID', 'SUPERSEDED', 'VOID', 'SETTLED'] } },
      }),
      this.prisma.hostelChallan.aggregate({
        _sum: { totalAmount: true, paidAmount: true },
        where: { status: { notIn: ['PAID', 'SUPERSEDED', 'VOID', 'SETTLED'] } },
      }),
    ]);

    const monthlyIncome = incomes.reduce((s: number, i: any) => s + Number(i.amount), 0);
    const monthlyExpense = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
    const installmentPendingAmount = Number(installmentPending._sum.pendingAmount ?? 0);
    const extraPendingAmount = Math.max(0, Number(extraPending._sum.totalAmount ?? 0) - Number(extraPending._sum.paidAmount ?? 0));
    const hostelPendingAmount = Math.max(0, Number(hostelPending._sum.totalAmount ?? 0) - Number(hostelPending._sum.paidAmount ?? 0));
    const totalPending = installmentPendingAmount + extraPendingAmount + hostelPendingAmount;

    return {
      monthlyIncome,
      monthlyExpense,
      netBalance: monthlyIncome - monthlyExpense,
      totalInflow: monthlyIncome,
      totalOutflow: monthlyExpense,
      totalPending,
      totalReceivable: totalPending,
      pendingBreakdown: {
        installment: installmentPendingAmount,
        extraChallans: extraPendingAmount,
        hostel: hostelPendingAmount,
      },
    };
  }

  async getChartsSection(filters?: { sessionId?: string }) {
    const sessionIdNum = this.resolveSessionFilter(filters?.sessionId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let monthStart: Date;
    let monthEnd: Date;
    if (sessionIdNum) {
      const session = await this.prisma.academicSession.findUnique({ where: { id: sessionIdNum } });
      monthStart = session ? new Date(session.startDate) : new Date(today.getFullYear(), today.getMonth(), 1);
      monthEnd = session ? new Date(session.endDate) : new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      monthStart = new Date(today.getFullYear(), today.getMonth() - 11, 1);
      monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const weeklyStart = new Date(today); weeklyStart.setDate(today.getDate() - 6); weeklyStart.setHours(0,0,0,0);

    const [paidHistory, issuedHistory, weeklyRaw] = await Promise.all([
      this.prisma.challanPayment.findMany({
        where: sessionIdNum
          ? { challan: { installment: { sessionId: sessionIdNum } } }
          : { paymentDate: { gte: monthStart, lte: monthEnd } },
        select: { paymentDate: true, amount: true },
        orderBy: { paymentDate: 'asc' },
      }),
      this.prisma.feeChallanV2.findMany({
        where: sessionIdNum
          ? { installment: { sessionId: sessionIdNum } }
          : { generatedDate: { gte: monthStart, lte: monthEnd } },
        select: { generatedDate: true, status: true, snapshotTotalDue: true, amountReceived: true },
      }),
      this.prisma.attendance.findMany({
        where: { date: { gte: weeklyStart, lte: today } },
        select: { date: true, status: true },
      }),
    ]);

    // Build monthly fee chart
    const feeMap = new Map<string, { collected: number; pending: number; label: string }>();
    const cursor = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
    const end = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), 1);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      feeMap.set(key, { collected: 0, pending: 0, label: cursor.toLocaleString('default', { month: 'short' }) });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    paidHistory.forEach((r) => {
      const d = new Date(r.paymentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (feeMap.has(key)) feeMap.get(key)!.collected += Number(r.amount);
    });
    issuedHistory.forEach((r) => {
      if (['PAID', 'VOID', 'SUPERSEDED', 'SETTLED'].includes(r.status)) return;
      const d = new Date(r.generatedDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (feeMap.has(key)) feeMap.get(key)!.pending += Number(r.snapshotTotalDue) - Number(r.amountReceived);
    });

    const monthlyFeeCollection = Array.from(feeMap.values()).map((v) => ({
      month: v.label,
      collected: Math.round(v.collected),
      pending: Math.round(v.pending),
    }));

    // Build weekly attendance trend
    const weeklyAttendance: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayStats = weeklyRaw.filter((a) => new Date(a.date).toISOString().split('T')[0] === dateStr);
      const total = dayStats.length;
      const present = dayStats.filter((a) => a.status === 'PRESENT').length;
      weeklyAttendance.push({ day: d.toLocaleString('default', { weekday: 'short' }), rate: total > 0 ? Math.round((present / total) * 100) : 0 });
    }

    return { monthlyFeeCollection, weeklyAttendance };
  }
}
