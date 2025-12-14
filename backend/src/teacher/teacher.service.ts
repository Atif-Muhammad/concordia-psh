import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TeacherDto } from './dtos/teacher.dto';
import * as bcrypt from 'bcrypt';
import { Prisma, TeacherStatus, TeacherType } from '@prisma/client';

@Injectable()
export class TeacherService {
  constructor(private prismaService: PrismaService) {}

  async getNames() {
    return await this.prismaService.teacher.findMany({
      select: {
        name: true,
        id: true,
        departmentId: true,
        headOf: true,
        specialization: true,
      },
    });
  }

  async getAll() {
    return await this.prismaService.teacher.findMany({
      include: {
        department: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createTeacher(payload: TeacherDto) {
    const hashedPass = await bcrypt.hash(payload.password, 10);

    try {
      return await this.prismaService.teacher.create({
        data: {
          name: payload.name,
          email: payload.email,
          password: hashedPass,
          phone: payload.phone,
          specialization: payload.specialization,
          highestDegree: payload.highestDegree,
          documents: payload.documents as unknown as Prisma.JsonObject,
          departmentId: Number(payload.departmentId),
          teacherType: payload.teacherType as unknown as TeacherType,
          teacherStatus: payload.teacherStatus as unknown as TeacherStatus,
          basicPay: payload.basicPay ? parseFloat(payload.basicPay) : null,
        },
      });
    } catch (error) {
      if (error.code == 'P2002')
        throw new BadRequestException(
          'Teacher Email is already taken by another teacher',
        );
      throw error;
    }
  }
  async updateTeacher(teacherID: number, payload: Partial<TeacherDto>) {
    try {
      return await this.prismaService.teacher.update({
        where: { id: teacherID },
        data: {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          specialization: payload.specialization,
          highestDegree: payload.highestDegree,
          documents: payload.documents as unknown as Prisma.JsonObject,
          departmentId: Number(payload.departmentId),
          teacherType: payload.teacherType as unknown as TeacherType,
          teacherStatus: payload.teacherStatus as unknown as TeacherStatus,
          basicPay: payload.basicPay ? parseFloat(payload.basicPay) : undefined,
        },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2000') {
          throw new BadRequestException(
            'One of the field values exceeds the allowed length.',
          );
        }
        if (error.code === 'P2025') {
          throw new BadRequestException('Teacher not found.');
        }
      }
      throw error;
    }
  }

  async removeTeacher(teacherID: number) {
    // Fetch teacher with all relations
    const teacher = await this.prismaService.teacher.findUnique({
      where: { id: teacherID },
      include: {
        headOf: true,
        classSectionMappings: {
          include: { class: true },
        },
        subjects: {
          include: { subject: true },
        },
        timetables: true,
        assignments: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherID} not found`);
    }

    // 1. BLOCK: Is HOD?
    if (teacher.headOf) {
      throw new ForbiddenException(
        `Cannot delete teacher "${teacher.name}". They are Head of Department (HOD) for "${teacher.headOf.name}". Assign a new HOD first.`,
      );
    }

    // 2. BLOCK: Assigned to any class?
    if (teacher.classSectionMappings.length > 0) {
      const classNames = teacher.classSectionMappings
        .map((m) => m.class.name)
        .join(', ');
      throw new ForbiddenException(
        `Cannot delete teacher "${teacher.name}". They are assigned to class(es): ${classNames}. Remove class assignments first.`,
      );
    }

    // 3. BLOCK: Teaches any subject?
    if (teacher.subjects.length > 0) {
      const subjectNames = teacher.subjects
        .map((s) => s.subject.name)
        .join(', ');
      throw new ForbiddenException(
        `Cannot delete teacher "${teacher.name}". They teach subject(s): ${subjectNames}. Unassign from subjects first.`,
      );
    }

    // 4. CLEANUP: Delete timetable entries
    if (teacher.timetables.length > 0) {
      await this.prismaService.timetable.deleteMany({
        where: { teacherId: teacherID },
      });
    }

    // 5. CLEANUP: Delete assignments
    if (teacher.assignments.length > 0) {
      await this.prismaService.assignment.deleteMany({
        where: { teacherId: teacherID },
      });
    }

    // ALL CLEAR → Delete teacher
    await this.prismaService.teacher.delete({
      where: { id: teacherID },
    });

    return {
      message: `Teacher "${teacher.name}" has been deleted successfully.`,
    };
  }

  // get teacher classes
  async getClasses(teacherId: number) {
    return await this.prismaService.teacherClassSectionMapping.findMany({
      where: { teacherId },
      select: {
        id: true,
        section: {
          select: { id: true, name: true },
        },
        class: {
          select: {
            id: true,
            name: true,
            program: {
              select: { name: true },
            },
          },
        },
      },

      // nice ordering
      orderBy: [{ class: { name: 'asc' } }, { section: { name: 'asc' } }],
    });
  }

  async getSubjects(teacherID: number) {
    return await this.prismaService.teacher.findFirst({
      where: { id: teacherID },
      select: {
        id: true,
        subjects: {
          select: {
            subject: {
              select: {
                id: true,
                name: true,
                classes: {
                  select: {
                    id: true,
                    name: true,
                    sections: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getSubjectsForClass(teacherId: number, classId: number) {
    const mappings = await this.prismaService.teacherSubjectMapping.findMany({
      where: {
        teacherId: teacherId,
        subject: {
          classId: classId,
        },
      },
      select: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            classId: true,
          },
        },
      },
    });

    // Transform to return just the subjects array
    return mappings.map((mapping) => mapping.subject);
  }
}
