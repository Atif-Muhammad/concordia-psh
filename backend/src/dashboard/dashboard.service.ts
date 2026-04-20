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

      // Fee Challan — filter by sessionId if available, otherwise by issueDate
      this.prisma.feeChallan.findMany({
        where: sessionIdNum
          ? { sessionId: sessionIdNum }
          : { issueDate: { gte: monthStart, lte: monthEnd } },
        select: {
          status: true,
          amount: true,
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

      // Fee History - Collected (Based on Paid Date - Cash Flow)
      this.prisma.feeChallan.findMany({
        where: {
          ...(sessionIdNum ? { sessionId: sessionIdNum } : {
            paidDate: { gte: chartStart, lte: chartEnd },
          }),
          paidAmount: { gt: 0 },
          status: { in: ['PAID', 'PARTIAL', 'VOID'] },
        },
        select: {
          paidDate: true,
          paidAmount: true,
          issueDate: true,
        },
        orderBy: { paidDate: 'asc' },
      }),

      // Fee History - Issued/Pending (Based on Issue Date)
      this.prisma.feeChallan.findMany({
        where: sessionIdNum
          ? { sessionId: sessionIdNum }
          : { issueDate: { gte: chartStart, lte: chartEnd } },
        select: {
          issueDate: true,
          status: true,
          amount: true,
          paidAmount: true,
        },
        orderBy: { issueDate: 'asc' },
      }),

      // Total Receivables (All time pending)
      this.prisma.feeChallan.aggregate({
        _sum: {
          amount: true,
          paidAmount: true,
        },
        where: {
          status: {
            in: ['PENDING', 'PARTIAL', 'OVERDUE'],
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
      status: { in: ['PAID', 'PARTIAL', 'VOID'] },
    };
    if (sessionIdNum) {
      collectionWhere.sessionId = sessionIdNum;
    } else if (!isOverall) {
      collectionWhere.paidDate = { gte: monthStart, lte: monthEnd };
    }

    const collectedChallans = await this.prisma.feeChallan.findMany({
      where: collectionWhere,
      select: { paidAmount: true, amount: true, discount: true },
    });

    const totalCollectedTuition = collectedChallans.reduce(
      (sum, c) => sum + Math.min(c.paidAmount || 0, Math.max(0, (c.amount || 0) - (c.discount || 0))),
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
      paid: feeChallan.filter((f) => ['PAID', 'VOID'].includes(f.status)).length,
      pending: feeChallan.filter((f) => f.status === 'PENDING').length,
      overdue: feeChallan.filter((f) => f.status === 'OVERDUE').length,
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

    // Process Collected (by Paid Date, fallback to issueDate)
    paidHistoryData?.forEach((record) => {
      const dateRef = record.paidDate || record.issueDate;
      if (!dateRef) return;
      const d = new Date(dateRef);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (feeHistoryMap.has(key)) {
        const entry: any = feeHistoryMap.get(key);
        entry.collected += Number(record.paidAmount);
      }
    });

    // Process Pending (by Issue Date)
    issuedHistoryData?.forEach((record) => {
      if (['PAID', 'VOID', 'CANCELLED'].includes(record.status)) return;
      const d = new Date(record.issueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (feeHistoryMap.has(key)) {
        const entry: any = feeHistoryMap.get(key);
        entry.pending += Number(record.amount) - Number(record.paidAmount);
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
      (receivablesAgg._sum.amount || 0) - (receivablesAgg._sum.paidAmount || 0);

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
        regularRevenue: feeCollectionSummary.regularRevenue || 0,
        extraRevenue: feeCollectionSummary.extraRevenue || 0,
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
}
