import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentDto } from './dtos/student.dto';

@Injectable()
export class StudentService {
  constructor(private prismaService: PrismaService) { }

  async findOne(id: number) {
    return await this.prismaService.student.findFirst({
      where: { id },
      orderBy: { createdAt: 'desc' },
      include: {
        program: { select: { name: true, id: true } },
      },
    });
  }
  async search(searchFor: string) {
    return await this.prismaService.student.findMany({
      where: {
        OR: [
          { fName: { contains: searchFor } },
          { mName: { contains: searchFor } },
          { lName: { contains: searchFor } },
          { rollNumber: { contains: searchFor } },
          { fatherOrguardian: { contains: searchFor } },
        ],
        passedOut: false,
      },
      select: {
        id: true,
        fName: true,
        mName: true,
        lName: true,
        rollNumber: true,
        fatherOrguardian: true,
        program: { select: { name: true } },
        class: { select: { name: true } },
      },
    });
  }
  async getAllStudents() {
    return await this.prismaService.student.findMany({
      where: { passedOut: false },
      orderBy: { createdAt: 'desc' },
      include: {
        program: { select: { name: true, id: true } },
        class: { select: { id: true, name: true } }
      },
    });
  }
  async getPassedOutStudents() {
    return await this.prismaService.student.findMany({
      where: { passedOut: true },
    });
  }

  async createStudent(payload: StudentDto) {
    return await this.prismaService.student.create({
      data: {
        ...payload,
        dob: new Date(payload.dob),
        classId: Number(payload.classId),
        programId: Number(payload.programId),
        sectionId: Number(payload.sectionId),
        inquiryId: payload.inquiryId ? Number(payload.inquiryId) : null,
      },
    });
  }

  async updateStudent(id: number, payload: Partial<StudentDto>) {
    // console.log(payload)
    const student = await this.prismaService.student.findUnique({
      where: { id },
    });
    if (!student)
      throw new NotFoundException(`Student with id ${id} not found`);

    // Check for promotion fee clearance
    if (payload.classId && Number(payload.classId) !== student.classId) {
      // 1. Find current fee structure
      if (student.programId && student.classId) {
        const currentFeeStructure = await this.prismaService.feeStructure.findUnique({
          where: {
            programId_classId: {
              programId: student.programId,
              classId: student.classId
            }
          }
        });

        if (currentFeeStructure) {
          // 2. Calculate paid amount and installments for current session
          const paidChallans = await this.prismaService.feeChallan.findMany({
            where: {
              studentId: student.id,
              feeStructureId: currentFeeStructure.id,
              status: 'PAID'
            }
          });

          const totalPaid = paidChallans.reduce((sum, c) => sum + c.paidAmount, 0);
          const paidInstallments = paidChallans.length;

          // 3. Check clearance
          // Cleared if:
          // - Paid all installments (count >= total installments)
          // - OR Paid full amount (amount >= total amount)
          const isCleared =
            paidInstallments >= currentFeeStructure.installments ||
            totalPaid >= currentFeeStructure.totalAmount;

          if (!isCleared) {
            const currentClass = await this.prismaService.class.findUnique({ where: { id: student.classId } });
            throw new BadRequestException(
              `Cannot promote student. Outstanding fees for current class (${currentClass?.name || 'Unknown Class'}). ` +
              `Paid: ${paidInstallments}/${currentFeeStructure.installments} installments, ` +
              `Amount: ${totalPaid}/${currentFeeStructure.totalAmount}`
            );
          }
        }
      }
    }

    // 1. Remove raw FK fields to avoid type conflict
    const { programId, classId, sectionId, documents, dob, photo, ...rest } =
      payload;

    // 2. Build clean data object
    const data: any = { ...rest };

    // Handle DOB
    if (dob) {
      data.dob = new Date(dob);
    }

    // Handle documents (ensure it's an object)
    if (documents !== undefined) {
      data.documents =
        typeof documents === 'string' ? JSON.parse(documents) : documents;
    }

    // Connect relations only if IDs are provided
    if (programId !== undefined) {
      data.program = { connect: { id: Number(programId) } };
    }

    if (classId !== undefined) {
      data.class = { connect: { id: Number(classId) } };
    }

    if (
      sectionId !== undefined &&
      sectionId !== null &&
      !isNaN(Number(sectionId))
    ) {
      data.section = { connect: { id: Number(sectionId) } };
    } else if (sectionId === null) {
      data.section = { disconnect: true };
    }

    // Optional: handle photo_url / photo_public_id from controller
    if (payload.photo_url) data.photo_url = payload.photo_url;
    if (payload.photo_public_id) data.photo_public_id = payload.photo_public_id;

    return this.prismaService.student.update({
      where: { id },
      data,
    });
  }

