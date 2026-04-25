import {
  BadRequestException,
  ConflictException,
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

  async isNonWorkingDay(
    date: Date,
  ): Promise<{ isBlocked: boolean; reason?: string }> {
    // Only block future dates — holidays and weekends are allowed (frontend handles override)
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );
    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    if (dateOnly.getTime() > today.getTime()) {
      return {
        isBlocked: true,
        reason: 'Cannot mark attendance for future dates',
      };
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
        select: { id: true },
      });
      if (!subject) throw new ForbiddenException('Subject not found');

      // Verify subject is mapped to the resolved class
      const scm = await this.prismaService.subjectClassMapping.findFirst({
        where: { subjectId, classId: resolvedClassId },
      });
      if (!scm) {
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
    requestingUser?: any,
  ) {
    // RBAC check for teachers
    if (requestingUser?.role === 'Teacher') {
      const mapping = await this.prismaService.teacherClassSectionMapping.findFirst({
        where: {
          teacherId: Number(requestingUser.id),
          classId,
          OR: [
            { sectionId: null },
            ...(sectionId ? [{ sectionId }] : []),
          ],
        },
      });
      if (!mapping) throw new ForbiddenException('You are not assigned to this class/section');
    }

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
    requestingUser?: any,
  ) {
    // RBAC check for teachers
    if (requestingUser?.role === 'Teacher') {
      const mapping = await this.prismaService.teacherClassSectionMapping.findFirst({
        where: {
          teacherId: Number(requestingUser.id),
          classId,
          OR: [
            { sectionId: null },
            ...(sectionId ? [{ sectionId }] : []),
          ],
        },
      });
      if (!mapping) throw new ForbiddenException('You are not assigned to this class/section');
    }

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
        // 24-hour lock: prevent updates if attendance was generated/marked more than 24h ago
        const lockedAt = existing.generatedAt || existing.markedAt;
        const hoursSince = (Date.now() - new Date(lockedAt).getTime()) / (1000 * 60 * 60);
        if (hoursSince > 24) {
          throw new BadRequestException(
            `Attendance for ${date} is locked. Records can only be modified within 24 hours of generation. Generated at: ${new Date(lockedAt).toLocaleString()}.`,
          );
        }

        await this.prismaService.attendance.update({
          where: { id: existing.id },
          data: {
            status,
            teacherId: teacherId ?? undefined,
            markedAt: new Date(),
            markedById: teacherId ?? (requestingUser?.id ? Number(requestingUser.id) : undefined),
            autoGenerated: false,
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
            markedById: teacherId ?? (requestingUser?.id ? Number(requestingUser.id) : null),
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
        lName: true,
        class: {
          select: {
            name: true,
            subjectMappings: {
              select: { subject: { select: { id: true, name: true } } },
              orderBy: { subject: { name: 'asc' } },
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
        s.class?.subjectMappings.map((m) => ({
          subjectId: m.subject.id,
          subjectName: m.subject.name,
          attendance: attendanceBySubject[m.subject.id] || [],
        })) || [];

      return {
        id: s.id,
        rollNumber: s.rollNumber,
        name: `${s.fName} ${s.lName || ''}`.trim(),
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
                subjectMappings: { select: { subjectId: true } },
              },
            },
            section: { select: { id: true } },
          },
        },
      },
    });

    const fromDate = new Date(data!.fromDate);
    const toDate = new Date(data!.toDate);

    const subjectIds = data!.requester.class.subjectMappings.map((m) => m.subjectId);
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
    return await this.prismaService.staffAttendance.findMany({
      where: { date: new Date(formattedDate), staff: { isTeaching: true } },
      include: {
        staff: { select: { name: true, id: true } },
        admin: {
          select: { name: true },
        },
      },
    });
  }

  async markTeacherAttendance(
    teacherId: number,
    markedBy: number,
    status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY',
    date: Date,
  ) {
    const targetDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );

    // Check for Non-Working Day
    const dateCheck = await this.isNonWorkingDay(targetDate);
    if (dateCheck.isBlocked) {
      throw new BadRequestException(
        `Cannot mark attendance: ${dateCheck.reason}`,
      );
    }

    // Check if attendance exists
    const existing = await this.prismaService.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId: teacherId,
          date: targetDate,
        },
      },
    });

    if (existing) {
      return await this.prismaService.staffAttendance.update({
        where: { id: existing.id },
        data: {
          status,
          markedBy,
          autoGenerated: false,
          markedAt: new Date(),
        },
      });
    }

    return await this.prismaService.staffAttendance.create({
      data: {
        staffId: teacherId,
        date: targetDate,
        status,
        markedBy,
        autoGenerated: false,
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

  async generateAttendanceStaff(date: Date, generatedById?: number) {
    const targetDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );

    // Resolve generator's name for audit trail
    let generatedByName: string | null = null;
    if (generatedById) {
      // Try admin first, then staff
      const adminUser = await this.prismaService.admin.findUnique({
        where: { id: generatedById },
        select: { name: true },
      }).catch(() => null);
      if (adminUser) {
        generatedByName = adminUser.name;
      } else {
        const staffUser = await this.prismaService.staff.findUnique({
          where: { id: generatedById },
          select: { name: true },
        }).catch(() => null);
        if (staffUser) generatedByName = staffUser.name;
      }
    }

    // Check for future date only (holidays are allowed with override from frontend)
    const dateCheck = await this.isNonWorkingDay(targetDate);
    if (dateCheck.isBlocked) {
      return {
        message: `⛔ ${dateCheck.reason} detected. No attendance generated.`,
      };
    }

    // Fetch ALL leaves for ALL staff for this date
    // specific staff leave logic might rely on teacherId or employeeId,
    // but the unified schema likely has 'staffId' or we need to check all columns.
    // Based on previous code: staffLeave has staffId, teacherId, employeeId.
    const leaves = await this.prismaService.staffLeave.findMany({
      where: {
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });

    // Map by staffId (preferring staffId, falling back to teacherId/employeeId if staffId is missing)
    const leaveMap = new Map();
    leaves.forEach((l) => {
      const id = l.staffId || l.teacherId || l.employeeId;
      if (id) leaveMap.set(id, l);
    });

    // get all active staff (Teaching OR Non-Teaching)
    // We filter for anyone who is active and has at least one role.
    const allStaff = await this.prismaService.staff.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ isTeaching: true }, { isNonTeaching: true }],
      },
      select: { id: true },
    });

    let createdCount = 0;
    for (const staff of allStaff) {
      // Check if attendance already exists
      const existing = await this.prismaService.staffAttendance.findUnique({
        where: {
          staffId_date: {
            staffId: staff.id,
            date: targetDate,
          },
        },
      });

      if (!existing) {
        let status: AttendanceStatus = 'PRESENT';
        let notes: string | null = null;

        if (leaveMap.has(staff.id)) {
          const leave = leaveMap.get(staff.id)!;
          if (leave.status === 'APPROVED') {
            status = 'LEAVE';
            notes = leave.reason;
          } else if (leave.status === 'REJECTED') {
            status = 'ABSENT';
            notes = `Rejected Leave: ${leave.reason}`;
          }
          // For PENDING or other statuses, keep as PRESENT
        }

        await this.prismaService.staffAttendance.create({
          data: {
            staffId: staff.id,
            date: targetDate,
            status,
            notes,
            autoGenerated: true,
            generatedAt: new Date(),
            generatedById: generatedById ?? null,
            generatedByName: generatedByName ?? null,
          },
        });
        createdCount++;
      }
    }
    return {
      message: `✅ Generated ${createdCount} attendance records for all staff for ${targetDate.toDateString()}.`,
    };
  }

  async createHolidayForDate(date: string, title?: string): Promise<Holiday> {
    const parts = date.split('-').map(Number);
    const [year, month, day] = parts;
    const targetDate = new Date(Date.UTC(year, month - 1, day));

    const existing = await this.prismaService.holiday.findFirst({
      where: { date: targetDate },
    });

    if (existing) {
      throw new ConflictException(
        `A holiday already exists for ${date}.`,
      );
    }

    return this.prismaService.holiday.create({
      data: {
        date: targetDate,
        title: title ?? 'Holiday',
        type: 'Manual',
      },
    });
  }

  // ── AttendanceSkip (per-class/section date skip) ──────────────────────────

  async createSkip(classId: number, sectionId: number | null, date: string, reason?: string) {
    const parts = date.split('-').map(Number);
    const [year, month, day] = parts;
    const targetDate = new Date(Date.UTC(year, month - 1, day));

    const existing = await this.prismaService.attendanceSkip.findFirst({
      where: { classId, sectionId: sectionId ?? null, date: targetDate },
    });
    if (existing) {
      throw new ConflictException(`A skip already exists for this class/section on ${date}.`);
    }

    return this.prismaService.attendanceSkip.create({
      data: { classId, sectionId: sectionId ?? null, date: targetDate, reason: reason ?? 'Holiday' },
    });
  }

  async deleteSkip(id: number) {
    return this.prismaService.attendanceSkip.delete({ where: { id } });
  }

  async getSkips(classId?: number, sectionId?: number | null) {
    return this.prismaService.attendanceSkip.findMany({
      where: {
        ...(classId ? { classId } : {}),
        ...(sectionId !== undefined ? { sectionId: sectionId ?? null } : {}),
      },
      orderBy: { date: 'desc' },
    });
  }

  async isSkippedForClass(date: Date, classId: number, sectionId?: number | null): Promise<boolean> {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const skip = await this.prismaService.attendanceSkip.findFirst({
      where: {
        classId,
        date: d,
        OR: [
          { sectionId: null },
          ...(sectionId != null ? [{ sectionId }] : []),
        ],
      },
    });
    return !!skip;
  }

  async generateAttendanceForDate(date: Date, classId?: number, sectionId?: number, subjectId?: number, generatedById?: number) {
    // Normalize to UTC midnight
    const targetDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );

    // Check for global Holiday / future date
    const dateCheck = await this.isNonWorkingDay(targetDate);
    if (dateCheck.isBlocked) {
      return {
        message: `⛔ ${dateCheck.reason} detected. No attendance generated.`,
      };
    }

    // Note: per-class/section skips are informational only — they do NOT block
    // generate attendance since skips are class-wide but attendance is per-subject.

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
      where: {
        students: { some: { passedOut: false } },
        ...(classId ? { id: classId } : {}),
      },
      select: {
        id: true,
        subjectMappings: {
          // Filter to only the requested subject if provided
          where: subjectId ? { subjectId } : undefined,
          select: {
            subjectId: true,
            subject: {
              select: {
                teachers: { select: { teacherId: true } },
              },
            },
          },
        },
        students: {
          where: { passedOut: false, sectionId: null },
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
      for (const mapping of cls.subjectMappings) {
        const teacherId = mapping.subject.teachers?.[0]?.teacherId ?? null;
        const subjectId = mapping.subjectId;

        // ➤ For section-based students
        const filteredSections = sectionId
          ? cls.sections.filter((s) => s.id === sectionId)
          : cls.sections;
        for (const section of filteredSections) {
          for (const student of section.students) {
            const key = `${student.id}-${cls.id}-${section.id}-${subjectId}`;
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
                subjectId,
                teacherId,
                date: targetDate,
                status,
                notes,
                autoGenerated: true,
                generatedAt: new Date(),
                generatedById: generatedById ?? null,
              });
            }
          }
        }

        // ➤ For direct class-level students (no section)
        for (const student of cls.students) {
          const key = `${student.id}-${cls.id}-null-${subjectId}`;
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
              subjectId,
              teacherId,
              date: targetDate,
              status,
              notes,
              autoGenerated: true,
              generatedAt: new Date(),
              generatedById: generatedById ?? null,
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
