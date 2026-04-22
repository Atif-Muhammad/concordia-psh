import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProgramDto } from './dtos/programs/program.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Level } from 'src/common/constants/level.enum';
import { ProgramLevel } from '@prisma/client';
import { ClassDto } from './dtos/classes/class.dto';
import { SectionDto } from './dtos/sections/section.dto';
import { SubjectDto } from './dtos/subjects/subject.dto';
import { TsmDto } from './dtos/tsms/tsm.dto';
import { ClassTimetableDto } from './dtos/timetable/timetable.dto';
import { TcsmDto } from './dtos/tcms/tcm.dto';
import { ScmDto } from './dtos/scm/scm.dto';

@Injectable()
export class AcademicsService {
  constructor(private prismaService: PrismaService) { }
  levelMap: Record<Level, ProgramLevel> = {
    [Level.INTERMEDIATE]: ProgramLevel.INTERMEDIATE,
    [Level.UNDERGRADUATE]: ProgramLevel.UNDERGRADUATE,
    [Level.COACHING]: ProgramLevel.COACHING,
    [Level.DIPLOMA]: ProgramLevel.DIPLOMA,
    [Level.SHORT_COURSE]: ProgramLevel.SHORT_COURSE,
  };

  // PROGRAMS
  async getProgramNames() {
    return await this.prismaService.program.findMany({
      select: {
        id: true,
        name: true,
        level: true,
        duration: true,
        rollPrefix: true,
        department: {
          select: { name: true },
        },
        classes: {
          select: {
            name: true,
            id: true,
            rollPrefix: true,
            sections: { select: { name: true, id: true } },
            feeStructures: {
              select: {
                totalAmount: true,
                installments: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async getPrograms() {
    return await this.prismaService.program.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
  async createProgram(payload: Partial<ProgramDto>) {
    try {
      return await this.prismaService.program.create({
        data: {
          name: payload.name!,
          description: payload.description,
          level: this.levelMap[payload.level!],
          duration: payload.duration!,
          rollPrefix: payload.rollPrefix,
          departmentId: Number(payload.departmentId),
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          `A program named '${payload.name}' already exists in this department`,
        );
      }
      throw err;
    }
  }
  async updateProgram(id: number, payload: Partial<ProgramDto>) {
    return await this.prismaService.program.update({
      where: { id },
      data: {
        name: payload.name!,
        description: payload.description,
        level: this.levelMap[payload.level!],
        duration: payload.duration!,
        rollPrefix: payload.rollPrefix,
        departmentId: Number(payload.departmentId),
      },
    });
  }
  async deleteProgram(id: number) {
    return await this.prismaService.program.delete({ where: { id } });
  }

  // CLASSES
  async getClasses() {
    return await this.prismaService.class.findMany({
      include: {
        sections: { select: { id: true, name: true } },
        program: {
          select: { id: true, name: true, duration: true, rollPrefix: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createClass(payload: ClassDto) {
    const programId = Number(payload.programId);

    // Check if class with same name already exists in this program
    const existingByName = await this.prismaService.class.findFirst({
      where: {
        programId,
        name: payload.name,
      },
    });

    if (existingByName) {
      throw new ConflictException(
        `Class '${payload.name}' already exists for this program`,
      );
    }

    // Check if class with same year/semester combination already exists (if applicable)
    if (payload.year || payload.semester) {
      const existingByPeriod = await this.prismaService.class.findFirst({
        where: {
          programId,
          year: payload.year ? Number(payload.year) : null,
          semester: payload.semester ? Number(payload.semester) : null,
        },
      });

      if (existingByPeriod) {
        throw new ConflictException(
          `A class with this year/semester already exists for this program`,
        );
      }
    }

    return await this.prismaService.class.create({
      data: {
        name: payload.name,
        year: Number(payload.year) || null,
        semester: Number(payload.semester) || null,
        isSemester: Boolean(payload.isSemester),
        rollPrefix: payload.rollPrefix,
        programId,
      },
    });
  }
  async updateClass(id: number, payload: Partial<ClassDto>) {
    const programId = Number(payload.programId);

    if (payload.name) {
      const existingByName = await this.prismaService.class.findFirst({
        where: {
          programId,
          name: payload.name,
          id: { not: id },
        },
      });

      if (existingByName) {
        throw new ConflictException(
          `Another class with name '${payload.name}' already exists for this program`,
        );
      }
    }

    if (payload.year || payload.semester) {
      const existingByPeriod = await this.prismaService.class.findFirst({
        where: {
          programId,
          year: payload.year ? Number(payload.year) : null,
          semester: payload.semester ? Number(payload.semester) : null,
          id: { not: id },
        },
      });

      if (existingByPeriod) {
        throw new ConflictException(
          `Another class with this year/semester already exists for this program`,
        );
      }
    }

    return await this.prismaService.class.update({
      where: { id },
      data: {
        name: payload.name,
        programId,
        year: Number(payload.year) || null,
        semester: Number(payload.semester) || null,
        isSemester: Boolean(payload.isSemester),
        rollPrefix: payload.rollPrefix,
      },
    });
  }

  async deleteClass(id: number) {
    return await this.prismaService.class.delete({ where: { id } });
  }

  // Sections
  async getSections() {
    return await this.prismaService.section.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
  async createSection(payload: SectionDto) {
    return await this.prismaService.section.create({
      data: {
        name: payload.name,
        capacity: payload.capacity != null ? Number(payload.capacity) : null,
        room: payload.room ?? null,
        classId: Number(payload.classId),
      },
    });
  }
  async updateSection(id: number, payload: Partial<SectionDto>) {
    return await this.prismaService.section.update({
      where: { id },
      data: {
        name: payload.name,
        capacity: payload.capacity != null ? Number(payload.capacity) : null,
        room: payload.room ?? null,
        classId: Number(payload.classId),
      },
    });
  }
  async removeSection(id: number) {
    return await this.prismaService.section.delete({ where: { id } });
  }

  // Subjects
  async getSubjects() {
    return await this.prismaService.subject.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
  async createSubject(payload: SubjectDto) {
    return await this.prismaService.subject.create({
      data: {
        name: payload.name,
      },
    });
  }
  async updateSubject(id: number, payload: Partial<SubjectDto>) {
    return await this.prismaService.subject.update({
      where: { id },
      data: {
        name: payload.name,
      },
    });
  }
  async removeSubject(id: number) {
    return await this.prismaService.subject.delete({ where: { id } });
  }

  // Tsm
  async getTsms() {
    return await this.prismaService.teacherSubjectMapping.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
  async createTsm(payload: TsmDto) {
    const exists = await this.prismaService.teacherSubjectMapping.findFirst({
      where: {
        teacherId: Number(payload.teacherId),
        subjectId: Number(payload.subjectId),
      },
    });
    if (exists)
      throw new ConflictException(
        'Selected teacher is already mapped to the selected subject',
      );
    return await this.prismaService.teacherSubjectMapping.create({
      data: {
        teacherId: Number(payload.teacherId),
        subjectId: Number(payload.subjectId),
      },
    });
  }
  async updateTsm(id: number, payload: Partial<TsmDto>) {
    return await this.prismaService.teacherSubjectMapping.update({
      where: { id },
      data: {
        teacherId: Number(payload.teacherId),
        subjectId: Number(payload.subjectId),
      },
    });
  }
  async removeTsm(id: number) {
    return await this.prismaService.teacherSubjectMapping.delete({
      where: { id },
    });
  }

  // Tcm
  async getTcsms(sessionId?: number) {
    return await this.prismaService.teacherClassSectionMapping.findMany({
      where: sessionId ? { sessionId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }
  async createTcsm(payload: TcsmDto) {
    const exists =
      await this.prismaService.teacherClassSectionMapping.findFirst({
        where: {
          teacherId: Number(payload.teacherId),
          classId: Number(payload.classId),
          sectionId: Number(payload.sectionId) || null,
          sessionId: payload.sessionId ?? null,
        },
      });
    if (exists)
      throw new ConflictException(
        'Selected teacher is already mapped to the selected class',
      );
    return await this.prismaService.teacherClassSectionMapping.create({
      data: {
        teacherId: Number(payload.teacherId),
        classId: Number(payload.classId),
        sectionId: Number(payload.sectionId) || null,
        sessionId: payload.sessionId ?? null,
      },
    });
  }
  async updateTcsm(id: number, payload: Partial<TcsmDto>) {
    return await this.prismaService.teacherClassSectionMapping.update({
      where: { id },
      data: {
        teacherId: Number(payload.teacherId),
        classId: Number(payload.classId),
        sectionId: Number(payload.sectionId),
      },
    });
  }
  async removeTcsm(id: number) {
    return await this.prismaService.teacherClassSectionMapping.delete({
      where: { id },
    });
  }

  // timetable (ClassTimetable — one record per class/section/session, slots stored as JSON)
  async getTimetables(sessionId?: number) {
    const rows = await this.prismaService.classTimetable.findMany({
      where: sessionId ? { sessionId } : {},
      include: {
        class: { select: { id: true, name: true, programId: true } },
        section: { select: { id: true, name: true } },
        session: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // For each row, resolve teacher info per slot from TCM + TSM
    return Promise.all(rows.map(async (row) => {
      const slots = (row.slots as any[]) || [];
      const enrichedSlots = await Promise.all(slots.map(async (slot) => {
        // Find teacher assigned to this class (and section if set) who teaches this subject
        const tcms = await this.prismaService.teacherClassSectionMapping.findMany({
          where: {
            classId: row.classId,
            ...(row.sectionId ? { sectionId: row.sectionId } : {}),
          },
          select: { teacherId: true },
        });
        const teacherIds = tcms.map(t => t.teacherId);
        const tsm = await this.prismaService.teacherSubjectMapping.findFirst({
          where: { subjectId: Number(slot.subjectId), teacherId: { in: teacherIds } },
          include: { teacher: { select: { id: true, name: true } } },
        });
        return { ...slot, teacher: tsm?.teacher ?? null };
      }));
      return { ...row, slots: enrichedSlots };
    }));
  }

  async upsertTimetable(payload: ClassTimetableDto) {
    const classId = Number(payload.classId);
    const sectionId = payload.sectionId ? Number(payload.sectionId) : null;
    const sessionId = payload.sessionId ? Number(payload.sessionId) : null;

    const existing = await this.prismaService.classTimetable.findFirst({
      where: { classId, sectionId: sectionId ?? undefined, sessionId: sessionId ?? undefined },
    });

    if (existing) {
      return await this.prismaService.classTimetable.update({
        where: { id: existing.id },
        data: { slots: payload.slots as any },
      });
    }

    return await this.prismaService.classTimetable.create({
      data: { classId, sectionId, sessionId, slots: payload.slots as any },
    });
  }

  async removeTimetable(id: number) {
    return await this.prismaService.classTimetable.delete({ where: { id } });
  }

  // ACADEMIC SESSIONS
  async getAcademicSessions() {
    return await this.prismaService.academicSession.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAcademicSession(payload: any) {
    if (payload.isActive) {
      await this.prismaService.academicSession.updateMany({
        data: { isActive: false },
      });
    }
    return await this.prismaService.academicSession.create({
      data: {
        name: payload.name,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        isActive: Boolean(payload.isActive),
      },
    });
  }

  async updateAcademicSession(id: number, payload: any) {
    if (payload.isActive) {
      await this.prismaService.academicSession.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      });
    }
    return await this.prismaService.academicSession.update({
      where: { id },
      data: {
        name: payload.name,
        startDate: payload.startDate ? new Date(payload.startDate) : undefined,
        endDate: payload.endDate ? new Date(payload.endDate) : undefined,
        isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : undefined,
      },
    });
  }

  async deleteAcademicSession(id: number) {
    return await this.prismaService.academicSession.delete({ where: { id } });
  }

  // SCM (SubjectClassMapping)
  async getScms(sessionId?: number) {
    return await this.prismaService.subjectClassMapping.findMany({
      where: sessionId ? { sessionId } : {},
      include: {
        subject: { select: { name: true } },
        class: {
          select: {
            name: true,
            program: { select: { name: true } },
          },
        },
      },
    });
  }

  // Get subjects for a class with teacher assignment info
  // Returns SCM entries for the class, each with the teacher who teaches
  // that subject IN this class (teacher has both TSM for subject + TCM for class)
  async getSubjectsForClassWithAssignments(classId: number, sessionId?: number) {
    // Get all teachers assigned to this class (scoped to session when provided)
    const classTcms = await this.prismaService.teacherClassSectionMapping.findMany({
      where: { classId, ...(sessionId ? { sessionId } : {}) },
      select: { teacherId: true },
    });
    const classTeacherIds = classTcms.map((t) => t.teacherId);

    // Get SCM entries for this class (scoped to session when provided), with teacher info scoped to class teachers
    const scmMappings = await this.prismaService.subjectClassMapping.findMany({
      where: { classId, ...(sessionId ? { sessionId } : {}) },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            teachers: {
              where: classTeacherIds.length > 0
                ? { teacherId: { in: classTeacherIds } }
                : { teacherId: -1 }, // no match if no class teachers
              select: {
                teacherId: true,
                teacher: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    return scmMappings;
  }

  // Search staff (teaching + non-teaching) by name
  async searchStaff(q: string) {
    return await this.prismaService.staff.findMany({
      where: {
        name: { contains: q },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        isTeaching: true,
        isNonTeaching: true,
        specialization: true,
      },
      take: 20,
      orderBy: { name: 'asc' },
    });
  }

  // Bulk assign teacher to class + subjects (agreement-type relation)
  // Does NOT create SCM — only creates TCM + TSM
  // Enforces: one teacher per subject per class
  async bulkAssignTeacherToClassSubjects(payload: {
    teacherId: number;
    classId: number;
    subjectIds: number[];
    sectionId?: number | null;
    sessionId?: number | null;
  }) {
    const { teacherId, classId, subjectIds, sectionId, sessionId } = payload;

    // Get all teachers already assigned to this class (scoped to session)
    const classTcms = await this.prismaService.teacherClassSectionMapping.findMany({
      where: { classId, sessionId: sessionId ?? null },
      select: { teacherId: true },
    });
    const classTeacherIds = classTcms.map((t) => t.teacherId);

    // Check: for each subject, is it already claimed by another teacher in this class?
    for (const subjectId of subjectIds) {
      const conflict = await this.prismaService.teacherSubjectMapping.findFirst({
        where: {
          subjectId,
          teacherId: { in: classTeacherIds, not: teacherId },
        },
        select: { teacher: { select: { name: true } } },
      });
      if (conflict) {
        throw new ConflictException(
          `Subject is already assigned to another teacher in this class`,
        );
      }
    }

    // 1. Upsert TeacherClassSectionMapping
    const existingTcm = await this.prismaService.teacherClassSectionMapping.findFirst({
      where: { teacherId, classId, sectionId: sectionId ?? null, sessionId: sessionId ?? null },
    });
    if (!existingTcm) {
      await this.prismaService.teacherClassSectionMapping.create({
        data: { teacherId, classId, sectionId: sectionId ?? null, sessionId: sessionId ?? null },
      });
    }

    // 2. Upsert TeacherSubjectMappings for each subject
    for (const subjectId of subjectIds) {
      const existingTsm = await this.prismaService.teacherSubjectMapping.findFirst({
        where: { teacherId, subjectId },
      });
      if (!existingTsm) {
        await this.prismaService.teacherSubjectMapping.create({
          data: { teacherId, subjectId },
        });
      }
    }

    return { success: true, teacherId, classId, subjectIds };
  }

  async createScm(payload: ScmDto) {
    try {
      return await this.prismaService.subjectClassMapping.create({
        data: {
          subjectId: Number(payload.subjectId),
          classId: Number(payload.classId),
          sessionId: payload.sessionId ?? null,
          creditHours: payload.creditHours != null ? Number(payload.creditHours) : null,
          code: payload.code ?? null,
          description: payload.description ?? null,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          'A mapping for this subject and class already exists',
        );
      }
      throw err;
    }
  }

  async updateScm(id: number, payload: Partial<ScmDto>) {
    try {
      return await this.prismaService.subjectClassMapping.update({
        where: { id },
        data: {
          creditHours: payload.creditHours != null ? Number(payload.creditHours) : null,
          code: payload.code ?? null,
          description: payload.description ?? null,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2025') {
        throw new NotFoundException(`SubjectClassMapping with id ${id} not found`);
      }
      throw err;
    }
  }

  async removeScm(id: number) {
    try {
      return await this.prismaService.subjectClassMapping.delete({ where: { id } });
    } catch (err: any) {
      if (err?.code === 'P2025') {
        throw new NotFoundException(`SubjectClassMapping with id ${id} not found`);
      }
      throw err;
    }
  }
}
