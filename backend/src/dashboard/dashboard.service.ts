import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService, private financeService: FinanceService) { }
  async getDashboardStats(filters?: { month?: string; year?: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let monthStart: Date;
    let monthEnd: Date;
    let isOverall = true;

    if (filters?.year) {
      isOverall = false;
      const year = parseInt(filters.year);

      if (filters.month) {
        // Specific Month
        const monthIndex = new Date(Date.parse(`${filters.month} 1, ${filters.year}`)).getMonth();
        monthStart = new Date(year, monthIndex, 1);
        monthEnd = new Date(year, monthIndex + 1, 0);
      } else {
        // Whole Year
        monthStart = new Date(year, 0, 1);
        monthEnd = new Date(year, 11, 31);
      }
    } else {
      // Default to current month
      monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    // Helper to format date as YYYY-MM-DD for FinanceService
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const dateFrom = formatDate(monthStart);
    const dateTo = formatDate(monthEnd);

    // Call FinanceService to get Income and Expense (Exactly as Finance Page does)
    const [financeIncomes, financeExpenses] = await Promise.all([
      this.financeService.getIncomes({ dateFrom, dateTo }),
      this.financeService.getExpenses({ dateFrom, dateTo })
    ]);

    // Calculate Totals using FinanceService data
    const monthlyIncome = financeIncomes.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
    const monthlyExpense = financeExpenses.reduce((sum: number, item: any) => sum + Number(item.amount), 0);


    // Parallel queries for efficiency
    const [
      students,
      feeChallan,
      attendance,
      inventory,
      rooms,
      teachers,
      employees,
      exams,
      paidHistoryData,
      issuedHistoryData,
      receivablesAgg,
    ] = await Promise.all([
      // Students
      this.prisma.student.findMany({
        select: {
          id: true,
          passedOut: true,
          program: {
            select: {
              name: true,
              level: true
            }
          }
        },
      }),

      // Fee Challan (for selected month)
      this.prisma.feeChallan.findMany({
        where: {
          issueDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          status: true,
          amount: true,
          paidAmount: true,
        },
      }),

      // Today's Attendance
      this.prisma.attendance.findMany({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
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

      // Teachers
      this.prisma.teacher.findMany({
        select: {
          teacherStatus: true,
          specialization: true,
        },
      }),

      // Employees
      this.prisma.employee.findMany({
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
            }
          },
        },
      }),



      // Fee History - Collected (Based on Paid Date - Cash Flow)
      this.prisma.feeChallan.findMany({
        where: {
          paidDate: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 11)),
          },
          paidAmount: {
            gt: 0
          }
        },
        select: {
          paidDate: true,
          paidAmount: true,
        },
        orderBy: {
          paidDate: 'asc',
        },
      }),

      // Fee History - Issued/Pending (Based on Issue Date)
      this.prisma.feeChallan.findMany({
        where: {
          issueDate: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 11)),
          },
        },
        select: {
          issueDate: true,
          status: true,
          amount: true,
          paidAmount: true,
        },
        orderBy: {
          issueDate: 'asc',
        },
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
      select: { programId: true, classId: true }
    });

    const feeStructures = await this.prisma.feeStructure.findMany({
      include: { feeHeads: { include: { feeHead: true } } }
    });

    let totalExpectedTuition = 0;

    // Create lookup for structure tuition amount
    const structureTuitionMap = new Map<string, number>(); // key: "progId-classId"
    feeStructures.forEach(fs => {
      const tuition = fs.feeHeads
        .filter(fh => fh.feeHead.isTuition)
        .reduce((sum, fh) => sum + (fh.amount || fh.feeHead.amount), 0);
      structureTuitionMap.set(`${fs.programId}-${fs.classId}`, tuition);
    });

    allActiveStudents.forEach(stu => {
      const tuition = structureTuitionMap.get(`${stu.programId}-${stu.classId}`) || 0;
      totalExpectedTuition += tuition;
    });

    // 2. Collected: Sum of tuitionPaid for Paid/Partial Challans in period
    const collectionWhere: any = {
      status: { in: ['PAID', 'PARTIAL'] }
    };
    if (!isOverall) {
      collectionWhere.paidDate = {
        gte: monthStart,
        lte: monthEnd
      };
    }

    const collectedChallans = await this.prisma.feeChallan.findMany({
      where: collectionWhere,
      select: { tuitionPaid: true }
    });

    const totalCollectedTuition = collectedChallans.reduce((sum, c) => sum + (c.tuitionPaid || 0), 0);

    // Calculate collection rate (max 100%)
    const feeCollectionRate = totalExpectedTuition > 0
      ? Math.min(Math.round((totalCollectedTuition / totalExpectedTuition) * 100), 100)
      : 0;

    // Fees Stats for Dashboard
    const totalFeeAmount = feeChallan.reduce((sum, f) => sum + Number(f.amount), 0);
    const paidFees = feeChallan.reduce((sum, f) => sum + Number(f.paidAmount), 0);
    const pendingFees = totalFeeAmount - paidFees;

    const feesByStatus = {
      paid: feeChallan.filter((f) => f.status === 'PAID').length,
      pending: feeChallan.filter((f) => f.status === 'PENDING').length,
      overdue: feeChallan.filter((f) => f.status === 'OVERDUE').length,
      collectionRate: feeCollectionRate,
    };

    // Calculate monthly fee history
    const feeHistoryMap = new Map<string, { collected: number; pending: number }>();

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' });
      feeHistoryMap.set(monthName, { collected: 0, pending: 0 });
    }

    // Process Collected (by Paid Date)
    paidHistoryData?.forEach((record) => {
      if (!record.paidDate) return;
      const monthName = new Date(record.paidDate).toLocaleString('default', { month: 'short' });
      if (feeHistoryMap.has(monthName)) {
        const entry: any = feeHistoryMap.get(monthName);
        entry.collected += Number(record.paidAmount);
      }
    });

    // Process Pending (by Issue Date)
    issuedHistoryData?.forEach((record) => {
      // Ignore if status is PAID or CANCELLED
      if (['PAID', 'CANCELLED'].includes(record.status)) return;

      const monthName = new Date(record.issueDate).toLocaleString('default', { month: 'short' });
      if (feeHistoryMap.has(monthName)) {
        const entry: any = feeHistoryMap.get(monthName);
        entry.pending += (Number(record.amount) - Number(record.paidAmount));
      }
    });

    const monthlyFeeCollection = Array.from(feeHistoryMap.entries()).map(([month, data]) => ({
      month,
      collected: data.collected,
      pending: data.pending,
    }));

    // Calculate receivables
    const totalReceivable = (receivablesAgg._sum.amount || 0) - (receivablesAgg._sum.paidAmount || 0);

    // Calculate attendance statistics
    const totalAttendanceToday = attendance.length;
    const presentToday = attendance.filter((a) => a.status === 'PRESENT').length;
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
    const totalStaff = teachers.length + employees.length;
    const teachingStaff = teachers.length;
    const adminStaff = employees.filter(e => ['ADMIN', 'FINANCE', 'HR'].includes(e.empDepartment)).length;
    const supportStaff = employees.length - adminStaff;


    // Calculate exam statistics
    const examsByProgram = {
      intermediate: exams.filter((e) => e.program?.level === 'INTERMEDIATE').length,
      diploma: exams.filter((e) => e.program?.level === 'DIPLOMA').length,
      bs: exams.filter((e) => e.program?.level === 'UNDERGRADUATE').length,
      shortCourse: exams.filter((e) => e.program?.level === 'SHORT_COURSE').length,
      coaching: exams.filter((e) => e.program?.level === 'COACHING').length,
    };

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
        teaching: teachingStaff,
        admin: adminStaff,
        support: supportStaff,
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
      },
      charts: {
        monthlyFeeCollection: monthlyFeeCollection.map(m => ({
          month: m.month,
          collected: m.collected,
          pending: m.pending
        }))
      }
    };
  }
}
