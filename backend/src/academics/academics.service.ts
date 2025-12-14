import { ConflictException, HttpStatus, Injectable } from '@nestjs/common';
import { ProgramDto } from './dtos/programs/program.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Level } from 'src/common/constants/level.enum';
import { ProgramLevel } from '@prisma/client';
import { ClassDto } from './dtos/classes/class.dto';
import { SectionDto } from './dtos/sections/section.dto';
import { SubjectDto } from './dtos/subjects/subject.dto';
import { TsmDto } from './dtos/tsms/tsm.dto';
import { TimetableDto } from './dtos/timetable/timetable.dto';
import { TcsmDto } from './dtos/tcms/tcm.dto';

@Injectable()
export class AcademicsService {
  constructor(private prismaService: PrismaService) {}
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
        department: {
          select: { name: true },
        },
        classes: {
          select: {
            name: true,
            id: true,
            sections: { select: { name: true, id: true } },
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
    return await this.prismaService.program.create({
      data: {
        name: payload.name!,
        description: payload.description,
        level: this.levelMap[payload.level!],
        duration: payload.duration!,
        hasSections: Boolean(payload.hasSections),
        departmentId: Number(payload.departmentId),
      },
    });
  }
  async updateProgram(id: number, payload: Partial<ProgramDto>) {
    return await this.prismaService.program.update({
      where: { id },
      data: {
        name: payload.name!,
        description: payload.description,
        level: this.levelMap[payload.level!],
        duration: payload.duration!,
        hasSections: Boolean(payload.hasSections),
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
        program: { select: { id: true, name: true, duration: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createClass(payload: ClassDto) {
    return await this.prismaService.class.create({
      data: {
        name: payload.name,
        year: Number(payload.year) || null,
        semester: Number(payload.semester) || null,
        isSemester: Boolean(payload.isSemester),
        programId: Number(payload.programId),
      },
    });
  }
  async updateClass(id: number, payload: Partial<ClassDto>) {
    return await this.prismaService.class.update({
      where: { id },
      data: {
        name: payload.name,
        programId: Number(payload.programId),
        year: Number(payload.year) || null,
        semester: Number(payload.semester) || null,
        isSemester: Boolean(payload.isSemester),
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
        capacity: Number(payload.capacity),
        room: payload.room,
        classId: Number(payload.classId),
      },
    });
  }
  async updateSection(id: number, payload: Partial<SectionDto>) {
    return await this.prismaService.section.update({
      where: { id },
      data: {
        name: payload.name,
        capacity: Number(payload.capacity),
        room: payload.room,
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
        code: payload.code,
        creditHours: Number(payload.creditHours),
        description: payload.description,
        classId: Number(payload.classId),
      },
    });
  }
  async updateSubject(id: number, payload: Partial<SubjectDto>) {
    return await this.prismaService.subject.update({
      where: { id },
      data: {
        name: payload.name,
        code: payload.code,
        creditHours: Number(payload.creditHours),
        description: payload.description,
        classId: Number(payload.classId),
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
  async getTcsms() {
    return await this.prismaService.teacherClassSectionMapping.findMany({
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

  // timetable
  async getTimetables() {
    return await this.prismaService.timetable.findMany({});
  }
  async createTimetable(payload: TimetableDto) {
    const exists = await this.prismaService.timetable.findFirst({
      where: {
        teacherId: Number(payload.teacherId),
        subjectId: Number(payload.subjectId),
        dayOfWeek: payload.dayOfWeek,
        startTime: payload.startTime,
        endTime: payload.endTime,
      },
    });
    if (exists)
      throw new ConflictException(
        'Selected teacher is already mapped to the selected class',
      );
    return await this.prismaService.timetable.create({
      data: {
        teacherId: Number(payload.teacherId),
        subjectId: Number(payload.subjectId),
        classId: Number(payload.classId),
        sectionId: payload.sectionId ? Number(payload.sectionId) : null,
        dayOfWeek: payload.dayOfWeek,
        startTime: payload.startTime,
        endTime: payload.endTime,
        room: payload.room,
      },
    });
  }
  async updateTimetable(id: number, payload: Partial<TimetableDto>) {
    return await this.prismaService.timetable.update({
      where: { id },
      data: {
        teacherId: Number(payload.teacherId),
        subjectId: Number(payload.subjectId),
        classId: Number(payload.classId),
        sectionId: payload.sectionId ? Number(payload.sectionId) : null,
        dayOfWeek: payload.dayOfWeek,
        startTime: payload.startTime,
        endTime: payload.endTime,
        room: payload.room,
      },
    });
  }
  async removeTimetable(id: number) {
    return await this.prismaService.timetable.delete({ where: { id } });
  }
}
