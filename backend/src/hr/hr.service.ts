import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmployeeDto } from './dtos/employee.dot';
import {
  EmployeeDepartment,
  EmployeeStatus,
  EmploymentType,
} from '@prisma/client';

@Injectable()
export class HrService {
  constructor(private prismService: PrismaService) { }

  async fetchEmpls(dept: string) {
    return dept
      ? await this.prismService.employee.findMany({
        where: {
          empDepartment: dept as EmployeeDepartment,
        },
        orderBy: { name: 'asc' },
      })
      : await this.prismService.employee.findMany({
        orderBy: { name: 'asc' },
      });
  }

  async createEmp(payload: EmployeeDto) {
    return await this.prismService.employee.create({
      data: {
        name: payload.name,
        fatherName: payload.fatherName,
        email: payload.email ?? null,
        cnic: payload.cnic,
        address: payload.address,
        designation: payload.designation,
        empDepartment: payload.empDepartment as unknown as EmployeeDepartment,
        employmentType: payload.employmentType as unknown as EmploymentType,
        status: payload.status as unknown as EmployeeStatus,
        basicPay: payload.basicPay ? parseFloat(payload.basicPay) : null,
        phone: payload.contactNumber,
        joinDate: new Date(payload.joinDate),
        leaveDate: payload.leaveDate ? new Date(payload.leaveDate!) : null,
      },
    });
  }

  async updateEmp(id: number, payload: EmployeeDto) {
    return await this.prismService.employee.update({
      where: { id },
      data: {
        name: payload.name,
        fatherName: payload.fatherName,
        email: payload.email ?? null,
        cnic: payload.cnic,
        address: payload.address,
        designation: payload.designation,
        empDepartment: payload.empDepartment as unknown as EmployeeDepartment,
        employmentType: payload.employmentType as unknown as EmploymentType,
        status: payload.status as unknown as EmployeeStatus,
        basicPay: payload.basicPay ? parseFloat(payload.basicPay) : null,
        phone: payload.contactNumber,
        joinDate: new Date(payload.joinDate),
        leaveDate: payload.leaveDate ? new Date(payload.leaveDate!) : null,
      },
    });
  }

  async getEmployeesByDept() {
    const result = await this.prismService.employee.groupBy({
      by: ['empDepartment'],
      _count: {
        _all: true,
      },
    });

    return result.map((item) => ({
      name: item.empDepartment,
      count: item._count._all,
    }));
  }

