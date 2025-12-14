import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExamDto, UpdateExamDto } from './dtos/exam.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMarksDto, UpdateMarksDto } from './dtos/marks.dto';
import { CreateResultDto, UpdateResultDto } from './dtos/result.dto';
import { CreatePositionDto, UpdatePositionDto } from './dtos/position.dto';

@Injectable()
export class ExaminationService {
  constructor(private prisma: PrismaService) {}
  // exam
  create(dto: CreateExamDto) {
    const { schedule, ...examData } = dto;
    return this.prisma.exam.create({
      data: {
        ...examData,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        schedules: schedule
          ? {
              create: schedule.map((s) => ({
                subjectId: Number(s.subjectId),
                date: new Date(s.date),
                startTime: s.startTime,
                endTime: s.endTime,
              })),
            }
          : undefined,
      },
    });
  }

  findAll() {
    return this.prisma.exam.findMany({
      include: {
        program: true,
        class: {
          include: { sections: true },
        },
        schedules: {
          include: { subject: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  update(id: number, dto: Partial<CreateExamDto>) {
    const { schedule, startDate, endDate, ...examData } = dto;
    const data: any = { ...examData };

    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);

    if (schedule) {
      data.schedules = {
        deleteMany: {}, // Clear existing schedule
        create: schedule.map((s) => ({
          subjectId: Number(s.subjectId),
          date: new Date(s.date),
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      };
    }

    return this.prisma.exam.update({
      where: { id },
      data,
    });
  }

  delete(id: number) {
    return this.prisma.exam.delete({ where: { id } });
  }

  //   marks
  async createMarks(dto: CreateMarksDto) {
    // Check if marks already exist for this student, exam, and subject
    const existingMarks = await this.prisma.marks.findFirst({
      where: {
        examId: Number(dto.examId),
        studentId: Number(dto.studentId),
        subject: dto.subject,
      },
    });

    if (existingMarks) {
      throw new Error(
        `Marks already exist for this student in ${dto.subject} for this exam. Please update existing marks instead.`,
      );
    }

    return this.prisma.marks.create({
      data: {
        ...dto,
        examId: Number(dto.examId),
        studentId: Number(dto.studentId),
        totalMarks: Number(dto.totalMarks),
        obtainedMarks: Number(dto.obtainedMarks),
      },
    });
  }

  findAllMarks(examId?: number, sectionId?: number) {
    const whereClause: any = {};
    if (examId) whereClause.examId = examId;
    if (sectionId) whereClause.student = { sectionId };

    return this.prisma.marks.findMany({
      where: whereClause,
      include: { student: true, exam: true },
      orderBy: { student: { rollNumber: 'asc' } },
    });
  }

  updateMarks(id: string, dto: UpdateMarksDto) {
    return this.prisma.marks.update({
      where: { id },
      data: {
        ...dto,
        examId: Number(dto.examId),
        studentId: Number(dto.studentId),
        totalMarks: Number(dto.totalMarks),
        obtainedMarks: Number(dto.obtainedMarks),
      },
    });
  }

  deleteMarks(id: string) {
    return this.prisma.marks.delete({ where: { id } });
  }

  //   result
  createResult(dto: CreateResultDto) {
    return this.prisma.result.create({
      data: {
        ...dto,
        examId: Number(dto.examId),
        studentId: Number(dto.studentId),
        totalMarks: Number(dto.totalMarks),
        obtainedMarks: Number(dto.obtainedMarks),
        percentage: Number(dto.percentage),
        gpa: Number(dto.gpa),
        position: Number(dto.position),
      },
    });
  }
  findAllResults() {
    return this.prisma.result.findMany({
      include: {
        exam: { include: { program: true } },
        student: true,
      },
      orderBy: { exam: { startDate: 'desc' } },
    });
  }
  updateResult(id: string, dto: UpdateResultDto) {
    return this.prisma.result.update({
      where: { id },
      data: {
        ...dto,
        examId: Number(dto.examId),
        studentId: Number(dto.studentId),
        totalMarks: Number(dto.totalMarks),
        obtainedMarks: Number(dto.obtainedMarks),
        percentage: Number(dto.percentage),
        gpa: Number(dto.gpa),
        position: Number(dto.position),
      },
    });
  }
  deleteResult(id: string) {
    return this.prisma.result.delete({ where: { id } });
  }

  async getStudentResult(studentId: number, examId: number) {
    // Fetch student's marks for the exam
    const marks = await this.prisma.marks.findMany({
      where: { studentId, examId },
      orderBy: { subject: 'asc' },
    });

    if (marks.length === 0) {
      throw new NotFoundException(
        'No marks found for this student in this exam',
      );
    }

    // Fetch exam with program and class details
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { program: true, class: true },
    });

    // Fetch student details
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, section: true },
    });

    // Fetch student's result
    const result = await this.prisma.result.findFirst({
      where: { studentId, examId },
    });

    // Fetch student's position
    const position = await this.prisma.position.findFirst({
      where: { studentId, examId },
    });

    return {
      student,
      exam,
      marks,
      result,
      position: position?.position || null,
    };
  }

  // Grading utility functions
  // For 2-year programs (FSc, FA, etc.) - Percentage-based letter grading
  private calculateGradeForIntermediate(percentage: number): {
    grade: string;
    gpa: number;
  } {
    if (percentage >= 90) return { grade: 'A+', gpa: 4.0 };
    if (percentage >= 80) return { grade: 'A', gpa: 3.7 };
    if (percentage >= 70) return { grade: 'B+', gpa: 3.3 };
    if (percentage >= 60) return { grade: 'B', gpa: 3.0 };
    if (percentage >= 50) return { grade: 'C', gpa: 2.3 };
    if (percentage >= 40) return { grade: 'D', gpa: 2.0 };
    if (percentage >= 33) return { grade: 'E', gpa: 1.0 };
    return { grade: 'F', gpa: 0.0 };
  }

  // For 4-year programs (BS, etc.) - GPA system with finer gradations
  private calculateGradeForUndergraduate(percentage: number): {
    grade: string;
    gpa: number;
  } {
    if (percentage >= 90) return { grade: 'A+', gpa: 4.0 };
    if (percentage >= 85) return { grade: 'A', gpa: 3.7 };
    if (percentage >= 80) return { grade: 'B+', gpa: 3.3 };
    if (percentage >= 75) return { grade: 'B', gpa: 3.0 };
    if (percentage >= 70) return { grade: 'C+', gpa: 2.7 };
    if (percentage >= 65) return { grade: 'C', gpa: 2.3 };
    if (percentage >= 60) return { grade: 'D+', gpa: 2.0 };
    if (percentage >= 55) return { grade: 'D', gpa: 1.7 };
    return { grade: 'F', gpa: 0.0 };
  }

  // Generate results from marks for an exam
  async generateResultsForExam(examId: number, classId?: number) {
    try {
      // Fetch exam with program details
      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
        include: { program: true },
      });

      if (!exam) {
        throw new Error('Exam not found');
      }

      // Fetch all marks for this exam
      const whereClause: any = { examId };
      if (classId) {
        whereClause.student = { classId };
      }

      const marks = await this.prisma.marks.findMany({
        where: whereClause,
        include: { student: true },
      });

      // Group marks by student
      const studentMarksMap = marks.reduce((acc, mark) => {
        if (!acc[mark.studentId]) {
          acc[mark.studentId] = {
            student: mark.student,
            marks: [],
            totalMarks: 0,
            obtainedMarks: 0,
          };
        }
        acc[mark.studentId].marks.push(mark);
        acc[mark.studentId].totalMarks += mark.totalMarks;
        acc[mark.studentId].obtainedMarks += mark.obtainedMarks;
        return acc;
      }, {});

      // Generate results for each student
      const results: any[] = [];
      for (const studentId in studentMarksMap) {
        const { student, totalMarks, obtainedMarks } =
          studentMarksMap[studentId];
        const percentage = (obtainedMarks / totalMarks) * 100;

        // Calculate grade based on program duration
        // 4-year and 5-year programs use GPA system, others use percentage-based grading
        const isUndergraduate =
          exam.program.duration?.includes('4') ||
          exam.program.duration?.includes('5') ||
          exam.program.level === 'UNDERGRADUATE';
        const { grade, gpa } = isUndergraduate
          ? this.calculateGradeForUndergraduate(percentage)
          : this.calculateGradeForIntermediate(percentage);

        // Check if result already exists
        const existingResult = await this.prisma.result.findFirst({
          where: { examId, studentId: Number(studentId) },
        });

        if (existingResult) {
          // Update existing result
          const updated = await this.prisma.result.update({
            where: { id: existingResult.id },
            data: {
              totalMarks,
              obtainedMarks,
              percentage: parseFloat(percentage.toFixed(2)),
              gpa: parseFloat(gpa.toFixed(2)),
              grade,
            },
          });
          results.push(updated);
        } else {
          // Create new result
          const created = await this.prisma.result.create({
            data: {
              examId,
              studentId: Number(studentId),
              totalMarks,
              obtainedMarks,
              percentage: parseFloat(percentage.toFixed(2)),
              gpa: parseFloat(gpa.toFixed(2)),
              grade,
            },
          });
          results.push(created);
        }
      }

      return results;
    } catch (error) {
      console.error('Error generating results:', error);
      throw new Error(error.message || 'Failed to generate results');
    }
  }

  // Position methods
  async generatePositionsForExam(examId: number, classId?: number) {
    try {
      // Fetch results for this exam
      const whereClause: any = { examId };
      if (classId) {
        whereClause.student = { classId };
      }

      const results = await this.prisma.result.findMany({
        where: whereClause,
        include: { student: { include: { class: true } } },
        orderBy: { percentage: 'desc' },
      });

      if (results.length === 0) {
        throw new Error('No results found for this exam');
      }

      // Group results by class for proper ranking
      const resultsByClass = results.reduce((acc, result) => {
        const clsId = result.student.classId;
        if (!acc[clsId]) acc[clsId] = [];
        acc[clsId].push(result);
        return acc;
      }, {});

      // Generate positions for each class
      const positions: any[] = [];
      for (const clsId in resultsByClass) {
        const classResults = resultsByClass[clsId].sort(
          (a, b) => b.percentage - a.percentage,
        );

        for (let i = 0; i < classResults.length; i++) {
          const result = classResults[i];
          const positionData = {
            examId,
            classId: Number(clsId),
            studentId: result.studentId,
            position: i + 1,
            totalMarks: result.totalMarks,
            obtainedMarks: result.obtainedMarks,
            percentage: result.percentage,
            gpa: result.gpa,
            grade: result.grade,
          };

          // Check if position already exists
          const existingPosition = await this.prisma.position.findFirst({
            where: {
              examId,
              classId: Number(clsId),
              studentId: result.studentId,
            },
          });

          if (existingPosition) {
            const updated = await this.prisma.position.update({
              where: { id: existingPosition.id },
              data: positionData,
            });
            positions.push(updated);
          } else {
            const created = await this.prisma.position.create({
              data: positionData,
            });
            positions.push(created);
          }
        }
      }

      return positions;
    } catch (error) {
      console.error('Error generating positions:', error);
      throw new Error(error.message || 'Failed to generate positions');
    }
  }

  findAllPositions(examId?: number, classId?: number) {
    const whereClause: any = {};
    if (examId) whereClause.examId = examId;
    if (classId) whereClause.classId = classId;

    return this.prisma.position.findMany({
      where: whereClause,
      include: {
        student: { include: { class: true } },
        exam: { include: { program: true } },
        class: true,
      },
      orderBy: [{ examId: 'desc' }, { classId: 'asc' }, { position: 'asc' }],
    });
  }

  updatePosition(id: string, dto: UpdatePositionDto) {
    return this.prisma.position.update({
      where: { id },
      data: {
        ...dto,
        examId: dto.examId ? Number(dto.examId) : undefined,
        classId: dto.classId ? Number(dto.classId) : undefined,
        studentId: dto.studentId ? Number(dto.studentId) : undefined,
        position: dto.position ? Number(dto.position) : undefined,
        totalMarks: dto.totalMarks ? Number(dto.totalMarks) : undefined,
        obtainedMarks: dto.obtainedMarks
          ? Number(dto.obtainedMarks)
          : undefined,
        percentage: dto.percentage ? Number(dto.percentage) : undefined,
        gpa: dto.gpa ? Number(dto.gpa) : undefined,
      },
    });
  }

  deletePosition(id: string) {
    return this.prisma.position.delete({ where: { id } });
  }
}
