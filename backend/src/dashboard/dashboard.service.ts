import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }
  async getDashboardStats(filters?: { month?: string; year?: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let monthStart: Date;
    let monthEnd: Date;
    let isOverall = true;

    if (filters?.month && filters?.year) {
      isOverall = false;
      const year = parseInt(filters.year);
      const monthIndex = new Date(Date.parse(`${filters.month} 1, ${filters.year}`)).getMonth();
      monthStart = new Date(year, monthIndex, 1);
      monthEnd = new Date(year, monthIndex + 1, 0);
    } else {
      // Default to current month
      monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

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
      financeIncome,
      financeExpense,
      paidHistoryData,
      issuedHistoryData,
      receivablesAgg,
      teacherSalaries,
      employeeSalaries
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

      // Finance Income (selected month)
      this.prisma.financeIncome.findMany({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          amount: true,
        },
      }),

      // Finance Expense (selected month)
      this.prisma.financeExpense.findMany({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          amount: true,
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

      // Payroll - Teachers (Paid in selected month)
      this.prisma.payroll.findMany({
        where: {
          teacherId: { not: null },
          status: 'PAID',
          paymentDate: {
            gte: monthStart,
            lte: monthEnd,
          }
        },
        select: {
          netSalary: true
        }
      }),

      // Payroll - Employees (Paid in selected month)
      this.prisma.payroll.findMany({
        where: {
          employeeId: { not: null },
          status: 'PAID',
          paymentDate: {
            gte: monthStart,
            lte: monthEnd,
          }
        },
        select: {
          netSalary: true
        }
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

    // Calculate fee statistics
    const totalFeeAmount = feeChallan.reduce(
      (sum, f) => sum + Number(f.amount),
      0,
    );
    const paidFees = feeChallan.reduce((sum, f) => sum + Number(f.paidAmount), 0);
    const pendingFees = totalFeeAmount - paidFees;
    const collectionRate =
      totalFeeAmount > 0 ? (paidFees / totalFeeAmount) * 100 : 0;

    const feesByStatus = {
      paid: feeChallan.filter((f) => f.status === 'PAID').length,
      pending: feeChallan.filter((f) => f.status === 'PENDING').length,
      overdue: feeChallan.filter((f) => f.status === 'OVERDUE').length,
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
    const monthlyIncome = financeIncome.reduce(
      (sum, i) => sum + Number(i.amount),
      0,
    );

    const expenseFromFinance = financeExpense.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    const salaryExpense =
      teacherSalaries.reduce((sum, s) => sum + Number(s.netSalary), 0) +
      employeeSalaries.reduce((sum, s) => sum + Number(s.netSalary), 0);

    const monthlyExpense = expenseFromFinance + salaryExpense;

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
        collectionRate: Math.round(collectionRate),
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
