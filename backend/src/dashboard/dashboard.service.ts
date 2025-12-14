import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}
  async getDashboardStats() {}
  // async getDashboardStats() {
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0);
  //     const tomorrow = new Date(today);
  //     tomorrow.setDate(tomorrow.getDate() + 1);

  //     // Get current month range
  //     const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  //     const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  //     // Parallel queries for efficiency
  //     const [
  //         students,
  //         feeChallan,
  //         attendance,
  //         inventory,
  //         rooms,
  //         staff,
  //         exams,
  //         financeIncome,
  //         financeExpense,
  //     ] = await Promise.all([
  //         // Students
  //         this.prisma.student.findMany({
  //             select: {
  //                 id: true,
  //                 status: true,
  //                 program: true,
  //                 classId: true,
  //             },
  //         }),

  //         // Fee Challan (for current month)
  //         this.prisma.feeChallan.findMany({
  //             where: {
  //                 month: {
  //                     gte: monthStart,
  //                     lte: monthEnd,
  //                 },
  //             },
  //             select: {
  //                 status: true,
  //                 totalAmount: true,
  //                 paidAmount: true,
  //             },
  //         }),

  //         // Today's Attendance
  //         this.prisma.attendance.findMany({
  //             where: {
  //                 date: {
  //                     gte: today,
  //                     lt: tomorrow,
  //                 },
  //             },
  //             select: {
  //                 status: true,
  //             },
  //         }),

  //         // Inventory
  //         this.prisma.schoolInventory.findMany({
  //             select: {
  //                 quantity: true,
  //                 unitPrice: true,
  //             },
  //         }),

  //         // Hostel Rooms
  //         this.prisma.room.findMany({
  //             select: {
  //                 status: true,
  //             },
  //         }),

  //         // Staff
  //         this.prisma.hR.findMany({
  //             select: {
  //                 designation: true,
  //             },
  //         }),

  //         // Exams
  //         this.prisma.examination.findMany({
  //             select: {
  //                 program: true,
  //             },
  //         }),

  //         // Finance Income (current month)
  //         this.prisma.financeIncome.findMany({
  //             where: {
  //                 date: {
  //                     gte: monthStart,
  //                     lte: monthEnd,
  //                 },
  //             },
  //             select: {
  //                 amount: true,
  //             },
  //         }),

  //         // Finance Expense (current month)
  //         this.prisma.financeExpense.findMany({
  //             where: {
  //                 date: {
  //                     gte: monthStart,
  //                     lte: monthEnd,
  //                 },
  //             },
  //             select: {
  //                 amount: true,
  //             },
  //         }),
  //     ]);

  //     // Calculate student statistics
  //     const totalStudents = students.length;
  //     const activeStudents = students.filter((s) => s.status === 'active').length;
  //     const hsscCount = students.filter((s) => s.program === 'HSSC').length;
  //     const diplomaCount = students.filter((s) => s.program === 'Diploma').length;
  //     const bsCount = students.filter((s) => s.program === 'BS').length;

  //     const studentsByStatus = {
  //         active: students.filter((s) => s.status === 'active').length,
  //         expelled: students.filter((s) => s.status === 'expelled').length,
  //         passedOut: students.filter((s) => s.status === 'passed-out').length,
  //     };

  //     // Calculate fee statistics
  //     const totalFeeAmount = feeChallan.reduce(
  //         (sum, f) => sum + Number(f.totalAmount),
  //         0,
  //     );
  //     const paidFees = feeChallan.reduce((sum, f) => sum + Number(f.paidAmount), 0);
  //     const pendingFees = totalFeeAmount - paidFees;
  //     const collectionRate =
  //         totalFeeAmount > 0 ? (paidFees / totalFeeAmount) * 100 : 0;

  //     const feesByStatus = {
  //         paid: feeChallan.filter((f) => f.status === 'paid').length,
  //         pending: feeChallan.filter((f) => f.status === 'pending').length,
  //         overdue: feeChallan.filter((f) => f.status === 'overdue').length,
  //     };

  //     // Calculate attendance statistics
  //     const totalAttendanceToday = attendance.length;
  //     const presentToday = attendance.filter((a) => a.status === 'present').length;
  //     const attendanceRate =
  //         totalAttendanceToday > 0
  //             ? (presentToday / totalAttendanceToday) * 100
  //             : 0;

  //     const attendanceByStatus = {
  //         present: attendance.filter((a) => a.status === 'present').length,
  //         absent: attendance.filter((a) => a.status === 'absent').length,
  //         leave: attendance.filter((a) => a.status === 'leave').length,
  //     };

  //     // Calculate inventory statistics
  //     const totalInventoryValue = inventory.reduce(
  //         (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
  //         0,
  //     );
  //     const inventoryByStock = {
  //         inStock: inventory.filter((i) => i.quantity > 10).length,
  //         lowStock: inventory.filter((i) => i.quantity > 0 && i.quantity <= 10)
  //             .length,
  //         outOfStock: inventory.filter((i) => i.quantity === 0).length,
  //     };

  //     // Calculate hostel statistics
  //     const totalRooms = rooms.length;
  //     const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  //     const occupancyRate =
  //         totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  //     // Calculate staff statistics
  //     const totalStaff = staff.length;
  //     const teachingStaff = staff.filter(
  //         (s) =>
  //             s.designation?.toLowerCase().includes('teacher') ||
  //             s.designation?.toLowerCase().includes('professor'),
  //     ).length;
  //     const adminStaff = staff.filter(
  //         (s) =>
  //             s.designation?.toLowerCase().includes('admin') ||
  //             s.designation?.toLowerCase().includes('clerk'),
  //     ).length;
  //     const supportStaff = totalStaff - teachingStaff - adminStaff;

  //     // Calculate exam statistics
  //     const totalExams = exams.length;
  //     const examsByProgram = {
  //         hssc: exams.filter((e) => e.program === 'HSSC').length,
  //         diploma: exams.filter((e) => e.program === 'Diploma').length,
  //         bs: exams.filter((e) => e.program === 'BS').length,
  //     };

  //     // Calculate finance statistics
  //     const monthlyIncome = financeIncome.reduce(
  //         (sum, i) => sum + Number(i.amount),
  //         0,
  //     );
  //     const monthlyExpense = financeExpense.reduce(
  //         (sum, e) => sum + Number(e.amount),
  //         0,
  //     );

  //     return {
  //         students: {
  //             total: totalStudents,
  //             active: activeStudents,
  //             byProgram: {
  //                 hssc: hsscCount,
  //                 diploma: diplomaCount,
  //                 bs: bsCount,
  //             },
  //             byStatus: studentsByStatus,
  //         },
  //         fees: {
  //             totalAmount: totalFeeAmount,
  //             paidAmount: paidFees,
  //             pendingAmount: pendingFees,
  //             collectionRate: Math.round(collectionRate),
  //             byStatus: feesByStatus,
  //         },
  //         attendance: {
  //             today: {
  //                 total: totalAttendanceToday,
  //                 present: presentToday,
  //                 rate: Math.round(attendanceRate * 10) / 10,
  //             },
  //             byStatus: attendanceByStatus,
  //         },
  //         inventory: {
  //             totalItems: inventory.length,
  //             totalValue: totalInventoryValue,
  //             byStock: inventoryByStock,
  //         },
  //         hostel: {
  //             totalRooms,
  //             occupiedRooms,
  //             vacantRooms: totalRooms - occupiedRooms,
  //             occupancyRate: Math.round(occupancyRate),
  //         },
  //         staff: {
  //             total: totalStaff,
  //             teaching: teachingStaff,
  //             admin: adminStaff,
  //             support: supportStaff,
  //         },
  //         exams: {
  //             total: totalExams,
  //             byProgram: examsByProgram,
  //         },
  //         finance: {
  //             monthlyIncome,
  //             monthlyExpense,
  //             netBalance: monthlyIncome - monthlyExpense,
  //         },
  //     };
  // }
}
