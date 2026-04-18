import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { computeDays, deriveMonth } from './hr.helpers';
import { EmployeeDto } from './dtos/employee.dot';
import { StaffDto } from './dtos/staff.dto';
import { CreateStaffLeaveDto, StaffLeaveFilterDto, UpdateStaffLeaveDto } from './dtos/staff-leave.dto';
import {
  EmployeeDepartment,
  Prisma,
  StaffLeaveType,
  StaffStatus,
  StaffType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HrService {
  constructor(private prismService: PrismaService) { }

  // ═══════════════════════════════════════════════════════════════════════════
  // UNIFIED STAFF MANAGEMENT (Teaching + Non-Teaching)
  // ═══════════════════════════════════════════════════════════════════════════

  async getAllStaff(filters?: {
    isTeaching?: boolean;
    isNonTeaching?: boolean;
    search?: string;
    status?: string;
  }) {
    const where: any = {};

    if (filters?.isTeaching !== undefined) {
      where.isTeaching = filters.isTeaching;
    }
    if (filters?.isNonTeaching !== undefined) {
      where.isNonTeaching = filters.isNonTeaching;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { cnic: { contains: filters.search } },
        { phone: { contains: filters.search } },
      ];
    }

    return await this.prismService.staff.findMany({
      where,
      include: {
        department: { select: { name: true } },
        leaveSettings: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getStaffById(id: number) {
    const staff = await this.prismService.staff.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        subjects: { include: { subject: true } },
        classSectionMappings: {
          include: {
            class: { include: { program: true } },
            section: true,
          },
        },
        leaveSettings: true,
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    return staff;
  }

  async createStaff(payload: StaffDto) {
    // Hash password if provided
    let hashedPass = '';
    if (payload.password) {
      hashedPass = await bcrypt.hash(payload.password, 10);
    }

    // Explicitly parse boolean strings from FormData if necessary
    const isTeaching =
      payload.isTeaching === true || payload.isTeaching === ('true' as any);
    const isNonTeaching =
      payload.isNonTeaching === true || payload.isNonTeaching === ('true' as any);

    // Validate: at least one role must be selected
    if (!isTeaching && !isNonTeaching) {
      throw new BadRequestException(
        'Staff must have at least one role (Teaching or Non-Teaching)',
      );
    }

    // Parse JSON strings if necessary
    const permissions =
      typeof payload.permissions === 'string'
        ? JSON.parse(payload.permissions)
        : payload.permissions;
    const documents =
      typeof payload.documents === 'string'
        ? JSON.parse(payload.documents)
        : payload.documents;

    try {
      const created = await this.prismService.staff.create({
        data: {
          name: payload.name,
          fatherName: payload.fatherName || null,
          email: payload.email || null,
          password: hashedPass,
          phone: payload.phone || null,
          cnic: payload.cnic || null,
          address: payload.address || null,
          religion: payload.religion || null,
          photo_url: payload.photo_url || null,
          photo_public_id: payload.photo_public_id || null,
          staffType: payload.staffType as unknown as StaffType,
          status: (payload.status as unknown as StaffStatus) || 'ACTIVE',
          basicPay:
            payload.basicPay && !isNaN(parseFloat(payload.basicPay))
              ? parseFloat(payload.basicPay)
              : null,
          joinDate:
            payload.joinDate && !isNaN(new Date(payload.joinDate).getTime())
              ? new Date(payload.joinDate)
              : undefined,
          leaveDate:
            payload.leaveDate && !isNaN(new Date(payload.leaveDate).getTime())
              ? new Date(payload.leaveDate)
              : null,
          contractStart:
            payload.contractStart &&
              !isNaN(new Date(payload.contractStart).getTime())
              ? new Date(payload.contractStart)
              : null,
          contractEnd:
            payload.contractEnd &&
              !isNaN(new Date(payload.contractEnd).getTime())
              ? new Date(payload.contractEnd)
              : null,

          // Role flags
          isTeaching,
          isNonTeaching,

          permissions: (permissions as unknown as Prisma.JsonObject) || undefined,

          // Teaching-specific fields
          specialization: isTeaching ? payload.specialization : null,
          highestDegree: isTeaching ? payload.highestDegree : null,
          departmentId:
            isTeaching && payload.departmentId && Number(payload.departmentId) > 0
              ? Number(payload.departmentId)
              : null,
          documents: isTeaching
            ? (documents as unknown as Prisma.JsonObject)
            : Prisma.JsonNull,

          // Non-teaching specific fields
          designation: isNonTeaching ? payload.designation : null,
          empDepartment: isNonTeaching
            ? (payload.empDepartment as unknown as EmployeeDepartment)
            : null,
        },
      });

      // Upsert leave settings
      const leaveData = {
        sickAllowed: parseInt(payload.sickAllowed || '0'),
        sickDeduction: parseFloat(payload.sickDeduction || '0'),
        annualAllowed: parseInt(payload.annualAllowed || '0'),
        annualDeduction: parseFloat(payload.annualDeduction || '0'),
        casualAllowed: parseInt(payload.casualAllowed || '0'),
        casualDeduction: parseFloat(payload.casualDeduction || '0'),
      };
      await this.prismService.staffLeaveSettings.upsert({
        where: { staffId: created.id },
        create: { staffId: created.id, ...leaveData },
        update: leaveData,
      });

      return created;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Email or CNIC is already taken by another staff member',
        );
      }
      throw error;
    }
  }

  async updateStaff(id: number, payload: Partial<StaffDto>) {
    let hashedPass: string | undefined;
    if (payload.password) {
      hashedPass = await bcrypt.hash(payload.password, 10);
    }

    // Get existing staff to handle role logic
    const existing = await this.prismService.staff.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Staff not found');
    }

    // Explicitly parse values from payload (which may be strings from FormData)
    const isTeaching =
      payload.isTeaching !== undefined
        ? payload.isTeaching === true || payload.isTeaching === ('true' as any)
        : existing.isTeaching;
    const isNonTeaching =
      payload.isNonTeaching !== undefined
        ? payload.isNonTeaching === true ||
        payload.isNonTeaching === ('true' as any)
        : existing.isNonTeaching;

    // Validate: at least one role must be selected
    if (!isTeaching && !isNonTeaching) {
      throw new BadRequestException(
        'Staff must have at least one role (Teaching or Non-Teaching)',
      );
    }

    const permissions =
      payload.permissions !== undefined
        ? typeof payload.permissions === 'string'
          ? JSON.parse(payload.permissions)
          : payload.permissions
        : undefined;

    const documents =
      payload.documents !== undefined
        ? typeof payload.documents === 'string'
          ? JSON.parse(payload.documents)
          : payload.documents
        : undefined;

    try {
      const updated = await this.prismService.staff.update({
        where: { id },
        data: {
          name: payload.name,
          fatherName: payload.fatherName,
          email: payload.email,
          ...(hashedPass && { password: hashedPass }),
          phone: payload.phone,
          cnic: payload.cnic,
          address: payload.address,
          religion: payload.religion,
          photo_url: payload.photo_url,
          photo_public_id: payload.photo_public_id,
          staffType: payload.staffType as unknown as StaffType,
          status: payload.status as unknown as StaffStatus,
          basicPay:
            payload.basicPay !== undefined
              ? payload.basicPay && !isNaN(parseFloat(payload.basicPay))
                ? parseFloat(payload.basicPay)
                : null
              : undefined,
          joinDate:
            payload.joinDate !== undefined
              ? payload.joinDate && !isNaN(new Date(payload.joinDate).getTime())
                ? new Date(payload.joinDate)
                : null
              : undefined,
          leaveDate:
            payload.leaveDate !== undefined
              ? payload.leaveDate && !isNaN(new Date(payload.leaveDate).getTime())
                ? new Date(payload.leaveDate)
                : null
              : undefined,
          contractStart:
            payload.contractStart !== undefined
              ? payload.contractStart &&
                !isNaN(new Date(payload.contractStart).getTime())
                ? new Date(payload.contractStart)
                : null
              : undefined,
          contractEnd:
            payload.contractEnd !== undefined
              ? payload.contractEnd &&
                !isNaN(new Date(payload.contractEnd).getTime())
                ? new Date(payload.contractEnd)
                : null
              : undefined,

          // Role flags
          isTeaching,
          isNonTeaching,

          ...(permissions !== undefined && {
            permissions: permissions as unknown as Prisma.JsonObject,
          }),

          // Teaching-specific fields
          specialization: isTeaching ? payload.specialization : null,
          highestDegree: isTeaching ? payload.highestDegree : null,
          departmentId: isTeaching
            ? payload.departmentId && Number(payload.departmentId) > 0
              ? Number(payload.departmentId)
              : payload.departmentId === '' || payload.departmentId === null ? null : undefined
            : null,
          documents: isTeaching
            ? documents !== undefined
              ? (documents as unknown as Prisma.JsonObject)
              : undefined // keep current documents if not provided and isTeaching
            : Prisma.JsonNull,

          // Non-teaching specific fields
          designation: isNonTeaching ? payload.designation : null,
          empDepartment: isNonTeaching
            ? (payload.empDepartment as unknown as EmployeeDepartment)
            : null,
        },
      });

      // Upsert leave settings if any leave field is provided
      if (
        payload.sickAllowed !== undefined ||
        payload.sickDeduction !== undefined ||
        payload.annualAllowed !== undefined ||
        payload.annualDeduction !== undefined ||
        payload.casualAllowed !== undefined ||
        payload.casualDeduction !== undefined
      ) {
        const leaveData = {
          sickAllowed: parseInt(payload.sickAllowed || '0'),
          sickDeduction: parseFloat(payload.sickDeduction || '0'),
          annualAllowed: parseInt(payload.annualAllowed || '0'),
          annualDeduction: parseFloat(payload.annualDeduction || '0'),
          casualAllowed: parseInt(payload.casualAllowed || '0'),
          casualDeduction: parseFloat(payload.casualDeduction || '0'),
        };
        await this.prismService.staffLeaveSettings.upsert({
          where: { staffId: id },
          create: { staffId: id, ...leaveData },
          update: leaveData,
        });
      }

      return updated;
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Email or CNIC is already taken by another staff member',
          );
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Staff not found');
        }
      }
      throw error;
    }
  }

  async deleteStaff(id: number) {
    // Fetch staff with relations to check for dependencies
    const staff = await this.prismService.staff.findUnique({
      where: { id },
      include: {
        headOf: true,
        classSectionMappings: { include: { class: true } },
        subjects: { include: { subject: true } },
        assignments: true,
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    // Block deletion if staff is HOD
    if (staff.headOf) {
      throw new ForbiddenException(
        `Cannot delete staff "${staff.name}". They are Head of Department (HOD) for "${staff.headOf.name}". Assign a new HOD first.`,
      );
    }

    // Block deletion if assigned to classes
    if (staff.classSectionMappings.length > 0) {
      const classNames = staff.classSectionMappings
        .map((m) => m.class.name)
        .join(', ');
      throw new ForbiddenException(
        `Cannot delete staff "${staff.name}". They are assigned to class(es): ${classNames}. Remove class assignments first.`,
      );
    }

    // Block deletion if teaching subjects
    if (staff.subjects.length > 0) {
      const subjectNames = staff.subjects.map((s) => s.subject.name).join(', ');
      throw new ForbiddenException(
        `Cannot delete staff "${staff.name}". They teach subject(s): ${subjectNames}. Unassign from subjects first.`,
      );
    }

    // Cleanup: Delete assignments
    if (staff.assignments.length > 0) {
      await this.prismService.assignment.deleteMany({
        where: { teacherId: id },
      });
    }

    // Delete associated photo from cloudinary if exists
    await this.prismService.staff.delete({ where: { id } });

    return { message: `Staff "${staff.name}" has been deleted successfully.` };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // END UNIFIED STAFF MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if a date is a non-working day (weekend or holiday)
   * Copied from AttendanceService to verify dates in HR module
   */
  async isNonWorkingDay(
    date: Date,
  ): Promise<{ isBlocked: boolean; reason?: string }> {
    const dayOfWeek = date.getUTCDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { isBlocked: true, reason: 'Weekend' };
    }

    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    const now = new Date();
    const today = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );

    if (dateOnly.getTime() > today.getTime()) {
      return {
        isBlocked: true,
        reason: 'Cannot mark attendance for future dates',
      };
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
    return await this.prismService.staff.findUnique({
      where: { id },
    });
  }

  async fetchEmpls(dept: string, search?: string) {
    const where: any = { isNonTeaching: true };

    if (dept) {
      where.empDepartment = dept as EmployeeDepartment;
    }

    if (search) {
      where.OR = [{ name: { contains: search } }];
      // Basic check if search string matches a department enum
      const upperSearch = search.toUpperCase();
      if (
        Object.values(EmployeeDepartment).includes(
          upperSearch as EmployeeDepartment,
        )
      ) {
        where.OR.push({ empDepartment: upperSearch as EmployeeDepartment });
      }
    }

    return await this.prismService.staff.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async createEmp(payload: EmployeeDto) {
    return await this.prismService.staff.create({
      data: {
        name: payload.name,
        fatherName: payload.fatherName,
        email: payload.email ?? null,
        password: '', // Employees created via HR don't login as staff usually, or set default
        cnic: payload.cnic,
        address: payload.address,
        designation: payload.designation,
        empDepartment: payload.empDepartment as unknown as EmployeeDepartment,
        staffType: payload.staffType as unknown as StaffType,
        status: payload.status as unknown as StaffStatus,
        basicPay:
          payload.basicPay && !isNaN(parseFloat(payload.basicPay))
            ? parseFloat(payload.basicPay)
            : null,
        phone: payload.contactNumber,
        joinDate: payload.joinDate ? new Date(payload.joinDate) : undefined,
        leaveDate:
          payload.leaveDate && !isNaN(new Date(payload.leaveDate).getTime())
            ? new Date(payload.leaveDate)
            : null,
        photo_url: payload.photo_url,
        photo_public_id: payload.photo_public_id,
        contractStart:
          payload.contractStart &&
            !isNaN(new Date(payload.contractStart).getTime())
            ? new Date(payload.contractStart)
            : null,
        contractEnd:
          payload.contractEnd && !isNaN(new Date(payload.contractEnd).getTime())
            ? new Date(payload.contractEnd)
            : null,
        isTeaching: false,
        isNonTeaching: true,
      },
    });
  }

  async updateEmp(id: number, payload: EmployeeDto) {
    return await this.prismService.staff.update({
      where: { id, isNonTeaching: true },
      data: {
        name: payload.name,
        fatherName: payload.fatherName,
        email: payload.email ?? null,
        cnic: payload.cnic,
        address: payload.address,
        designation: payload.designation,
        empDepartment: payload.empDepartment as unknown as EmployeeDepartment,
        staffType: payload.staffType as unknown as StaffType,
        status: payload.status as unknown as StaffStatus,
        basicPay:
          payload.basicPay && !isNaN(parseFloat(payload.basicPay))
            ? parseFloat(payload.basicPay)
            : undefined,
        phone: payload.contactNumber,
        joinDate: payload.joinDate ? new Date(payload.joinDate) : undefined,
        leaveDate:
          payload.leaveDate && !isNaN(new Date(payload.leaveDate).getTime())
            ? new Date(payload.leaveDate)
            : undefined,
        photo_url: payload.photo_url,
        photo_public_id: payload.photo_public_id,
        contractStart:
          payload.contractStart &&
            !isNaN(new Date(payload.contractStart).getTime())
            ? new Date(payload.contractStart)
            : undefined,
        contractEnd:
          payload.contractEnd && !isNaN(new Date(payload.contractEnd).getTime())
            ? new Date(payload.contractEnd)
            : undefined,
      },
    });
  }

  async deleteEmp(id: number) {
    return await this.prismService.staff.delete({
      where: { id },
    });
  }

  async getEmployeesByDept() {
    const result = await this.prismService.staff.groupBy({
      by: ['empDepartment'],
      where: { isNonTeaching: true },
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

  async getPayrollSheet(month: string, type?: 'teacher' | 'employee' | 'all') {
    // Get payroll settings for deduction rates
    const settings: any = await this.getPayrollSettings();

    // Parse month to get date range (YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of month

    const where: any = { status: 'ACTIVE' };
    if (type === 'teacher') {
      where.isTeaching = true;
    } else if (type === 'employee') {
      where.isNonTeaching = true;
    } else if (type === 'all') {
      // No filter
    }

    const staffMembers = await this.prismService.staff.findMany({
      where,
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
        leaves: {
          where: { month, status: 'APPROVED' },
          select: { leaveType: true, days: true },
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

    return staffMembers.map((staff) => {
      const payroll = staff.payrolls[0];

      // Count absents and leaves from attendance
      const absentCount = staff.attendance.filter(
        (a) => a.status === 'ABSENT',
      ).length;
      const leaveCount = staff.attendance.filter(
        (a) => a.status === 'LEAVE',
      ).length;

      // Calculate advance salary deductions
      const advanceSalaryTotal = staff.advanceSalaries.reduce(
        (sum, advance) => sum + advance.amount,
        0,
      );

      // Calculate deductions for absents/leaves
      const calculatedAbsentDeduction =
        absentCount * (settings.absentDeduction || 0);
      const calculatedLeaveDeduction =
        leaveCount * (settings.leaveDeduction || 0);

      // Use payroll values if they exist, otherwise use calculated values
      const basicSalary = Number(staff.basicPay) || 0;
      const securityDeduction = payroll?.securityDeduction || 0;

      // CRITICAL FIX: If there are advance salaries, use their total
      // Only use payroll.advanceDeduction if there are NO advance salaries
      const advanceDeduction =
        advanceSalaryTotal > 0
          ? advanceSalaryTotal
          : payroll?.advanceDeduction || 0;

      const absentDeduction =
        payroll?.absentDeduction ?? calculatedAbsentDeduction;
      const leaveDeduction = payroll?.leaveDeduction ?? 0; // Stored when leave approved
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
        id: staff.id,
        name: staff.name,
        designation: staff.isTeaching
          ? staff.specialization
            ? `Teacher - ${staff.specialization}`
            : 'Teacher'
          : staff.designation || 'Staff',
        department: staff.isTeaching
          ? staff.department?.name || 'N/A'
          : (staff.empDepartment as string) || 'N/A',
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
        leaveBreakdown: {
          casual: (staff as any).leaves?.filter((l: any) => l.leaveType === 'CASUAL').reduce((s: number, l: any) => s + (l.days || 0), 0) || 0,
          sick:   (staff as any).leaves?.filter((l: any) => l.leaveType === 'SICK').reduce((s: number, l: any) => s + (l.days || 0), 0) || 0,
          annual: (staff as any).leaves?.filter((l: any) => l.leaveType === 'ANNUAL').reduce((s: number, l: any) => s + (l.days || 0), 0) || 0,
        },
        paymentDate: payroll?.paymentDate
          ? new Date(payroll.paymentDate).toLocaleDateString()
          : 'N/A',
      };
    });
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
          staffId: dto.staffId || dto.employeeId || dto.teacherId, // Unified staffId
          employeeId: dto.employeeId, // Legacy
          teacherId: dto.teacherId, // Legacy
        },
      });
    }
  }

  // Leave Management
  async createStaffLeave(dto: CreateStaffLeaveDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('startDate must not be after endDate');
    }

    const days = this.computeDays(startDate, endDate);
    const month = this.deriveMonth(startDate);
    const leaveType: StaffLeaveType = dto.leaveType ?? StaffLeaveType.CASUAL;

    try {
      return await this.prismService.staffLeave.create({
        data: {
          staffId: dto.staffId,
          leaveType,
          startDate,
          endDate,
          days,
          month,
          reason: dto.reason,
        },
      });
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          `Staff with id ${dto.staffId} does not exist`,
        );
      }
      throw error;
    }
  }

  async updateStaffLeave(id: number, dto: UpdateStaffLeaveDto) {
    // If either date is provided but not both, fetch the existing record to fill in the missing date
    let resolvedStartDate: Date | undefined;
    let resolvedEndDate: Date | undefined;

    if (dto.startDate || dto.endDate) {
      if (dto.startDate && dto.endDate) {
        resolvedStartDate = new Date(dto.startDate);
        resolvedEndDate = new Date(dto.endDate);
      } else {
        // Fetch existing record to get the missing date
        const existing = await this.prismService.staffLeave.findUnique({
          where: { id },
        });
        if (!existing) {
          throw new NotFoundException(`StaffLeave with ID ${id} not found`);
        }
        resolvedStartDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
        resolvedEndDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
      }
    }

    const data: any = {};

    if (dto.leaveType !== undefined) data.leaveType = dto.leaveType;
    if (dto.reason !== undefined) data.reason = dto.reason;
    if (dto.status !== undefined) data.status = dto.status;

    if (resolvedStartDate && resolvedEndDate) {
      data.startDate = resolvedStartDate;
      data.endDate = resolvedEndDate;
      data.days = this.computeDays(resolvedStartDate, resolvedEndDate);
      data.month = this.deriveMonth(resolvedStartDate);
    }

    try {
      return await this.prismService.staffLeave.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`StaffLeave with ID ${id} not found`);
      }
      throw error;
    }
  }

  async deleteStaffLeave(id: number) {
    const existing = await this.prismService.staffLeave.findUnique({
      where: { id },
      select: { id: true, locked: true, staffId: true, employeeId: true, teacherId: true, month: true, leaveType: true, status: true } as any,
    });
    const existingAny = existing as any;
    if (existingAny?.locked) throw new Error('This leave record is locked and cannot be deleted.');
    try {
      await this.prismService.staffLeave.delete({ where: { id } });
      // Recalculate payroll deduction after deletion (only if leave was APPROVED)
      if (existingAny?.status === 'APPROVED') {
        const resolvedStaffId = existingAny.staffId || existingAny.employeeId || existingAny.teacherId;
        if (resolvedStaffId) {
          // Pass a synthetic leave object — days=0 since it's deleted; aggregate will recount remaining
          await this.applyLeaveDeductionToPayroll({
            staffId: resolvedStaffId,
            month: existingAny.month,
            leaveType: existingAny.leaveType || 'CASUAL',
            days: 0,
          });
        }
      }
      return { message: 'StaffLeave deleted successfully' };
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`StaffLeave with ID ${id} not found`);
      }
      throw error;
    }
  }

  async getStaffLeaveBalance(staffId: number) {
    const staff = await this.prismService.staff.findUnique({
      where: { id: staffId },
      include: { leaveSettings: true },
    });
    if (!staff) throw new NotFoundException(`Staff ${staffId} not found`);

    const settings = staff.leaveSettings;
    const year = new Date().getFullYear();

    // Count approved/pending leaves taken this year grouped by type
    const taken = await this.prismService.staffLeave.groupBy({
      by: ['leaveType'],
      where: {
        staffId,
        month: { startsWith: `${year}-` },
        status: { in: ['APPROVED', 'PENDING'] },
      },
      _sum: { days: true },
    });

    const takenMap: Record<string, number> = {};
    for (const t of taken) {
      takenMap[t.leaveType] = t._sum.days || 0;
    }

    return {
      SICK:   { taken: takenMap['SICK']   || 0, allowed: settings?.sickAllowed   || 0 },
      ANNUAL: { taken: takenMap['ANNUAL'] || 0, allowed: settings?.annualAllowed || 0 },
      CASUAL: { taken: takenMap['CASUAL'] || 0, allowed: settings?.casualAllowed || 0 },
    };
  }

  async toggleLockStaffLeave(id: number, locked: boolean) {
    return await (this.prismService.staffLeave as any).update({
      where: { id },
      data: { locked },
    });
  }

  async updateStaffLeaveStatus(id: number, status: string) {
    const existing = await this.prismService.staffLeave.findUnique({
      where: { id },
      select: { id: true, locked: true } as any,
    });
    if ((existing as any)?.locked) throw new Error('This leave record is locked and cannot be edited.');
    const leave = await this.prismService.staffLeave.update({
      where: { id },
      data: { status: status as any },
    });
    if (leave.status === 'APPROVED' || leave.status === 'REJECTED') {
      await this.markStaffLeaveAttendance(leave);
    }
    // When approved, calculate and store leave deduction in payroll
    // Resolve staffId — fall back to employeeId/teacherId for legacy records
    const resolvedStaffId = leave.staffId || (leave as any).employeeId || (leave as any).teacherId;
    if (leave.status === 'APPROVED' && resolvedStaffId) {
      await this.applyLeaveDeductionToPayroll({ ...leave, staffId: resolvedStaffId });
    }
    return leave;
  }

  private async applyLeaveDeductionToPayroll(leave: any) {
    const staffId = leave.staffId;
    const month = leave.month;
    const leaveType: string = leave.leaveType || 'CASUAL';
    const days: number = leave.days || 0;

    // Fetch staff leave settings
    const settings = await this.prismService.staffLeaveSettings.findUnique({
      where: { staffId },
    });
    if (!settings) return; // No settings configured — no deduction

    // Determine allowed days and deduction rate for this leave type
    let allowed = 0;
    let ratePerDay = 0;
    if (leaveType === 'SICK') {
      allowed = settings.sickAllowed;
      ratePerDay = settings.sickDeduction;
    } else if (leaveType === 'ANNUAL') {
      allowed = settings.annualAllowed;
      ratePerDay = settings.annualDeduction;
    } else if (leaveType === 'CASUAL') {
      allowed = settings.casualAllowed;
      ratePerDay = settings.casualDeduction;
    } else {
      return; // MATERNITY, PATERNITY, UNPAID, OTHER — no deduction logic
    }

    // Count total approved leaves of this type for this staff in this month
    const totalApproved = await this.prismService.staffLeave.aggregate({
      where: { staffId, month, leaveType: leaveType as any, status: 'APPROVED' },
      _sum: { days: true },
    });
    const totalDays = totalApproved._sum.days || 0;

    // Excess days = total approved days - allowed (floor at 0)
    const excessDays = Math.max(0, totalDays - allowed);
    const deductionAmount = excessDays * ratePerDay;

    // Upsert payroll record for this month — update the relevant deduction field
    const payroll = await this.prismService.payroll.findFirst({
      where: { staffId, month },
    });

    const staff = await this.prismService.staff.findUnique({
      where: { id: staffId },
      select: { basicPay: true },
    });
    const basicSalary = Number(staff?.basicPay) || 0;

    if (payroll) {
      // All leave types (casual, sick, annual) go into leaveDeduction
      // Recalculate total leaveDeduction across ALL types for this month
      const allLeaveTypes = ['CASUAL', 'SICK', 'ANNUAL'] as const;
      let totalLeaveDeduction = 0;
      for (const type of allLeaveTypes) {
        let typeAllowed = 0;
        let typeRate = 0;
        if (type === 'SICK') { typeAllowed = settings.sickAllowed; typeRate = settings.sickDeduction; }
        else if (type === 'ANNUAL') { typeAllowed = settings.annualAllowed; typeRate = settings.annualDeduction; }
        else { typeAllowed = settings.casualAllowed; typeRate = settings.casualDeduction; }
        const typeApproved = await this.prismService.staffLeave.aggregate({
          where: { staffId, month, leaveType: type as any, status: 'APPROVED' },
          _sum: { days: true },
        });
        const typeDays = typeApproved._sum.days || 0;
        totalLeaveDeduction += Math.max(0, typeDays - typeAllowed) * typeRate;
      }

      const updateData: any = { leaveDeduction: totalLeaveDeduction };
      const updated = { ...payroll, ...updateData };
      const totalDeductions =
        (updated.securityDeduction || 0) +
        (updated.advanceDeduction || 0) +
        (updated.absentDeduction || 0) +
        totalLeaveDeduction +
        (updated.otherDeduction || 0) +
        (updated.incomeTax || 0) +
        (updated.eobi || 0) +
        (updated.lateArrivalDeduction || 0);
      const totalAllowances =
        (updated.extraAllowance || 0) +
        (updated.travelAllowance || 0) +
        (updated.houseRentAllowance || 0) +
        (updated.medicalAllowance || 0) +
        (updated.insuranceAllowance || 0) +
        (updated.otherAllowance || 0);
      updateData.totalDeductions = totalDeductions;
      updateData.totalAllowances = totalAllowances;
      updateData.netSalary = basicSalary - totalDeductions + totalAllowances;
      await this.prismService.payroll.update({
        where: { id: payroll.id },
        data: updateData,
      });
    } else {
      // Compute total leave deduction across all types
      const allLeaveTypes = ['CASUAL', 'SICK', 'ANNUAL'] as const;
      let totalLeaveDeduction = 0;
      for (const type of allLeaveTypes) {
        let typeAllowed = 0;
        let typeRate = 0;
        if (type === 'SICK') { typeAllowed = settings.sickAllowed; typeRate = settings.sickDeduction; }
        else if (type === 'ANNUAL') { typeAllowed = settings.annualAllowed; typeRate = settings.annualDeduction; }
        else { typeAllowed = settings.casualAllowed; typeRate = settings.casualDeduction; }
        const typeApproved = await this.prismService.staffLeave.aggregate({
          where: { staffId, month, leaveType: type as any, status: 'APPROVED' },
          _sum: { days: true },
        });
        const typeDays = typeApproved._sum.days || 0;
        totalLeaveDeduction += Math.max(0, typeDays - typeAllowed) * typeRate;
      }
      await this.prismService.payroll.create({
        data: {
          staffId,
          month,
          basicSalary,
          leaveDeduction: totalLeaveDeduction,
          totalDeductions: totalLeaveDeduction,
          totalAllowances: 0,
          netSalary: basicSalary - totalLeaveDeduction,
        },
      });
    }
  }

  async getStaffLeaves(filters: StaffLeaveFilterDto) {
    const where: any = {};

    if (filters.month !== undefined) {
      where.month = filters.month;
    }
    if (filters.staffId !== undefined) {
      where.staffId = filters.staffId;
    }
    if (filters.status !== undefined) {
      where.status = filters.status;
    }
    if (filters.leaveType !== undefined) {
      where.leaveType = filters.leaveType;
    }

    return this.prismService.staffLeave.findMany({
      where,
      include: {
        staff: {
          select: {
            name: true,
            isTeaching: true,
            designation: true,
            specialization: true,
          },
        },
      },
    });
  }

  async getLeaveSheet(month: string, type?: 'teacher' | 'employee' | 'all') {
    const where: any = { status: 'ACTIVE' };

    if (type === 'teacher') {
      where.isTeaching = true;
    } else if (type === 'employee') {
      where.isNonTeaching = true;
    }
    // If 'all' or undefined, no role filter is applied (returns ALL staff)

    const staff = await this.prismService.staff.findMany({
      where,
      include: {
        leaves: {
          where: { month },
          orderBy: { status: 'asc' },
        },
        department: true,
      },
      orderBy: { name: 'asc' },
    });

    return staff
      .map((s) => {
        const leaves = s.leaves || [];
        return leaves.map((leave) => ({
          id: s.id,
          name: s.name,
          designation: s.isTeaching
            ? s.specialization || 'Teacher'
            : s.designation || 'Staff',
          department: s.isTeaching
            ? s.department?.name || 'N/A'
            : (s.empDepartment as string) || 'N/A',
          leaveId: leave.id,
          month,
          startDate: leave.startDate,
          endDate: leave.endDate,
          days: leave.days || 0,
          reason: leave.reason || '',
          status: leave.status || 'PENDING',
          leaveType: leave.leaveType || 'CASUAL',
          locked: (leave as any).locked || false,
        }));
      })
      .flat();
  }

  async upsertLeave(dto: any) {
    // Block edits on locked leaves
    if (dto.leaveId) {
      const existing = await this.prismService.staffLeave.findUnique({
        where: { id: dto.leaveId },
        select: { id: true, locked: true } as any,
      });
      if ((existing as any)?.locked) throw new Error('This leave record is locked and cannot be edited.');
    }

    const data = {
      month: dto.month,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      days: dto.days || 0,
      reason: dto.reason || '',
      status: dto.status || 'PENDING',
      leaveType: dto.leaveType || 'CASUAL',
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
          staffId: dto.staffId || dto.employeeId || dto.teacherId, // Handle legacy
          employeeId: dto.employeeId, // Keep for legacy if needed by existing frontend
          teacherId: dto.teacherId,
        },
      });
    }

    // Mark attendance if leave is approved or rejected for current/past dates
    if (leave.status === 'APPROVED' || leave.status === 'REJECTED') {
      await this.markStaffLeaveAttendance(leave);
    }

    // Recalculate payroll deduction on edit if leave is APPROVED
    // (covers day-count changes, type changes, or status changes via upsert)
    if (dto.leaveId && leave.status === 'APPROVED') {
      const resolvedStaffId = leave.staffId || dto.staffId || dto.employeeId || dto.teacherId;
      if (resolvedStaffId) {
        await this.applyLeaveDeductionToPayroll({ ...leave, staffId: resolvedStaffId });
      }
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

    // Mark attendance for staff
    for (const date of dates) {
      const staffId = leave.staffId || leave.teacherId || leave.employeeId;
      if (staffId) {
        await this.prismService.staffAttendance.upsert({
          where: {
            staffId_date: {
              staffId,
              date,
            },
          },
          update: {
            status: attendanceStatus,
            notes: `Marked ${attendanceStatus.toLowerCase()} automatically based on leave`,
          },
          create: {
            staffId,
            date,
            status: attendanceStatus,
            notes: `Marked ${attendanceStatus.toLowerCase()} automatically based on leave`,
            autoGenerated: true,
          },
        });
      }
    }
  }

  // Staff Attendance Management
  async getStaffAttendance(date: Date) {
    const formattedDate = date.toISOString().split('T')[0];
    return await this.prismService.staffAttendance.findMany({
      where: { date: new Date(formattedDate) }, // Removed isNonTeaching filter to include ALL staff
      include: {
        staff: {
          select: {
            name: true,
            id: true,
            designation: true, // Employee
            specialization: true, // Teacher
            empDepartment: true, // Employee Dept
            department: { select: { name: true } }, // Teacher Dept
            isTeaching: true,
            isNonTeaching: true,
            photo_url: true,
          },
        },
        admin: { select: { name: true } },
      },
      orderBy: {
        staff: { name: 'asc' },
      },
    });
  }

  async markStaffAttendance(data: any) {
    const formattedDate = new Date(data.date).toISOString().split('T')[0];
    const targetDate = new Date(formattedDate);
    targetDate.setUTCHours(0, 0, 0, 0);

    // Check for Non-Working Day
    const dateCheck = await this.isNonWorkingDay(targetDate);
    if (dateCheck.isBlocked) {
      throw new BadRequestException(
        `Cannot mark attendance: ${dateCheck.reason}`,
      );
    }

    const staffId = data.staffId || data.employeeId || data.teacherId;

    // Check if attendance already exists
    const existing = await this.prismService.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId,
          date: new Date(formattedDate),
        },
      },
    });

    if (existing) {
      // Update existing attendance
      return await this.prismService.staffAttendance.update({
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
      return await this.prismService.staffAttendance.create({
        data: {
          staffId,
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
    const startDate = new Date(data.date);
    const endDate = data.endDate ? new Date(data.endDate) : startDate;

    const holidaysToCreate: any[] = [];
    const currentDate = new Date(startDate);
    // Normalize time to avoid infinite loop due to time component issues
    currentDate.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (currentDate.getTime() <= end.getTime()) {
      holidaysToCreate.push({
        title: data.title,
        date: new Date(currentDate), // Create a copy
        type: data.type,
        repeatYearly: data.repeatYearly,
        description: data.description,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return await this.prismService.holiday.createMany({
      data: holidaysToCreate,
    });
  }

  async getHolidays(year?: number, month?: number) {
    const where: any = {};

    if (year) {
      const startDate = new Date(year, month ? month - 1 : 0, 1);
      const endDate = new Date(year, month ? month : 12, 0);
      endDate.setHours(23, 59, 59, 999);

      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    return await this.prismService.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  async deleteHoliday(id: number) {
    return await this.prismService.holiday.delete({
      where: { id },
    });
  }

  async deleteAutoGeneratedAttendance(date: Date) {
    const formattedDate = date.toISOString().split('T')[0];
    const targetDate = new Date(formattedDate);
    const result = await this.prismService.staffAttendance.deleteMany({
      where: {
        date: targetDate,
        autoGenerated: true,
      },
    });
    return {
      message: `Deleted ${result.count} auto-generated attendance records for ${formattedDate}`,
    };
  }

  // Advance Salary Management
  async createAdvanceSalary(data: any) {
    return await this.prismService.advanceSalary.create({
      data: {
        staffId: data.staffId || data.employeeId || data.teacherId,
        amount: data.amount,
        month: data.month,
        remarks: data.remarks,
        adjusted: false,
      },
    });
  }

  async getAdvanceSalaries(
    month?: string,
    type?: 'teacher' | 'employee' | 'all',
  ) {
    const where: any = {};

    if (month) {
      where.month = month;
    }

    if (type === 'teacher') {
      where.staff = { isTeaching: true };
    } else if (type === 'employee') {
      where.staff = { isNonTeaching: true };
    }
    // If 'all', return all

    return await this.prismService.advanceSalary.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            designation: true,
            specialization: true,
            isTeaching: true,
            isNonTeaching: true,
          },
        },
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
    const teacher = await this.prismService.staff.findUnique({
      where: { id: teacherId, isTeaching: true },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Get attendance records for the specified month
    const attendanceRecords = await this.prismService.staffAttendance.findMany({
      where: {
        staffId: teacherId,
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Private Helper Methods
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Returns the inclusive calendar-day count between two dates.
   * Validates: Requirements 3.10
   */
  private computeDays(start: Date, end: Date): number {
    return computeDays(start, end);
  }

  /**
   * Returns the YYYY-MM string derived from the start date.
   * Validates: Requirements 3.11
   */
  private deriveMonth(start: Date): string {
    return deriveMonth(start);
  }

  // History
  async getPayrollHistory(
    staffId: number,
    type: 'teacher' | 'employee' | 'all',
  ) {
    const where: any = {};

    if (type === 'teacher') {
      where.staff = { isTeaching: true };
    } else {
      where.staff = { isNonTeaching: true };
    }
    where.staffId = staffId;

    const payrolls = await this.prismService.payroll.findMany({
      where,
      orderBy: { month: 'desc' },
      include: {
        staff: { include: { department: true } },
      },
    });

    return payrolls.map((p) => {
      const staff = p.staff;
      const designation = staff?.isTeaching
        ? staff?.specialization
          ? `Teacher - ${staff.specialization}`
          : 'Teacher'
        : staff?.designation || 'Employee';

      const dept = staff?.isTeaching
        ? (staff as any).department?.name
        : (staff?.empDepartment as any) || 'N/A';

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