  async removeStudent(id: number) {
    // Delete dependent attendance and leaves first (to avoid FK constraint errors)
    await this.prismaService.$transaction([
      this.prismaService.attendance.deleteMany({ where: { studentId: id } }),
      this.prismaService.leave.deleteMany({ where: { studentId: id } }),
    ]);

    // Now delete the student (no includes allowed)
    const deletedStudent = await this.prismaService.student.delete({
      where: { id },
    });

    return deletedStudent;
  }


  async getStudentByNumber(rollNumber: string) {
    return await this.prismaService.student.findFirst({
      where: { rollNumber }
    })
  }

  async promote(id: number) {
    const student = await this.prismaService.student.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            program: { include: { classes: { include: { sections: true } } } },
          },
        },
        section: true,
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    if (student.passedOut)
      throw new BadRequestException('Student already passed out');

    const program = student.class.program;

    // FIXED SORTING
    const classes = program.classes.sort((a, b) => {
      if (a.isSemester && b.isSemester) {
        return (a.semester ?? 0) - (b.semester ?? 0);
      }
      if (!a.isSemester && !b.isSemester) {
        return (a.year ?? 0) - (b.year ?? 0);
      }
      if (a.isSemester && !b.isSemester) return 1;
      if (!a.isSemester && b.isSemester) return -1;
      return 0;
    });

    const curIdx = classes.findIndex((c) => c.id === student.classId);
    if (curIdx >= classes.length - 1) {
      throw new BadRequestException('Student is already in the final class');
    }

    const nextClass = classes[curIdx + 1];
    const matchingSection = nextClass.sections.find(
      (s) => s.name === student.section?.name,
    );

    return this.prismaService.student.update({
      where: { id },
      data: {
        class: { connect: { id: nextClass.id } },
        section: matchingSection
          ? { connect: { id: matchingSection.id } }
          : { disconnect: true },
        passedOut: false,
      },
    });
  }
  async demote(id: number) {
    const student = await this.prismaService.student.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            program: { include: { classes: { include: { sections: true } } } },
          },
        },
        section: true,
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    if (student.passedOut)
      throw new BadRequestException('Student already passed out');

    const program = student.class.program;
    const classes = program.classes.sort((a, b) => {
      if (a.isSemester && b.isSemester) {
        return (a.semester ?? 0) - (b.semester ?? 0);
      }
      if (!a.isSemester && !b.isSemester) {
        return (a.year ?? 0) - (b.year ?? 0);
      }
      if (a.isSemester && !b.isSemester) return 1;
      if (!a.isSemester && b.isSemester) return -1;
      return 0;
    });

    const curIdx = classes.findIndex((c) => c.id === student.classId);
    if (curIdx <= 0) {
      throw new BadRequestException('Cannot demote below entry level');
    }

    const prevClass = classes[curIdx - 1];
    const matchingSection = prevClass.sections.find(
      (s) => s.name === student.section?.name,
    );

    return this.prismaService.student.update({
      where: { id },
      data: {
        class: { connect: { id: prevClass.id } },
        section: matchingSection
          ? { connect: { id: matchingSection.id } }
          : { disconnect: true },
        passedOut: false,
      },
    });
  }

  async passout(id: number) {
    const student = await this.prismaService.student.findUnique({
      where: { id },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (student.passedOut)
      throw new BadRequestException('Student already passed out');

    return this.prismaService.student.update({
      where: { id },
      data: {
        passedOut: true,
      },
    });
  }

  // get students by sectionid or classid
  async getStudentsByClassSection(id: number, fetchFor: 'class' | 'section') {
    const where: any = {};
    if (fetchFor === 'section') {
      where.sectionId = id;
    } else {
      where.classId = id;
      where.sectionId = null;
    }

    const students = await this.prismaService.student.findMany({
      where: { ...where, passedOut: false },
      select: {
        id: true,
        rollNumber: true,
        fName: true,
        mName: true,
        lName: true,
        class: {
          select: {
            id: true,
            name: true,
            program: { select: { name: true } },
          },
        },
        section: { select: { id: true, name: true } },
        attendance: { select: { status: true, date: true } }, // keep shape same
      },
    });

    // Format like attendance API output
    return students.map((s) => ({
      id: s.id,
      rollNumber: s.rollNumber,
      fName: s.fName,
      mName: s.mName,
      lName: s.lName,
      class: s.class,
      section: s.section,
      attendance: s.attendance || [], // empty if none
    }));
  }

  // Get attendance records for a specific student
  async getStudentAttendance(studentId: number) {
    const student = await this.prismaService.student.findUnique({
      where: { id: studentId },
    });

    if (!student) throw new NotFoundException('Student not found');

    return await this.prismaService.attendance.findMany({
      where: { studentId },
      include: {
        subject: { select: { name: true, code: true } },
        class: { select: { name: true } },
        section: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  // Get exam results for a specific student
  async getStudentResults(studentId: number) {
    const student = await this.prismaService.student.findUnique({
      where: { id: studentId },
    });

    if (!student) throw new NotFoundException('Student not found');

    return await this.prismaService.result.findMany({
      where: { studentId },
      include: {
        exam: {
          select: {
            examName: true,
            session: true,
            type: true,
            startDate: true,
            program: { select: { name: true } },
          },
        },
      },
      orderBy: { exam: { startDate: 'desc' } },
    });
  }

  // Generate attendance report with statistics
  async generateAttendanceReport(studentId: number) {
    const student = await this.prismaService.student.findUnique({
      where: { id: studentId },
      include: {
        class: { select: { name: true } },
        section: { select: { name: true } },
        program: { select: { name: true } },
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    const attendanceRecords = await this.prismaService.attendance.findMany({
      where: { studentId },
      include: {
        subject: { select: { name: true, code: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Group by subject
    const bySubject = attendanceRecords.reduce((acc, record) => {
      const subjectName = record.subject.name;
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subjectName,
          total: 0,
          present: 0,
          absent: 0,
          leave: 0,
          halfDay: 0,
        };
      }
      acc[subjectName].total++;
      if (record.status === 'PRESENT') acc[subjectName].present++;
      if (record.status === 'ABSENT') acc[subjectName].absent++;
      if (record.status === 'LEAVE') acc[subjectName].leave++;
      if (record.status === 'HALF_DAY') acc[subjectName].halfDay++;
      return acc;
    }, {});

    // Calculate percentages
    const subjectStats = Object.values(bySubject).map((stat: any) => ({
      ...stat,
      percentage: stat.total > 0 ? ((stat.present + stat.halfDay * 0.5) / stat.total) * 100 : 0,
    }));

    // Overall statistics
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'ABSENT').length;
    const leaveDays = attendanceRecords.filter(r => r.status === 'LEAVE').length;
    const halfDays = attendanceRecords.filter(r => r.status === 'HALF_DAY').length;

    return {
      student: {
        id: student.id,
        name: `${student.fName} ${student.mName || ''} ${student.lName}`.trim(),
        rollNumber: student.rollNumber,
        class: student.class?.name,
        section: student.section?.name,
        program: student.program?.name,
      },
      overall: {
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        halfDays,
        percentage: totalDays > 0 ? ((presentDays + halfDays * 0.5) / totalDays) * 100 : 0,
      },
      bySubject: subjectStats,
      records: attendanceRecords,
    };
  }

  // Generate result report with statistics
  async generateResultReport(studentId: number) {
    const student = await this.prismaService.student.findUnique({
      where: { id: studentId },
      include: {
        class: { select: { name: true } },
        section: { select: { name: true } },
        program: { select: { name: true } },
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    const results = await this.prismaService.result.findMany({
      where: { studentId },
      include: {
        exam: {
          select: {
            examName: true,
            session: true,
            type: true,
            startDate: true,
            program: { select: { name: true } },
          },
        },
      },
      orderBy: { exam: { startDate: 'desc' } },
    });

    // Calculate statistics
    const totalExams = results.length;
    const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
    const totalGPA = results.reduce((sum, r) => sum + r.gpa, 0);
    const averagePercentage = totalExams > 0 ? totalPercentage / totalExams : 0;
    const averageGPA = totalExams > 0 ? totalGPA / totalExams : 0;

    return {
      student: {
        id: student.id,
        name: `${student.fName} ${student.mName || ''} ${student.lName}`.trim(),
        rollNumber: student.rollNumber,
        class: student.class?.name,
        section: student.section?.name,
        program: student.program?.name,
      },
      statistics: {
        totalExams,
        averagePercentage: parseFloat(averagePercentage.toFixed(2)),
        averageGPA: parseFloat(averageGPA.toFixed(2)),
      },
      results,
    };
  }
}
