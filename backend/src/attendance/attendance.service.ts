import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AttendanceStatus, Holiday } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { LeaveDto } from './dtos/leave.dto';

@Injectable()
export class AttendanceService {
  constructor(private prismaService: PrismaService) {}

  /**
   * Check if a date is a non-working day (weekend or holiday)
   * @param date The date to check
   * @returns Object with isBlocked flag and optional reason
   */
  async isNonWorkingDay(
    date: Date,
  ): Promise<{ isBlocked: boolean; reason?: string }> {
    // Check weekend (Sunday = 0, Saturday = 6)
    // Use UTC to avoid timezone issues when date is created from string
    const dayOfWeek = date.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { isBlocked: true, reason: 'Weekend' };
    }

    // Normalize date to midnight UTC for comparison
    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    // Fetch all holidays
    const holidays = await this.prismaService.holiday.findMany();

    for (const holiday of holidays) {
      const holidayDate = new Date(holiday.date);
      holidayDate.setUTCHours(0, 0, 0, 0);

      // Check exact date match
      if (holidayDate.getTime() === dateOnly.getTime()) {
        return { isBlocked: true, reason: `Holiday: ${holiday.title}` };
      }

      // Check repeating holidays (same month and day, different year)
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

  async fetchAttendance(
    id: number, // always TeacherClassSectionMapping.id
    date: string,
    subjectId?: number | null,
    teacherId?: number,
  ) {
    // --- Normalize date to start-of-day (UTC-safe) ---
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // --- STEP A: Resolve mapping (always expected) ---
    const mapping =
      await this.prismaService.teacherClassSectionMapping.findUnique({
        where: { id },
        select: { id: true, classId: true, sectionId: true, teacherId: true },
      });

    if (!mapping)
      throw new ForbiddenException('Invalid class-section mapping provided');

    const resolvedClassId = mapping.classId;
    const resolvedSectionId = mapping.sectionId ?? null;

    // --- STEP B: Subject validation (if provided) ---
    if (subjectId) {
      const subject = await this.prismaService.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, classId: true },
      });
      if (!subject) throw new ForbiddenException('Subject not found');
      if (subject.classId !== resolvedClassId) {
        throw new ForbiddenException(
          'This subject does not belong to the selected class/section',
        );
      }

