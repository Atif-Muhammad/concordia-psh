import { Injectable, BadRequestException } from '@nestjs/common';
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



  /**
   * Check if a date is a non-working day (weekend or holiday)
   * Copied from AttendanceService to verify dates in HR module
   */
  async isNonWorkingDay(date: Date): Promise<{ isBlocked: boolean; reason?: string }> {
    const dayOfWeek = date.getUTCDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { isBlocked: true, reason: 'Weekend' };
    }

    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    if (dateOnly.getTime() > today.getTime()) {
      return { isBlocked: true, reason: 'Cannot mark attendance for future dates' };
    }

    const holidays = await this.prismService.holiday.findMany();
    for (const holiday of holidays) {
      const holidayDate = new Date(holiday.date);
      holidayDate.setUTCHours(0, 0, 0, 0);

      if (holidayDate.getTime() === dateOnly.getTime()) {
        return { isBlocked: true, reason: `Holiday: ${holiday.title}` };
      }
      if (
        holiday.repeatYearly &&
        holidayDate.getUTCMonth() === dateOnly.getUTCMonth() &&
        holidayDate.getUTCDate() === dateOnly.getUTCDate()
      ) {
        return { isBlocked: true, reason: `Holiday: ${holiday.title}` };
      }
    }
    return { isBlocked: false };
  }

  async findOne(id: number) {
    return await this.prismService.employee.findUnique({
      where: { id },
    });
  }

  async fetchEmpls(dept: string, search?: string) {
    const where: any = {};

    if (dept) {
      where.empDepartment = dept as EmployeeDepartment;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
      ];
      // Basic check if search string matches a department enum
      const upperSearch = search.toUpperCase();
      if (Object.values(EmployeeDepartment).includes(upperSearch as EmployeeDepartment)) {
        where.OR.push({ empDepartment: upperSearch as EmployeeDepartment });
      }
    }

    return await this.prismService.employee.findMany({
      where,
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
        basicPay: payload.basicPay && !isNaN(parseFloat(payload.basicPay)) ? parseFloat(payload.basicPay) : null,
        phone: payload.contactNumber,
        joinDate: payload.joinDate ? new Date(payload.joinDate) : undefined,
        leaveDate: payload.leaveDate && !isNaN(new Date(payload.leaveDate).getTime()) ? new Date(payload.leaveDate) : null,
        photo_url: payload.photo_url,
        photo_public_id: payload.photo_public_id,
        contractStart: payload.contractStart && !isNaN(new Date(payload.contractStart).getTime()) ? new Date(payload.contractStart) : null,
        contractEnd: payload.contractEnd && !isNaN(new Date(payload.contractEnd).getTime()) ? new Date(payload.contractEnd) : null,
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
        basicPay: payload.basicPay && !isNaN(parseFloat(payload.basicPay)) ? parseFloat(payload.basicPay) : undefined,
        phone: payload.contactNumber,
        joinDate: payload.joinDate ? new Date(payload.joinDate) : undefined,
        leaveDate: payload.leaveDate && !isNaN(new Date(payload.leaveDate).getTime()) ? new Date(payload.leaveDate) : undefined,
        photo_url: payload.photo_url,
        photo_public_id: payload.photo_public_id,
        contractStart: payload.contractStart && !isNaN(new Date(payload.contractStart).getTime()) ? new Date(payload.contractStart) : undefined,
        contractEnd: payload.contractEnd && !isNaN(new Date(payload.contractEnd).getTime()) ? new Date(payload.contractEnd) : undefined,
      },
    });
  }

  async deleteEmp(id: number) {
    return await this.prismService.employee.delete({
      where: { id },
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
    // console.log('Payroll Settings:', settings);

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
        const advanceDeduction =
          advanceSalaryTotal > 0
            ? advanceSalaryTotal
            : payroll?.advanceDeduction || 0;

        const absentDeduction =
          payroll?.absentDeduction ?? calculatedAbsentDeduction;
        const leaveDeduction = calculatedLeaveDeduction; // Always use calculated value for leaves
        const otherDeduction = payroll?.otherDeduction || 0;
        const incomeTax = payroll?.incomeTax || 0;
        const eobi = payroll?.eobi || 0;
        const lateArrivalDeduction = payroll?.lateArrivalDeduction || 0;

        // Recalculate total deductions
        const totalDeductions =
          securityDeduction +
          advanceDeduction +
          absentDeduction +
          leaveDeduction +
          otherDeduction +
          incomeTax +
          eobi +
          lateArrivalDeduction;

        const extraAllowance = payroll?.extraAllowance || 0;
        const travelAllowance = payroll?.travelAllowance || 0;
        const houseRentAllowance = payroll?.houseRentAllowance || 0;
        const medicalAllowance = payroll?.medicalAllowance || 0;
        const insuranceAllowance = payroll?.insuranceAllowance || 0;
        const otherAllowance = payroll?.otherAllowance || 0;
        const totalAllowances =
          extraAllowance +
          travelAllowance +
          houseRentAllowance +
          medicalAllowance +
          insuranceAllowance +
          otherAllowance;

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
          designation: t.specialization
            ? `Teacher - ${t.specialization}`
            : 'Teacher',
          department: t.department?.name || 'N/A',
          basicSalary,
          payrollId: payroll?.id,
          month,
          securityDeduction,
          advanceDeduction,
          absentDeduction,
          leaveDeduction,
          otherDeduction,
          incomeTax,
          eobi,
          lateArrivalDeduction,
          totalDeductions,
          extraAllowance,
          travelAllowance,
          houseRentAllowance,
          medicalAllowance,
          insuranceAllowance,
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
          paymentDate: payroll?.paymentDate
            ? new Date(payroll.paymentDate).toLocaleDateString()
            : 'N/A',
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
        const advanceDeduction =
          advanceSalaryTotal > 0
            ? advanceSalaryTotal
            : payroll?.advanceDeduction || 0;

        const absentDeduction =
          payroll?.absentDeduction ?? calculatedAbsentDeduction;
        const leaveDeduction = calculatedLeaveDeduction;
        const otherDeduction = payroll?.otherDeduction || 0;
        const incomeTax = payroll?.incomeTax || 0;
        const eobi = payroll?.eobi || 0;
        const lateArrivalDeduction = payroll?.lateArrivalDeduction || 0;

        const totalDeductions =
          securityDeduction +
          advanceDeduction +
          absentDeduction +
          leaveDeduction +
          otherDeduction +
          incomeTax +
          eobi +
          lateArrivalDeduction;

        const extraAllowance = payroll?.extraAllowance || 0;
        const travelAllowance = payroll?.travelAllowance || 0;
        const houseRentAllowance = payroll?.houseRentAllowance || 0;
        const medicalAllowance = payroll?.medicalAllowance || 0;
        const insuranceAllowance = payroll?.insuranceAllowance || 0;
        const otherAllowance = payroll?.otherAllowance || 0;
        const totalAllowances =
          extraAllowance +
          travelAllowance +
          houseRentAllowance +
          medicalAllowance +
          insuranceAllowance +
          otherAllowance;

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
          incomeTax,
          eobi,
          lateArrivalDeduction,
          totalDeductions,
          extraAllowance,
          travelAllowance,
          houseRentAllowance,
          medicalAllowance,
          insuranceAllowance,
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
          paymentDate: payroll?.paymentDate
            ? new Date(payroll.paymentDate).toLocaleDateString()
            : 'N/A',
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
      dto.otherDeduction +
      (dto.incomeTax || 0) +
      (dto.eobi || 0) +
      (dto.lateArrivalDeduction || 0);
    const totalAllowances =
      dto.extraAllowance +
      dto.travelAllowance +
      (dto.houseRentAllowance || 0) +
      (dto.medicalAllowance || 0) +
      (dto.insuranceAllowance || 0) +
      dto.otherAllowance;
    const netSalary = dto.basicSalary - totalDeductions + totalAllowances;

    const data = {
      month: dto.month,
      basicSalary: dto.basicSalary,
      securityDeduction: dto.securityDeduction,
      advanceDeduction: dto.advanceDeduction,
      absentDeduction: dto.absentDeduction,
      leaveDeduction: dto.leaveDeduction || 0,
      otherDeduction: dto.otherDeduction,
      incomeTax: dto.incomeTax || 0,
      eobi: dto.eobi || 0,
      lateArrivalDeduction: dto.lateArrivalDeduction || 0,
      totalDeductions,
      extraAllowance: dto.extraAllowance,
      travelAllowance: dto.travelAllowance,
      houseRentAllowance: dto.houseRentAllowance || 0,
      medicalAllowance: dto.medicalAllowance || 0,
      insuranceAllowance: dto.insuranceAllowance || 0,
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
    const targetDate = new Date(formattedDate);
    targetDate.setUTCHours(0, 0, 0, 0);

    // Check for Non-Working Day
    const dateCheck = await this.isNonWorkingDay(targetDate);
    if (dateCheck.isBlocked) {
      throw new BadRequestException(`Cannot mark attendance: ${dateCheck.reason}`);
    }

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

  // summary
  async getTeacherAttendanceSummary(
    teacherId: number,
    startDate: Date,
    endDate: Date,
  ) {
    // Verify teacher exists
    const teacher = await this.prismService.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Get attendance records for the specified month
    const attendanceRecords =
      await this.prismService.teacherAttendance.findMany({
        where: {
          teacherId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          status: true,
          date: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

    // Calculate summary
    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      leaves: 0,
      halfDay: 0,
      holiday: 0,
      totalDays: attendanceRecords.length,
      month: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
      teacherName: teacher.name,
      teacherId: teacher.id,
      details: attendanceRecords, // Optional: include detailed records
    };

    // Count each status
    attendanceRecords.forEach((record) => {
      switch (record.status) {
        case 'PRESENT':
          summary.present++;
          break;
        case 'ABSENT':
          summary.absent++;
          break;
        case 'LEAVE':
          summary.leaves++;
          break;
        case 'HOLIDAY':
          summary.holiday++;
          break;
      }
    });

    return summary;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Payroll Template Management
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async createPayrollTemplate(data: any) {
    return await this.prismService.payrollTemplate.create({
      data: {
        name: data.name,
        type: data.type,
        htmlContent: data.htmlContent,
        isDefault: data.isDefault || false,
      },
    });
  }

  async getPayrollTemplates() {
    return await this.prismService.payrollTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePayrollTemplate(id: number, data: any) {
    return await this.prismService.payrollTemplate.update({
      where: { id },
      data,
    });
  }

  async deletePayrollTemplate(id: number) {
    return await this.prismService.payrollTemplate.delete({
      where: { id },
    });
  }

  // History
  async getPayrollHistory(staffId: number, type: 'teacher' | 'employee') {
    const where: any = {};

    if (type === 'teacher') {
      where.teacherId = staffId;
    } else {
      where.employeeId = staffId;
    }

    const payrolls = await this.prismService.payroll.findMany({
      where,
      orderBy: { month: 'desc' },
      include: {
        teacher: { include: { department: true } },
        employee: true,
        // Note: 'advanceSalary' relation in Payroll is NOT a list, it's just 'advanceDeduction' field.
        // We rely on the stored snapshot values in the Payroll record.
      },
    });

    return payrolls.map((p) => {
      const staff = p.teacher || p.employee;
      const designation =
        type === 'teacher'
          ? p.teacher?.specialization
            ? `Teacher - ${p.teacher.specialization}`
            : 'Teacher'
          : p.employee?.designation || 'Employee';

      const dept =
        type === 'teacher'
          ? p.teacher?.department?.name
          : (p.employee?.empDepartment as any) || 'N/A';

      const totalAllowances =
        (p.extraAllowance || 0) +
        (p.travelAllowance || 0) +
        (p.houseRentAllowance || 0) +
        (p.medicalAllowance || 0) +
        (p.insuranceAllowance || 0) +
        (p.otherAllowance || 0);

      const totalDeductions =
        (p.securityDeduction || 0) +
        (p.advanceDeduction || 0) +
        (p.absentDeduction || 0) +
        (p.leaveDeduction || 0) +
        (p.otherDeduction || 0) +
        (p.incomeTax || 0) +
        (p.eobi || 0) +
        (p.lateArrivalDeduction || 0);

      const netSalary =
        (Number(p.basicSalary) || 0) + totalAllowances - totalDeductions;

      return {
        id: p.id,
        month: p.month, // "2024-10"
        // MAPPING FOR TEMPLATE COMPATIBILITY:
        // name -> Month String (so it appears in the Name column)
        name: new Date(p.month + '-01').toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        }),
        designation: designation,
        department: dept,
        basicSalary: Number(p.basicSalary) || 0,
        totalAllowances,
        totalDeductions,
        netSalary,
        status: p.status,
        paymentDate: p.paymentDate,
      };
    });
  }
}