  async getPayrollSettings() {
    // Get the first (and only) settings record
    let settings = await this.prismService.payrollSettings.findFirst({});

    // If no settings exist, create default ones
    if (!settings) {
      settings = await this.prismService.payrollSettings.create({
        data: {
          absentDeduction: 0,
          leaveDeduction: 0,
          leavesAllowed: 0,
          absentsAllowed: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return settings;
  }

  async updatePayrollSettings(data: {
    absentDeduction?: number;
    leaveDeduction?: number;
    leavesAllowed?: number;
    absentsAllowed?: number;
  }) {
    // Get the first settings record
    const existing = await this.prismService.payrollSettings.findFirst();

    if (existing) {
      // Update existing
      return await this.prismService.payrollSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      // Create new if doesn't exist
      return await this.prismService.payrollSettings.create({
        data: {
          absentDeduction: data.absentDeduction || 0,
          leaveDeduction: data.leaveDeduction || 0,
          leavesAllowed: data.leavesAllowed || 0,
          absentsAllowed: data.absentsAllowed || 0,
        },
      });
    }
  }

  async getPayrollSheet(month: string, type: 'teacher' | 'employee') {
    // Get payroll settings for deduction rates
    const settings: any = await this.getPayrollSettings();
    console.log('Payroll Settings:', settings);

    // Parse month to get date range (YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of month

    if (type === 'teacher') {
      const teachers = await this.prismService.teacher.findMany({
        where: { teacherStatus: 'ACTIVE' },
        include: {
          payrolls: {
            where: { month },
          },
          advanceSalaries: {
            where: {
              month,
              adjusted: false,
            },
          },
          department: true,
          attendance: {
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return teachers.map((t) => {
        const payroll = t.payrolls[0];

        // Count absents and leaves from attendance
        const absentCount = t.attendance.filter(
          (a) => a.status === 'ABSENT',
        ).length;
        const leaveCount = t.attendance.filter(
          (a) => a.status === 'LEAVE',
        ).length;

        // Calculate advance salary deductions
        const advanceSalaryTotal = t.advanceSalaries.reduce(
          (sum, advance) => sum + advance.amount,
          0,
        );


        // Calculate deductions for absents/leaves
        const calculatedAbsentDeduction =
          absentCount * (settings.absentDeduction || 0);
        const calculatedLeaveDeduction =
          leaveCount * (settings.leaveDeduction || 0);

        // Use payroll values if they exist, otherwise use calculated values
        const basicSalary = Number(t.basicPay) || 0;
        const securityDeduction = payroll?.securityDeduction || 0;

        // CRITICAL FIX: If there are advance salaries, use their total
        // Only use payroll.advanceDeduction if there are NO advance salaries
        let advanceDeduction =
          advanceSalaryTotal > 0
            ? advanceSalaryTotal
            : payroll?.advanceDeduction || 0;

        const absentDeduction =
          payroll?.absentDeduction ?? calculatedAbsentDeduction;
        const leaveDeduction = calculatedLeaveDeduction; // Always use calculated value for leaves
        const otherDeduction = payroll?.otherDeduction || 0;

        // Recalculate total deductions
        const totalDeductions =
          securityDeduction +
          advanceDeduction +
          absentDeduction +
          leaveDeduction +
          otherDeduction;

        const extraAllowance = payroll?.extraAllowance || 0;
        const travelAllowance = payroll?.travelAllowance || 0;
        const otherAllowance = payroll?.otherAllowance || 0;
        const totalAllowances =
          extraAllowance + travelAllowance + otherAllowance;

        const netSalary = basicSalary - totalDeductions + totalAllowances;

        // Calculate excess for display purposes
        const excessAbsents = Math.max(
          0,
          absentCount - (settings.absentsAllowed || 0),
        );
        const excessLeaves = Math.max(
          0,
          leaveCount - (settings.leavesAllowed || 0),
        );


        return {
          id: t.id,
          name: t.name,
          designation: t.specialization || 'Teacher',
          department: t.department?.name || 'N/A',
          basicSalary,
          payrollId: payroll?.id,
          month,
          securityDeduction,
          advanceDeduction,
          absentDeduction,
          leaveDeduction,
          otherDeduction,
          totalDeductions,
          extraAllowance,
          travelAllowance,
          otherAllowance,
          totalAllowances,
          netSalary,
          status: payroll?.status || 'UNPAID',
          // Additional info for UI
          absentCount,
          leaveCount,
          excessAbsents,
          excessLeaves,
          advanceSalaryTotal,
          hasAdvanceSalary: advanceSalaryTotal > 0,
        };
      });
    } else {
      // Apply the same logic for employees
      const employees = await this.prismService.employee.findMany({
        where: { status: 'ACTIVE' },
        include: {
          payrolls: {
            where: { month },
          },
          advanceSalaries: {
            where: {
              month,
              adjusted: false,
            },
          },
          attendance: {
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return employees.map((e) => {
        const payroll = e.payrolls[0];

        // Count absents and leaves from attendance
        const absentCount = e.attendance.filter(
          (a) => a.status === 'ABSENT',
        ).length;
        const leaveCount = e.attendance.filter(
          (a) => a.status === 'LEAVE',
        ).length;

        // Calculate advance salary deductions
        const advanceSalaryTotal = e.advanceSalaries.reduce(
          (sum, advance) => sum + advance.amount,
          0,
        );

        // Calculate deductions for absents/leaves
        const calculatedAbsentDeduction =
          absentCount * (settings.absentDeduction || 0);
        const calculatedLeaveDeduction =
          leaveCount * (settings.leaveDeduction || 0);

        // Use payroll values if they exist, otherwise use calculated values
        const basicSalary = Number(e.basicPay) || 0;
        const securityDeduction = payroll?.securityDeduction || 0;

        // Apply the same fix for employees
        let advanceDeduction =
          advanceSalaryTotal > 0
            ? advanceSalaryTotal
            : payroll?.advanceDeduction || 0;

        const absentDeduction =
          payroll?.absentDeduction ?? calculatedAbsentDeduction;
        const leaveDeduction = calculatedLeaveDeduction;
        const otherDeduction = payroll?.otherDeduction || 0;
        const totalDeductions =
          securityDeduction +
          advanceDeduction +
          absentDeduction +
          leaveDeduction +
          otherDeduction;

        const extraAllowance = payroll?.extraAllowance || 0;
        const travelAllowance = payroll?.travelAllowance || 0;
        const otherAllowance = payroll?.otherAllowance || 0;
        const totalAllowances =
          extraAllowance + travelAllowance + otherAllowance;

        const netSalary = basicSalary - totalDeductions + totalAllowances;

        // Calculate excess for display purposes
        const excessAbsents = Math.max(
          0,
          absentCount - (settings.absentsAllowed || 0),
        );
        const excessLeaves = Math.max(
          0,
          leaveCount - (settings.leavesAllowed || 0),
        );

        return {
          id: e.id,
          name: e.name,
          designation: e.designation,
          department: e.empDepartment,
          basicSalary,
          payrollId: payroll?.id,
          month,
          securityDeduction,
          advanceDeduction,
          absentDeduction,
          leaveDeduction,
          otherDeduction,
          totalDeductions,
          extraAllowance,
          travelAllowance,
          otherAllowance,
          totalAllowances,
          netSalary,
          status: payroll?.status || 'UNPAID',
          // Additional info for UI
          absentCount,
          leaveCount,
          excessAbsents,
          excessLeaves,
          advanceSalaryTotal,
          hasAdvanceSalary: advanceSalaryTotal > 0,
        };
      });
    }
  }

  async upsertPayroll(dto: any) {
    // Calculate totals
    const totalDeductions =
      dto.securityDeduction +
      dto.advanceDeduction +
      dto.absentDeduction +
      (dto.leaveDeduction || 0) +
      dto.otherDeduction;
    const totalAllowances =
      dto.extraAllowance + dto.travelAllowance + dto.otherAllowance;
    const netSalary = dto.basicSalary - totalDeductions + totalAllowances;

    const data = {
      month: dto.month,
      basicSalary: dto.basicSalary,
      securityDeduction: dto.securityDeduction,
      advanceDeduction: dto.advanceDeduction,
      absentDeduction: dto.absentDeduction,
      leaveDeduction: dto.leaveDeduction || 0,
      otherDeduction: dto.otherDeduction,
      totalDeductions,
      extraAllowance: dto.extraAllowance,
      travelAllowance: dto.travelAllowance,
      otherAllowance: dto.otherAllowance,
      totalAllowances,
      netSalary,
      status: dto.status || 'UNPAID',
      paymentDate: dto.status === 'PAID' ? new Date() : null,
    };

    if (dto.id) {
      return await this.prismService.payroll.update({
        where: { id: dto.id },
        data,
      });
    } else {
      return await this.prismService.payroll.create({
        data: {
          ...data,
          employeeId: dto.employeeId,
          teacherId: dto.teacherId,
        },
      });
    }
  }

  // Leave Management
  async getLeaveSheet(month: string, type: 'teacher' | 'employee') {
    if (type === 'teacher') {
      const teachers = await this.prismService.teacher.findMany({
        where: { teacherStatus: 'ACTIVE' },
        include: {
          leaves: {
            where: { month },
            orderBy: { status: 'asc' },
          },
          department: true,
        },
      });

      return teachers
        .map((t) => {
          const leaves = t.leaves || [];
          return leaves.map((leave) => ({
            id: t.id,
            name: t.name,
            designation: t.specialization || 'Teacher',
            department: t.department?.name || 'N/A',
            leaveId: leave.id,
            month,
            startDate: leave.startDate,
            endDate: leave.endDate,
            days: leave.days || 0,
            reason: leave.reason || '',
            status: leave.status || 'PENDING',
          }));
        })
        .flat();
    } else {
      const employees = await this.prismService.employee.findMany({
        where: { status: 'ACTIVE' },
        include: {
          leaves: {
            where: { month },
          },
        },
        orderBy: { name: 'asc' },
      });

      return employees
        .map((e) => {
          const leaves = e.leaves || [];
          return leaves.map((leave) => ({
            id: e.id,
            name: e.name,
            designation: e.designation,
            department: e.empDepartment,
            leaveId: leave.id,
            month,
            startDate: leave.startDate,
            endDate: leave.endDate,
            days: leave.days || 0,
            reason: leave.reason || '',
            status: leave.status || 'PENDING',
          }));
        })
        .flat();
    }
  }

  async upsertLeave(dto: any) {
    const data = {
      month: dto.month,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      days: dto.days || 0,
      reason: dto.reason || '',
      status: dto.status || 'PENDING',
    };

    let leave;
    if (dto.leaveId) {
      leave = await this.prismService.staffLeave.update({
        where: { id: dto.leaveId },
        data,
      });
    } else {
      leave = await this.prismService.staffLeave.create({
        data: {
          ...data,
          employeeId: dto.employeeId,
          teacherId: dto.teacherId,
        },
      });
    }

    // Mark attendance if leave is approved or rejected for current/past dates
    if (leave.status === 'APPROVED' || leave.status === 'REJECTED') {
      await this.markStaffLeaveAttendance(leave);
    }

    return leave;
  }

  private async markStaffLeaveAttendance(leave: any) {
    const fromDate = new Date(leave.startDate);
    const toDate = new Date(leave.endDate);

    const attendanceStatus = leave.status === 'APPROVED' ? 'LEAVE' : 'ABSENT';

    // Generate dates in range, only including current and past dates
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      currentDate.setHours(0, 0, 0, 0);

      if (currentDate <= today) {
        const utcDate = new Date(
          Date.UTC(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
          ),
        );
        dates.push(utcDate);
      }
    }

    // Mark attendance for teachers or employees
    for (const date of dates) {
      if (leave.teacherId) {
        await this.prismService.teacherAttendance.upsert({
          where: {
            teacherId_date: {
              teacherId: leave.teacherId,
              date,
            },
          },
          update: {
            status: attendanceStatus,
            notes: `Marked ${attendanceStatus.toLowerCase()} automatically based on leave`,
          },
          create: {
            teacherId: leave.teacherId,
            date,
            status: attendanceStatus,
            notes: `Marked ${attendanceStatus.toLowerCase()} automatically based on leave`,
            autoGenerated: true,
          },
        });
      } else if (leave.employeeId) {
        await this.prismService.employeeAttendance.upsert({
          where: {
            employeeId_date: {
              employeeId: leave.employeeId,
              date,
            },
          },
          update: {
            status: attendanceStatus,
            notes: `Marked ${attendanceStatus.toLowerCase()} automatically based on leave`,
          },
          create: {
            employeeId: leave.employeeId,
            date,
            status: attendanceStatus,
            notes: `Marked ${attendanceStatus.toLowerCase()} automatically based on leave`,
            autoGenerated: true,
          },
        });
      }
    }
  }

  // Employee Attendance Management
  async getEmployeeAttendance(date: Date) {
    const formattedDate = date.toISOString().split('T')[0];
    return await this.prismService.employeeAttendance.findMany({
      where: { date: new Date(formattedDate) },
      include: {
        employee: {
          select: {
            name: true,
            id: true,
            designation: true,
            empDepartment: true,
          },
        },
        admin: { select: { name: true } },
      },
    });
  }

  async markEmployeeAttendance(data: any) {
    const formattedDate = new Date(data.date).toISOString().split('T')[0];

    // Check if attendance already exists
    const existing = await this.prismService.employeeAttendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: new Date(formattedDate),
        },
      },
    });

    if (existing) {
      // Update existing attendance
      return await this.prismService.employeeAttendance.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          markedBy: data.markedBy,
          markedAt: new Date(),
          notes: data.notes,
          autoGenerated: false,
        },
      });
    } else {
      // Create new attendance record
      return await this.prismService.employeeAttendance.create({
        data: {
          employeeId: data.employeeId,
          date: new Date(formattedDate),
          status: data.status,
          markedBy: data.markedBy,
          markedAt: new Date(),
          notes: data.notes,
          autoGenerated: false,
        },
      });
    }
  }

  // Holiday Management
  async createHoliday(data: any) {
    return await this.prismService.holiday.create({
      data: {
        title: data.title,
        date: new Date(data.date),
        type: data.type,
        repeatYearly: data.repeatYearly,
        description: data.description,
      },
    });
  }

  async getHolidays() {
    return await this.prismService.holiday.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async deleteHoliday(id: number) {
    return await this.prismService.holiday.delete({
      where: { id },
    });
  }

  // Advance Salary Management
  async createAdvanceSalary(data: any) {
    return await this.prismService.advanceSalary.create({
      data: {
        employeeId: data.employeeId || null,
        teacherId: data.teacherId || null,
        amount: data.amount,
        month: data.month,
        remarks: data.remarks,
        adjusted: false,
      },
    });
  }

  async getAdvanceSalaries(month?: string, type?: 'teacher' | 'employee') {
    const where: any = {};

    if (month) {
      where.month = month;
    }

    if (type === 'teacher') {
      where.teacherId = { not: null };
    } else if (type === 'employee') {
      where.employeeId = { not: null };
    }

    return await this.prismService.advanceSalary.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, designation: true } },
        teacher: { select: { id: true, name: true, specialization: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAdvanceSalary(id: number, data: any) {
    return await this.prismService.advanceSalary.update({
      where: { id },
      data: {
        amount: data.amount,
        month: data.month,
        remarks: data.remarks,
        adjusted: data.adjusted,
      },
    });
  }

  async deleteAdvanceSalary(id: number) {
    return await this.prismService.advanceSalary.delete({
      where: { id },
    });
  }
}