      if (teacherId) {
        const teacherSubject =
          await this.prismaService.teacherSubjectMapping.findFirst({
            where: { teacherId, subjectId },
          });
        if (!teacherSubject)
          throw new ForbiddenException('You are not assigned to this subject');

        const teacherClassMapping =
          await this.prismaService.teacherClassSectionMapping.findFirst({
            where: {
              teacherId,
              classId: resolvedClassId,
              OR: [
                { sectionId: null },
                ...(resolvedSectionId
                  ? [{ sectionId: resolvedSectionId }]
                  : []),
              ],
            },
          });
        if (!teacherClassMapping)
          throw new ForbiddenException(
            'You are not assigned to this class/section',
          );
      }
    }

    // --- STEP C: Decide student filter from the mapping (DON'T trust incoming fetchFor) ---
    const studentWhere = resolvedSectionId
      ? { sectionId: resolvedSectionId }
      : { classId: resolvedClassId };

    // --- STEP D: Fetch students with attendance filtered by a date range (avoids timezone issues) ---
    const students = await this.prismaService.student.findMany({
      where: { ...studentWhere, passedOut: false },
      include: {
        class: true,
        section: true,
        // attendance: true
        attendance: {
          where: {
            date: {
              gte: targetDate,
              lt: nextDate,
            },
            // apply subject filter only if present
            ...(subjectId ? { subjectId } : {}),
          },
        },
      },
      orderBy: { rollNumber: 'asc' }, // optional, makes UI stable
    });
    return { attendance: students };
  }

  async fetchClassAttendance(
    classId: number,
    sectionId: number | null,
    subjectId: number,
    date: string,
  ) {
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    // Check if date is weekend or holiday
    const dateCheck = await this.isNonWorkingDay(targetDate);

    if (dateCheck.isBlocked) {
      return {
        attendance: [],
        isBlocked: true,
        blockReason: dateCheck.reason,
      };
    }

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const studentWhere = sectionId ? { sectionId } : { classId };
    // console.log(studentWhere)
    const students = await this.prismaService.student.findMany({
      where: { ...studentWhere, passedOut: false },
      include: {
        class: true,
        section: true,
        attendance: {
          where: {
            date: {
              gte: targetDate,
              lt: nextDate,
            },
            subjectId,
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });
    return { attendance: students, isBlocked: false };
  }

  async updateAttendance(
    classId: number,
    sectionId: number | null,
    subjectId: number,
    teacherId: number | null,
    date: string,
    payload: { studentId: string; status: AttendanceStatus }[],
  ) {
    // Validate date is not weekend/holiday
    const targetDate = new Date(date);
    const dateCheck = await this.isNonWorkingDay(targetDate);

    if (dateCheck.isBlocked) {
      throw new BadRequestException(
        `Cannot mark attendance: ${dateCheck.reason}`,
      );
    }

    for (const { studentId, status } of payload) {
      // Check if attendance exists
      const existing = await this.prismaService.attendance.findFirst({
        where: {
          studentId: Number(studentId),
          classId,
          sectionId: sectionId ?? null,
          subjectId,
          date: new Date(date),
        },
      });

      if (existing) {
        await this.prismaService.attendance.update({
          where: { id: existing.id },
          data: {
            status,
            teacherId: teacherId ?? undefined, // Only update teacherId if provided
            markedAt: new Date(),
            autoGenerated: false, // Mark as manually updated
          },
        });
      } else {
        // Create if not exists (handling the case where it wasn't generated)
        await this.prismaService.attendance.create({
          data: {
            studentId: Number(studentId),
            classId,
            sectionId: sectionId ?? null,
            subjectId,
            teacherId: teacherId ?? null,
            date: new Date(date),
            status,
            markedAt: new Date(),
          },
        });
      }
    }

    return { success: true };
  }

  async getAttendanceReport(
    start: string,
    end: string,
    classId?: string,
    sectionId?: string,
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const students = await this.prismaService.student.findMany({
      where: {
        ...(classId && classId !== '*' ? { classId: Number(classId) } : {}),
        ...(sectionId && sectionId !== '*'
          ? { sectionId: Number(sectionId) }
          : {}),
        passedOut: false,
      },
      select: {
        id: true,
        rollNumber: true,
        fName: true,
        mName: true,
        lName: true,
        class: {
          select: {
            name: true,
            subjects: {
              select: { id: true, name: true },
              orderBy: { name: 'asc' },
            },
          },
        },
        section: { select: { name: true } },
        attendance: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            date: true,
            status: true,
            subjectId: true,
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    return students.map((s) => {
      // Group attendance by subjectId
      const attendanceBySubject: Record<
        number,
        { date: string; status: string }[]
      > = {};

      s.attendance.forEach((a) => {
        if (!attendanceBySubject[a.subjectId]) {
          attendanceBySubject[a.subjectId] = [];
        }
        attendanceBySubject[a.subjectId].push({
          date: a.date.toISOString().split('T')[0],
          status: a.status.toLowerCase(),
        });
      });

      // Map class subjects to include their attendance
      const subjectsData =
        s.class?.subjects.map((subj) => ({
          subjectId: subj.id,
          subjectName: subj.name,
          attendance: attendanceBySubject[subj.id] || [],
        })) || [];

      return {
        id: s.id,
        rollNumber: s.rollNumber,
        name: `${s.fName} ${s.mName ? s.mName + ' ' : ''}${s.lName}`.trim(),
        class: s.class?.name,
        section: s.section?.name,
        subjects: subjectsData,
      };
    });
  }

  async leaves(page = 1, limit = 100) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.leave.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reason: true,
          fromDate: true,
          toDate: true,
          status: true,
          requester: {
            select: {
              id: true,
              rollNumber: true,
              fName: true,
              mName: true,
              lName: true,
              fatherOrguardian: true,
            },
          },
          approvedBy: { select: { name: true, role: true } },
        },
      }),
      this.prismaService.leave.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async createLeave(payload: LeaveDto) {
    return await this.prismaService.leave.create({
      data: {
        studentId: Number(payload.studentId),
        reason: payload.reason,
        fromDate: new Date(payload.fromDate),
        toDate: new Date(payload.toDate),
      },
    });
  }
  async updateLeave(
    id: number,
    approver: number | null,
    payload: { status: 'APPROVED' | 'REJECTED' },
  ) {
    // console.log(payload)
    const leave = await this.prismaService.leave.update({
      where: { id },
      data: {
        status: payload.status,
        ...(approver ? { approvedById: approver, approvedAt: new Date() } : {}),
      },
    });
    const data = await this.prismaService.leave.findFirst({
      where: { id },
      select: {
        studentId: true,
        fromDate: true,
        toDate: true,
        requester: {
          select: {
            class: {
              select: {
                id: true,
                subjects: { select: { id: true } },
              },
            },
            section: { select: { id: true } },
          },
        },
      },
    });

    const fromDate = new Date(data!.fromDate);
    const toDate = new Date(data!.toDate);

    const subjectIds = data!.requester.class.subjects.map((s) => s.id);
    const classId = data!.requester.class.id;
    const sectionId = data!.requester.section?.id;
    const studentId = data!.studentId;

    // Determine attendance status based on leave approval
    let attendanceStatus: 'LEAVE' | 'ABSENT';
    if (leave.status === 'APPROVED') attendanceStatus = 'LEAVE';
    else if (leave.status === 'REJECTED') attendanceStatus = 'ABSENT';
    else return; // do nothing for other statuses

    // Generate all dates in range, only including current and past dates
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      currentDate.setHours(0, 0, 0, 0);

      // Only include dates that are today or in the past
      if (currentDate <= today) {
        // Normalize to UTC midnight for database storage
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

    // Loop through dates and subjects (only current/past dates)
    for (const date of dates) {
      for (const subjectId of subjectIds) {
        await this.prismaService.attendance.upsert({
          where: {
            studentId_classId_sectionId_subjectId_date: {
              studentId,
              classId,
              sectionId: sectionId ?? 0,
              subjectId,
              date,
            },
          },
          update: {
            status: attendanceStatus,
            notes: `Marked ${attendanceStatus.toLowerCase()} automatically based on leave`,
          },
          create: {
            studentId,
            classId,
            sectionId,
            subjectId,
            status: attendanceStatus,
            date,
            notes: `Marked ${attendanceStatus.toLowerCase()} automatically based on leave`,
          },
        });
      }
    }
  }
  async deleteLeave(id: number) {
    return await this.prismaService.leave.delete({
      where: { id },
    });
  }

  // teacher attendance and leave

  async getTeacherAttendance(date: Date) {
    const formattedDate = date.toISOString().split('T')[0];
    return await this.prismaService.teacherAttendance.findMany({
      where: { date: new Date(formattedDate) },
      include: {
        teacher: { select: { name: true, id: true } },
        admin: {
          select: { name: true },
        },
      },
    });
  }

  async markTeacherAttendance(
    id: number,
    markedBy: number,
    status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY',
    date: Date,
  ) {
    const formattedDate = date.toISOString().split('T')[0];
    // check attendance exists?
    const teacher = await this.prismaService.teacherAttendance.findFirst({
      where: { id },
    });
    if (!teacher)
      throw new UnprocessableEntityException('Teacher attendance not found');
    return await this.prismaService.teacherAttendance.update({
      where: { id }, // Only use id, not composite key
      data: {
        status,
        markedBy,
        autoGenerated: false, // Mark as manually updated
        markedAt: new Date(),
      },
    });
  }

  // fetch student leaves (if any)
  async fetchLeaves(studentId: number) {
    return await this.prismaService.leave.findMany({
      where: { studentId },
    });
  }

  async generateAttendanceTeacher(date: Date) {
    const targetDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );

    // Check for Holiday
    const holiday: Holiday | null = await this.prismaService.holiday.findFirst({
      where: { date: targetDate },
    });

    if (holiday) {
      return {
        message: `🌴 Holiday detected: ${holiday.title}. No attendance generated.`,
      };
    }

    // Fetch ALL leaves for teachers for this date (not just APPROVED)
    const leaves = await this.prismaService.staffLeave.findMany({
      where: {
        teacherId: { not: null },
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });
    const leaveMap = new Map(leaves.map((l) => [l.teacherId, l]));

    // get all active teachers
    const teachers = await this.prismaService.teacher.findMany({
      where: { teacherStatus: 'ACTIVE' },
      select: { id: true },
    });

    let createdCount = 0;
    for (const teacher of teachers) {
      // Check if attendance already exists
      const existing = await this.prismaService.teacherAttendance.findUnique({
        where: {
          teacherId_date: {
            teacherId: teacher.id,
            date: targetDate,
          },
        },
      });

      if (!existing) {
        let status: AttendanceStatus = 'PRESENT';
        let notes: string | null = null;

        if (leaveMap.has(teacher.id)) {
          const leave = leaveMap.get(teacher.id)!;
          if (leave.status === 'APPROVED') {
            status = 'LEAVE';
            notes = leave.reason;
          } else if (leave.status === 'REJECTED') {
            status = 'ABSENT';
            notes = `Rejected Leave: ${leave.reason}`;
          }
          // For PENDING or other statuses, keep as PRESENT
        }

        await this.prismaService.teacherAttendance.create({
          data: {
            teacherId: teacher.id,
            date: targetDate,
            status,
            notes,
            autoGenerated: true,
          },
        });
        createdCount++;
      }
    }
    return {
      message: `✅ Generated ${createdCount} attendance records for teachers for ${targetDate.toDateString()}.`,
    };
  }

  async generateAttendanceEmployee(date: Date) {
    const targetDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );

    // Check for Holiday
    const holiday = await this.prismaService.holiday.findFirst({
      where: { date: targetDate },
    });

    if (holiday) {
      return {
        message: `🌴 Holiday detected: ${holiday.title}. No attendance generated.`,
      };
    }

    // Fetch ALL leaves for employees for this date (not just APPROVED)
    const leaves = await this.prismaService.staffLeave.findMany({
      where: {
        employeeId: { not: null },
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });
    const leaveMap = new Map(leaves.map((l) => [l.employeeId, l]));

    // get all active employees
    const employees = await this.prismaService.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    let createdCount = 0;
    for (const employee of employees) {
      // Check if attendance already exists
      const existing = await this.prismaService.employeeAttendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: targetDate,
          },
        },
      });

      if (!existing) {
        let status: AttendanceStatus = 'PRESENT';
        let notes: string | null = null;

        if (leaveMap.has(employee.id)) {
          const leave = leaveMap.get(employee.id)!;
          if (leave.status === 'APPROVED') {
            status = 'LEAVE';
            notes = leave.reason;
          } else if (leave.status === 'REJECTED') {
            status = 'ABSENT';
            notes = `Rejected Leave: ${leave.reason}`;
          }
          // For PENDING or other statuses, keep as PRESENT
        }

        await this.prismaService.employeeAttendance.create({
          data: {
            employeeId: employee.id,
            date: targetDate,
            status,
            notes,
            autoGenerated: true,
          },
        });
        createdCount++;
      }
    }
    return {
      message: `✅ Generated ${createdCount} attendance records for employees for ${targetDate.toDateString()}.`,
    };
  }

  async generateAttendanceForDate(date: Date) {
    // Normalize to UTC midnight
    const targetDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );

    // Check for Holiday
    const holiday: Holiday | null = await this.prismaService.holiday.findFirst({
      where: { date: targetDate },
    });
    if (holiday) {
      return {
        message: `🌴 Holiday detected: ${holiday.title}. No attendance generated.`,
      };
    }

    // Fetch ALL leaves for students for this date (not just APPROVED)
    const leaves = await this.prismaService.leave.findMany({
      where: {
        fromDate: { lte: targetDate },
        toDate: { gte: targetDate },
      },
    });
    const leaveMap = new Map(leaves.map((l) => [l.studentId, l]));

    // STEP 1: Fetch classes, sections, and students (both direct + via section)
    const classes = await this.prismaService.class.findMany({
      where: { students: { some: { passedOut: false } } },
      select: {
        id: true,
        subjects: {
          select: {
            id: true,
            teachers: { select: { teacherId: true } },
          },
        },
        students: {
          where: { passedOut: false, sectionId: null }, // direct class students
          select: { id: true },
        },
        sections: {
          select: {
            id: true,
            students: {
              where: { passedOut: false },
              select: { id: true },
            },
          },
        },
      },
    });

    // STEP 2: Fetch existing attendance
    const existing = await this.prismaService.attendance.findMany({
      where: { date: targetDate },
      select: {
        studentId: true,
        classId: true,
        sectionId: true,
        subjectId: true,
      },
    });

    const existingKeys = new Set(
      existing.map(
        (a) =>
          `${a.studentId}-${a.classId}-${a.sectionId ?? 'null'}-${a.subjectId ?? 'null'}`,
      ),
    );

    // STEP 3: Build new attendance entries
    const newEntries: any[] = [];

    for (const cls of classes) {
      for (const subject of cls.subjects) {
        const teacherId = subject.teachers?.[0]?.teacherId ?? null;

        // ➤ For section-based students
        for (const section of cls.sections) {
          for (const student of section.students) {
            const key = `${student.id}-${cls.id}-${section.id}-${subject.id}`;
            if (!existingKeys.has(key)) {
              let status: AttendanceStatus = 'PRESENT';
              let notes: string | null = null;

              if (leaveMap.has(student.id)) {
                const leave = leaveMap.get(student.id)!;
                if (leave.status === 'APPROVED') {
                  status = 'LEAVE';
                  notes = leave.reason;
                } else if (leave.status === 'REJECTED') {
                  status = 'ABSENT';
                  notes = `Rejected Leave: ${leave.reason}`;
                }
                // For PENDING, CANCELLED, or other statuses, keep as PRESENT
              }

              newEntries.push({
                studentId: student.id,
                classId: cls.id,
                sectionId: section.id,
                subjectId: subject.id,
                teacherId,
                date: targetDate,
                status,
                notes,
                autoGenerated: true,
              });
            }
          }
        }

        // ➤ For direct class-level students (no section)
        for (const student of cls.students) {
          const key = `${student.id}-${cls.id}-null-${subject.id}`;
          if (!existingKeys.has(key)) {
            let status: AttendanceStatus = 'PRESENT';
            let notes: string | null = null;

            if (leaveMap.has(student.id)) {
              const leave = leaveMap.get(student.id)!;
              if (leave.status === 'APPROVED') {
                status = 'LEAVE';
                notes = leave.reason;
              } else if (leave.status === 'REJECTED') {
                status = 'ABSENT';
                notes = `Rejected Leave: ${leave.reason}`;
              }
              // For PENDING, CANCELLED, or other statuses, keep as PRESENT
            }

            newEntries.push({
              studentId: student.id,
              classId: cls.id,
              sectionId: null,
              subjectId: subject.id,
              teacherId,
              date: targetDate,
              status,
              notes,
              autoGenerated: true,
            });
          }
        }
      }
    }

    // STEP 4: Save entries
    if (newEntries.length === 0) {
      return { message: '✅ Attendance already exists for this date.' };
    }

    await this.prismaService.attendance.createMany({
      data: newEntries,
    });

    return {
      message: `✅ Generated ${newEntries.length} attendance records for ${targetDate.toDateString()}.`,
    };
  }
}
