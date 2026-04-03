import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentDto } from './dtos/student.dto';
import { FeeManagementService } from '../fee-management/fee-management.service';

@Injectable()
export class StudentService {
  constructor(
    private prismaService: PrismaService,
    private feeManagementService: FeeManagementService,
  ) { }

  async findOne(id: number) {
    return await this.prismaService.student.findFirst({
      where: { id },
      orderBy: { createdAt: 'desc' },
      include: {
        program: { select: { name: true, id: true } },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        feeInstallments: {
          orderBy: { installmentNumber: 'asc' },
        },
      } as any,
    });
  }

  async getLatestRollNumber(prefix: string) {
    // 1. Try to extract year from prefix (e.g., "PSH-CS-BS26-")
    // We expect the suffix to be appended after the last hyphen
    const parts = prefix.split('-').filter((p) => p.length > 0);
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1]; // e.g. "BS26" or "26"
      const yearMatch = lastPart.match(/\d{2}$/);
      if (yearMatch) {
        const year = yearMatch[0];
        const yearSearchPattern = `${year}-`;

        // Find all students for this year across all prefixes
        const students = await this.prismaService.student.findMany({
          where: {
            rollNumber: {
              contains: yearSearchPattern,
            },
          },
          select: {
            rollNumber: true,
          },
        });

        if (students.length > 0) {
          let maxSuffix = -1;
          let latestRoll: string | null = null;

          for (const s of students) {
            const sParts = s.rollNumber.split('-');
            const sSuffixStr = sParts[sParts.length - 1];
            const sSuffix = parseInt(sSuffixStr, 10);
            if (!isNaN(sSuffix) && sSuffix > maxSuffix) {
              maxSuffix = sSuffix;
              latestRoll = s.rollNumber;
            }
          }

          if (latestRoll) return latestRoll;
        }
      }
    }

    // Fallback to the specific prefix if year detection fails or no students found
    const student = await this.prismaService.student.findFirst({
      where: {
        rollNumber: {
          startsWith: prefix,
        },
      },
      select: {
        rollNumber: true,
      },
      orderBy: {
        rollNumber: 'desc',
      },
    });

    return student?.rollNumber || null;
  }

  async search(query: string, status?: string) {
    const trimmed = query.trim();
    const words = trimmed.split(/\s+/).filter(Boolean);

    const where: any = {
      OR: [
        { fName: { contains: trimmed } },
        { lName: { contains: trimmed } },
        { session: { contains: trimmed } },
        { rollNumber: { contains: trimmed } },
      ],
    };

    // Multi-word: also match fName + lName combination
    if (words.length >= 2) {
      where.OR.push({
        AND: [
          { fName: { contains: words[0] } },
          { lName: { contains: words[words.length - 1] } },
        ],
      });
    }

    if (status) {
      where.status = status;
    }

    const students = await this.prismaService.student.findMany({
      where,
      orderBy: { statusDate: 'desc' },
      include: {
        program: { select: { name: true, id: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        feeInstallments: { 
          include: { class: true },
          orderBy: { installmentNumber: 'asc' } 
        },
        studentArrears: {
          include: { class: true, program: true }
        },
      },
    });

    return {
      students,
      total: students.length,
      page: 1,
      limit: students.length,
      totalPages: 1,
    };
  }

  async getAllStudents(filters?: {
    programId?: number | null;
    classId?: number | null;
    sectionId?: number | null;
    status?: string | null;
    session?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    if (filters?.status) {
      where.status = filters.status;
    } else {
      where.status = 'ACTIVE';
    }

    if (filters?.programId != null && filters.programId > 0) {
      where.programId = filters.programId;
    }

    if (filters?.classId != null && filters.classId > 0) {
      where.classId = filters.classId;
    }

    if (filters?.sectionId != null && filters.sectionId > 0) {
      where.sectionId = filters.sectionId;
    }

    if (filters?.session) {
      where.session = filters.session;
    }

    if (filters?.startDate && filters?.endDate) {
      where.statusDate = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    const [students, total] = await Promise.all([
      this.prismaService.student.findMany({
        where,
        orderBy: { statusDate: 'desc' },
        skip,
        take: limit,
        include: {
          program: { select: { name: true, id: true } },
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
          feeInstallments: { 
            include: { class: true },
            orderBy: { installmentNumber: 'asc' } 
          },
          studentArrears: {
            include: { class: true, program: true }
          },
        },
      }),
      this.prismaService.student.count({ where }),
    ]);

    return {
      students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createStudent(payload: StudentDto) {
    const { installments, ...rest } = payload;

    let installmentsData: any[] = [];
    if (installments && typeof installments === 'string') {
      try {
        installmentsData = JSON.parse(installments);
      } catch (e) {
        // ignore or log
      }
    } else if (installments && Array.isArray(installments)) {
      installmentsData = installments;
    }

    const result = await this.prismaService.student.create({
      data: {
        ...rest,
        dob: new Date(payload.dob),
        admissionDate: payload.admissionDate ? new Date(payload.admissionDate) : null,
        classId: Number(payload.classId),
        programId: Number(payload.programId),
        sectionId:
          payload.sectionId && payload.sectionId !== ""
            ? Number(payload.sectionId)
            : null,
        inquiryId: payload.inquiryId ? Number(payload.inquiryId) : null,
        status: (payload.status as any) || 'ACTIVE',
        statusDate: new Date(),
        tuitionFee: payload.tuitionFee ? Number(payload.tuitionFee) : 0,
        numberOfInstallments: payload.numberOfInstallments
          ? Number(payload.numberOfInstallments)
          : 1,
        lateFeeFine: payload.lateFeeFine ? Number(payload.lateFeeFine) : 0,
        feeInstallments: {
          create: installmentsData.map((i) => {
            const dueDate = new Date(i.dueDate);
            if (isNaN(dueDate.getTime())) {
              throw new BadRequestException(
                `Invalid due date provided for installment ${i.installmentNumber}`,
              );
            }
            return {
              installmentNumber: Number(i.installmentNumber),
              amount: Number(i.amount),
              dueDate: dueDate,
              month: i.month || null,
              session: i.session || null,
              classId: Number(payload.classId),
              remainingAmount: Number(i.amount),
            };
          }),
        },
      },
    });

    return result;
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
        const currentFeeStructure =
          await this.prismaService.feeStructure.findUnique({
            where: {
              programId_classId: {
                programId: student.programId,
                classId: student.classId,
              },
            },
          });

        if (currentFeeStructure) {
          // 2. Calculate paid amount and installments for current session
          const paidChallans = await this.prismaService.feeChallan.findMany({
            where: {
              studentId: student.id,
              feeStructureId: currentFeeStructure.id,
              status: 'PAID',
            },
          });

          const totalPaid = paidChallans.reduce(
            (sum, c) => sum + c.paidAmount,
            0,
          );
          const paidInstallments = paidChallans.length;

          // 3. Check clearance
          // Cleared if:
          // - Paid all installments (count >= total installments)
          // - OR Paid full amount (amount >= total amount)
          // CRITICAL: Respect custom student tuition fee if set
          const targetAmount =
            (student as any).tuitionFee && (student as any).tuitionFee > 0
              ? (student as any).tuitionFee
              : currentFeeStructure.totalAmount;

          const isCleared =
            paidInstallments >= currentFeeStructure.installments ||
            totalPaid >= targetAmount;

          if (!isCleared) {
            const currentClass = await this.prismaService.class.findUnique({
              where: { id: student.classId },
            });
            throw new BadRequestException(
              `Cannot promote student. Outstanding fees for current class (${currentClass?.name || 'Unknown Class'}). ` +
              `Paid: ${paidInstallments}/${currentFeeStructure.installments} installments, ` +
              `Amount: ${totalPaid}/${targetAmount}`,
            );
          }
        }
      }
    }

    // 1. Remove raw FK fields to avoid type conflict
    const {
      programId,
      classId,
      sectionId,
      documents,
      dob,
      admissionDate,
      photo,
      installments,
      inquiryId,
      ...rest
    } = payload;

    // 2. Build clean data object
    const data: any = { ...rest };

    if (payload.status) {
      data.status = payload.status;
    }

    // Handle DOB
    if (dob) {
      data.dob = new Date(dob);
    }

    // Handle Admission Date
    if (admissionDate) {
      data.admissionDate = new Date(admissionDate);
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

    if (sectionId !== undefined) {
      const sId = Number(sectionId);
      if (sectionId !== null && sectionId !== "" && sId > 0) {
        data.section = { connect: { id: sId } };
      } else {
        data.section = { disconnect: true };
      }
    }

    // Optional: handle photo_url / photo_public_id from controller
    if (payload.photo_url) data.photo_url = payload.photo_url;
    if (payload.photo_public_id) data.photo_public_id = payload.photo_public_id;

    if (payload.tuitionFee !== undefined)
      data.tuitionFee = Number(payload.tuitionFee);
    if (payload.numberOfInstallments !== undefined)
      data.numberOfInstallments = Number(payload.numberOfInstallments);
    if (payload.lateFeeFine !== undefined)
      data.lateFeeFine = Number(payload.lateFeeFine);

    // Handle Installments Update
    if (payload.installments) {
      let installmentsData: any[] = [];
      if (typeof payload.installments === 'string') {
        try {
          installmentsData = JSON.parse(payload.installments);
        } catch (e) { }
      } else if (Array.isArray(payload.installments)) {
        installmentsData = payload.installments;
      }

      const targetClassId = Number(payload.classId || student.classId);

      // Server-side validation: installment sum must not exceed agreed tuition fee
      const agreedTuitionFee = payload.tuitionFee !== undefined ? Number(payload.tuitionFee) : (student.tuitionFee || 0);
      if (agreedTuitionFee > 0) {
        const totalInstallmentsAmount = installmentsData.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        if (totalInstallmentsAmount > agreedTuitionFee) {
          throw new BadRequestException(
            `Total installments (Rs. ${totalInstallmentsAmount}) cannot exceed agreed tuition fee (Rs. ${agreedTuitionFee}).`
          );
        }
      }

      // Fetch existing installments for this class
      const existingInstallments = await this.prismaService.studentFeeInstallment.findMany({
        where: {
          studentId: id,
          classId: targetClassId,
        },
      });

      // Track installment numbers found in payload to handle deletions for THIS class
      const incomingInstallmentNumbers = installmentsData.map(i => Number(i.installmentNumber));
      
      // Delete installments for this class that are NOT in the incoming payload
      await this.prismaService.studentFeeInstallment.deleteMany({
        where: {
          studentId: id,
          classId: targetClassId,
          installmentNumber: { notIn: incomingInstallmentNumbers }
        }
      });

      for (const i of installmentsData) {
        const installmentNumber = Number(i.installmentNumber);
        const amount = Number(i.amount);
        const dueDate = new Date(i.dueDate);

        if (isNaN(dueDate.getTime())) {
          throw new BadRequestException(
            `Invalid due date provided for installment ${installmentNumber}`,
          );
        }

        const existing = existingInstallments.find(ei => ei.installmentNumber === installmentNumber);

        if (existing) {
          // Check if data changed
          const existingDate = new Date(existing.dueDate);
          if (existing.amount !== amount || existingDate.getTime() !== dueDate.getTime()
            || existing.month !== (i.month || null) || existing.session !== (i.session || null)) {
            await this.prismaService.studentFeeInstallment.update({
              where: { id: existing.id },
              data: { 
                amount, 
                dueDate, 
                month: i.month || null, 
                session: i.session || null,
                remainingAmount: amount - (existing.paidAmount || 0) - (existing.pendingAmount || 0)
              },
            });
          }
        } else {
          // Create new
          await this.prismaService.studentFeeInstallment.create({
            data: {
              studentId: id,
              classId: targetClassId,
              installmentNumber,
              amount,
              dueDate,
              month: i.month || null,
              session: i.session || null,
              remainingAmount: amount,
            },
          });
        }
      }
    }

    const updatedStudent = await this.prismaService.student.update({
      where: { id },
      data,
    });

    return updatedStudent;
  }

  async removeStudent(id: number) {
    // Delete dependent attendance and leaves first (to avoid FK constraint errors)
    await this.prismaService.$transaction([
      this.prismaService.attendance.deleteMany({ where: { studentId: id } }),
      this.prismaService.leave.deleteMany({ where: { studentId: id } }),
      (this.prismaService as any).studentFeeInstallment.deleteMany({
        where: { studentId: id },
      }),
      this.prismaService.feeChallan.deleteMany({ where: { studentId: id } }),
      this.prismaService.result.deleteMany({ where: { studentId: id } }),
      this.prismaService.marks.deleteMany({ where: { studentId: id } }),
      this.prismaService.position.deleteMany({ where: { studentId: id } }),
      this.prismaService.studentArrear.deleteMany({ where: { studentId: id } }),
      this.prismaService.studentStatusHistory.deleteMany({
        where: { studentId: id },
      }),
      this.prismaService.roomAllocation.deleteMany({
        where: { studentId: id },
      }),
      this.prismaService.hostelRegistration.deleteMany({
        where: { studentId: id },
      }),
    ]);

    // Now delete the student (no includes allowed)
    const deletedStudent = await this.prismaService.student.delete({
      where: { id },
    });

    return deletedStudent;
  }

  async getStudentByNumber(rollNumber: string) {
    return await this.prismaService.student.findFirst({
      where: { rollNumber },
    });
  }

  async promote(
    id: number,
    forcePromote: boolean | any = false,
    targetClassId?: number,
    targetSectionId?: number,
    targetProgramId?: number,
    targetSession?: string,
  ) {
    const student = await this.prismaService.student.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            program: { include: { classes: { include: { sections: true } } } },
          },
        },
        section: true,
        program: true,
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    if (student.passedOut)
      throw new BadRequestException('Student already passed out');

    // Check for arrears before promotion - ALWAYS calculate to handle both initial check and force promote
    let outstandingAmount = 0;
    if (student.classId && student.programId) {
      const currentChallans = await this.prismaService.feeChallan.findMany({
        where: {
          studentId: id,
          OR: [
            {
              studentClassId: student.classId,
              studentProgramId: student.programId,
            },
            {
              // Legacy support: Check via fee structure if snapshot missing
              studentClassId: null,
              feeStructure: {
                classId: student.classId,
                programId: student.programId,
              },
            },
          ],
        },
        include: { feeStructure: true },
      });

      let totalTuitionPaid = 0;
      // Prioritize student's agreed tuition fee over program standard
      let expectedTuitionTotal = (student as any).tuitionFee || 0;

      for (const challan of currentChallans) {
        if (challan.status === 'PAID' || challan.status === 'PARTIAL') {
          // Only count the portion of payment that went toward TUITION (amount field)
          // challan.amount = tuition only
          // challan.fineAmount = additional charges
          // challan.paidAmount = total paid (might include both)

          // Calculate how much of the payment went toward tuition:
          // We must compare against the NET tuition (amount - discount)
          const netTuitionAmount =
            (challan.amount || 0) - (challan.discount || 0);
          const tuitionPortionPaid =
            challan.tuitionPaid ??
            Math.min(challan.paidAmount || 0, netTuitionAmount);
          totalTuitionPaid += tuitionPortionPaid;
        }
        // If student tuition fee is not set, fallback to structure total
        if (expectedTuitionTotal === 0 && challan.feeStructure) {
          expectedTuitionTotal = challan.feeStructure.totalAmount;
        }
      }

      // Fallback: If no challans found (or no structure linked), fetch structure directly
      // This handles cases where student was enrolled but no challan was ever generated
      if (expectedTuitionTotal === 0) {
        const structure = await this.prismaService.feeStructure.findUnique({
          where: {
            programId_classId: {
              programId: student.programId,
              classId: student.classId,
            },
          },
        });
        if (structure) {
          expectedTuitionTotal = structure.totalAmount;
        }
      }

      outstandingAmount = expectedTuitionTotal - totalTuitionPaid;

      // If arrears found
      if (outstandingAmount > 0) {
        console.log('💰 Arrears Detected:', outstandingAmount);
        console.log('🔧 forcePromote flag:', forcePromote);

        if (!forcePromote) {
          console.log(
            '⚠️  Returning confirmation requirement (forcePromote is false)',
          );
          // Return confirmation requirement
          return {
            requiresConfirmation: true,
            studentInfo: {
              id: student.id,
              rollNumber: student.rollNumber,
              name: `${student.fName} ${student.lName || ''}`.trim(),
            },
            arrears: {
              outstandingAmount,
              className: student.class?.name,
              programName: student.program?.name,
              unpaidChallans: currentChallans
                .filter((c: any) => c.status !== 'PAID')
                .map((c: any) => ({
                  installmentNumber: c.installmentNumber,
                  challanNumber: c.challanNumber,
                  status: c.status,
                  balance: Math.round(
                    (c.amount || 0) +
                    (c.fineAmount || 0) -
                    (c.discount || 0) -
                    (c.paidAmount || 0),
                  ),
                  dueDate: c.dueDate,
                }))
                .filter((c) => c.balance > 0)
                .sort(
                  (a, b) =>
                    (a.installmentNumber || 0) - (b.installmentNumber || 0),
                ),
            },
            targetClassId,
            targetSectionId,
            targetProgramId,
            targetSession
          };
        }
      }
    }

    // No arrears OR force promote - proceed with promotion
    let program = student.class.program;
    let nextClass;
    let matchingSection;

    // A. Handle Target Program Override
    if (targetProgramId) {
      const newProgram = await this.prismaService.program.findUnique({
        where: { id: Number(targetProgramId) },
        include: { classes: { include: { sections: true } } }
      });
      if (!newProgram) throw new BadRequestException('Target program not found');
      program = newProgram as any;
    }

    if (targetClassId) {
      // Manual Promotion Override
      console.log('🔧 Manual Promotion Requested to Class ID:', targetClassId);

      // Verify class belongs to the target(or current) program
      const targetClass = program.classes.find(
        (c) => c.id === Number(targetClassId),
      );
      if (!targetClass) {
        throw new BadRequestException(
          "Target class does not belong to the selected program",
        );
      }
      nextClass = targetClass;

      if (targetSectionId) {
        matchingSection = nextClass.sections.find(
          (s) => s.id === Number(targetSectionId),
        );
      }
    } else {
      // Automatic Promotion Logic
      const sortedClasses = program.classes.sort((a, b) => {
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

      const curIdx = sortedClasses.findIndex((c) => c.id === student.classId);
      if (curIdx === -1 || curIdx >= sortedClasses.length - 1) {
        // If not found in current sorted (e.g. program changed), default to first class
        nextClass = sortedClasses[0];
      } else {
        nextClass = sortedClasses[curIdx + 1];
        matchingSection = nextClass.sections.find(
          (s) => s.name === student.section?.name,
        );
      }
    }

    // Calculate prefixes for roll number update
    const getPrefix = (pPrefix: any, cPrefix: any) => {
      const p = pPrefix || '';
      const c = cPrefix || '';
      if (p && c && c.startsWith(p)) return c;
      return `${p}${c}`;
    };

    const oldPrefix = getPrefix(student.program?.rollPrefix, student.class?.rollPrefix);
    const newPrefix = getPrefix(program?.rollPrefix, nextClass?.rollPrefix);

    let updatedRollNumber = student.rollNumber;
    if (oldPrefix && updatedRollNumber?.startsWith(oldPrefix)) {
      updatedRollNumber = newPrefix + updatedRollNumber.slice(oldPrefix.length);
    }

    // Update student basics
    const studentUpdateData: any = {
      class: { connect: { id: nextClass.id } },
      section: matchingSection
        ? { connect: { id: matchingSection.id } }
        : { disconnect: true },
      passedOut: false,
      rollNumber: updatedRollNumber,
    };

    if (targetProgramId) {
      studentUpdateData.program = { connect: { id: Number(targetProgramId) } };
    }
    if (targetSession) {
      studentUpdateData.session = targetSession;
    }

    const promoted = await this.prismaService.student.update({
      where: { id },
      data: studentUpdateData,
    });

    // --- SAVE ARREARS TO StudentArrear TABLE ---
    if (outstandingAmount > 0 && student.classId && student.programId) {
      console.log(`📝 Saving ${outstandingAmount} as session arrears for student ${id}`);
      await this.prismaService.studentArrear.upsert({
        where: {
          studentId_classId_programId: {
            studentId: id,
            classId: student.classId,
            programId: student.programId,
          },
        },
        create: {
          studentId: id,
          classId: student.classId!,
          programId: student.programId!,
          arrearAmount: outstandingAmount,
        },
        update: {
          arrearAmount: outstandingAmount,
        },
      });
    }

    // --- AUTO-GENERATE NEW FEES FOR PROMOTED CLASS ---
    console.log(
      `🚀 Promotion Fee Logic: Student ${id} -> Class ${nextClass.id}`,
    );

    const effectiveProgramId = targetProgramId ? Number(targetProgramId) : student.programId;
    const effectiveSession = targetSession || student.session;

    // A. Fetch fee structure for the new class
    const newFeeStructure = await this.prismaService.feeStructure.findUnique({
      where: {
        programId_classId: {
          programId: effectiveProgramId!,
          classId: nextClass.id,
        },
      },
    });

    const totalAmount = newFeeStructure
      ? newFeeStructure.totalAmount
      : student.tuitionFee || 0;

    const installmentCount =
      newFeeStructure?.installments || student.numberOfInstallments || 1;

    console.log(
      `📊 Fees: Total=${totalAmount}, Installments=${installmentCount} (Structure Found: ${!!newFeeStructure})`,
    );

    if (totalAmount > 0) {
      const defaultInstallmentAmount = Math.floor(
        totalAmount / installmentCount,
      );

      const newInstallments = Array.from({ length: installmentCount }).map(
        (_, idx) => {
          const d = new Date();
          // Offset by 1 month to start from next month, then staggered
          d.setMonth(d.getMonth() + idx + 1);
          d.setDate(10); // Standardize to 10th for consistent ranking

          const mName = d.toLocaleString('default', { month: 'long' });

          return {
            installmentNumber: idx + 1,
            amount: defaultInstallmentAmount,
            dueDate: d,
            month: mName,
            session: effectiveSession,
          };
        },
      );

      // Fix rounding
      const totalCalculated = defaultInstallmentAmount * installmentCount;
      const diff = totalAmount - totalCalculated;
      if (diff !== 0 && newInstallments.length > 0) {
        newInstallments[newInstallments.length - 1].amount += diff;
      }

      // C. Update Student Record & Append New Installments
      await this.prismaService.$transaction([
        this.prismaService.student.update({
          where: { id },
          data: {
            programId: effectiveProgramId, // Reflect destination program
            classId: nextClass.id,         // Reflect destination class
            session: effectiveSession,     // Reflect destination session
            tuitionFee: totalAmount,       // Update agreed tuition for the new class/plan
            numberOfInstallments: installmentCount,
          },
        }),
        // Push the new installments to the existing collection (No deleteMany called)
        this.prismaService.studentFeeInstallment.createMany({
          data: newInstallments.map((i) => ({
            studentId: id,
            classId: nextClass.id,
            installmentNumber: i.installmentNumber,
            amount: i.amount,
            dueDate: i.dueDate,
            month: i.month,
            remainingAmount: i.amount,
            session: i.session,
          })),
          skipDuplicates: true, // Safety: Avoid overriding if already promoted to this class
        }),
      ]);

      console.log(
        `✅ Success: Generated ${installmentCount} fees for Student ${id} in Class ${nextClass.name} (Session: ${effectiveSession})`,
      );
    } else {
      console.warn(
        `⚠️ Warning: No tuition amount found for Student ${id} promotion (Class ${nextClass.name}). Skipping fee generation.`,
      );
    }

    return {
      requiresConfirmation: false,
      promoted: true,
      student: promoted,
    };
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

    // --- REMOVE StudentArrear RECORD ON DEMOTION ---
    // If student is demoted back to the previous class, we remove the arrears 
    // that were moved to the StudentArrear table during promotion.
    if (student.programId) {
      await this.prismaService.studentArrear.deleteMany({
        where: {
          studentId: id,
          classId: prevClass.id,
          programId: student.programId,
        },
      });
    }

    // --- AUTO-DELETE INVALID CHALLANS FOR DEMOTION ---
    // Remove unpaid challans associated with the current class (the one they are leaving)
    await this.feeManagementService.removeChallansForDemotion(
      id,
      student.classId,
    );

    // --- DELETE CURRENT CLASS INSTALLMENTS ---
    // Since promotion appends new installments, demotion should remove them
    // to "reset" back to the previous class's plan.
    await this.prismaService.studentFeeInstallment.deleteMany({
      where: {
        studentId: id,
        classId: student.classId,
      },
    });

    // --- RESTORE PREVIOUS FEE STRUCTURE ---
    // Try to find if the student had a custom installment plan for the previous class
    const previousInstallments = await this.prismaService.studentFeeInstallment.findMany({
      where: {
        studentId: id,
        classId: prevClass.id,
      },
      orderBy: { installmentNumber: 'asc' },
    });

    let restoredTuitionFee = 0;
    let restoredInstallmentsCount = 0;

    if (previousInstallments.length > 0) {
      console.log(`♻️ Restoring custom installment plan for student ${id} in class ${prevClass.name}`);
      restoredTuitionFee = previousInstallments.reduce((sum, inst) => sum + inst.amount, 0);
      restoredInstallmentsCount = previousInstallments.length;
    } else {
      // Fallback: If no history exists, use standard fee structure
      const targetFeeStructure = await this.prismaService.feeStructure.findUnique({
        where: {
          programId_classId: {
            programId: program.id,
            classId: prevClass.id,
          },
        },
      });

      restoredTuitionFee = targetFeeStructure ? targetFeeStructure.totalAmount : 0;
      restoredInstallmentsCount = targetFeeStructure ? targetFeeStructure.installments : 1;

      console.log(
        `📉 Demotion Fallback (No History): Tuition: ${restoredTuitionFee}, Installments: ${restoredInstallmentsCount}`,
      );
    }

    // Regenerate Installments ONLY if no history was found
    let fallbackInstallmentsToCreate: any[] = [];
    if (previousInstallments.length === 0 && restoredTuitionFee > 0) {
      const defaultInstallmentAmount = Math.floor(
        restoredTuitionFee / restoredInstallmentsCount,
      );
      fallbackInstallmentsToCreate = Array.from({ length: restoredInstallmentsCount }).map(
        (_, idx) => ({
          studentId: id,
          classId: prevClass.id,
          installmentNumber: idx + 1,
          amount: defaultInstallmentAmount,
          dueDate: new Date(new Date().setMonth(new Date().getMonth() + idx)),
          remainingAmount: defaultInstallmentAmount,
        }),
      );

      // Fix rounding
      const totalCalculated = defaultInstallmentAmount * restoredInstallmentsCount;
      const diff = restoredTuitionFee - totalCalculated;
      if (diff !== 0 && fallbackInstallmentsToCreate.length > 0) {
        fallbackInstallmentsToCreate[fallbackInstallmentsToCreate.length - 1].amount += diff;
        fallbackInstallmentsToCreate[fallbackInstallmentsToCreate.length - 1].remainingAmount += diff;
      }
    }

    // Calculate roll number update
    const getPrefix = (pPrefix: any, cPrefix: any) => {
      const p = pPrefix || '';
      const c = cPrefix || '';
      if (p && c && c.startsWith(p)) return c;
      return `${p}${c}`;
    };

    const oldPrefix = getPrefix(student.class?.program?.rollPrefix, student.class?.rollPrefix);
    const newPrefix = getPrefix(program?.rollPrefix, prevClass?.rollPrefix);

    let updatedRollNumber = student.rollNumber;
    if (oldPrefix && updatedRollNumber?.startsWith(oldPrefix)) {
      updatedRollNumber = newPrefix + updatedRollNumber.slice(oldPrefix.length);
    }

    const updatedStudent = await this.prismaService.$transaction([
      this.prismaService.student.update({
        where: { id },
        data: {
          class: { connect: { id: prevClass.id } },
          section: matchingSection
            ? { connect: { id: matchingSection.id } }
            : { disconnect: true },
          passedOut: false,
          rollNumber: updatedRollNumber,
          // RESTORE FEES
          tuitionFee: restoredTuitionFee,
          numberOfInstallments: restoredInstallmentsCount,
        },
      }),
      // Remove installments for the current class (the one they are leaving)
      this.prismaService.studentFeeInstallment.deleteMany({
        where: {
          studentId: id,
          classId: student.classId,
        },
      }),
      // If no history existed, create the fallback ones
      ...(previousInstallments.length === 0 && fallbackInstallmentsToCreate.length > 0
        ? [this.prismaService.studentFeeInstallment.createMany({
          data: fallbackInstallmentsToCreate,
        })]
        : []),
    ]);

    return updatedStudent[0];
  }

  async passout(id: number) {
    const student = await this.prismaService.student.findUnique({
      where: { id },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (student.passedOut)
      throw new BadRequestException('Student already passed out');

    // Check for remaining arrears before allowing passout
    const [remainingInstallments, outstandingArrears] = await Promise.all([
      this.prismaService.studentFeeInstallment.findMany({
        where: {
          studentId: id,
          remainingAmount: { gt: 0 }
        }
      }),
      this.prismaService.studentArrear.findMany({
        where: {
          studentId: id,
          arrearAmount: { gt: 0 }
        }
      })
    ]);

    if (remainingInstallments.length > 0 || outstandingArrears.length > 0) {
      const installmentOutstanding = remainingInstallments.reduce((sum, inst) => sum + inst.remainingAmount, 0);
      const arrearOutstanding = outstandingArrears.reduce((sum, arr) => sum + arr.arrearAmount, 0);
      const totalOutstanding = installmentOutstanding + arrearOutstanding;
      
      let message = `Cannot pass out student. Total outstanding: PKR ${totalOutstanding}.`;
      if (installmentOutstanding > 0) message += ` Unpaid installments: PKR ${installmentOutstanding}.`;
      if (arrearOutstanding > 0) message += ` Past arrears: PKR ${arrearOutstanding}.`;
      message += ` Please clear all dues first.`;
      
      throw new BadRequestException(message);
    }

    return this.prismaService.$transaction(async (tx) => {
      await tx.studentStatusHistory.create({
        data: {
          studentId: id,
          previousStatus: student.status,
          newStatus: 'GRADUATED',
          reason: 'Passed out / Graduated',
        },
      });

      return tx.student.update({
        where: { id },
        data: {
          passedOut: true,
          status: 'GRADUATED',
          statusDate: new Date(),
        },
      });
    });
  }

  async expel(id: number, reason: string) {
    const student = await this.prismaService.student.findUnique({
      where: { id },
    });
    if (!student) throw new NotFoundException('Student not found');

    // Check for remaining arrears before allowing expel
    const remainingArrears = await this.prismaService.studentFeeInstallment.findMany({
      where: {
        studentId: id,
        remainingAmount: { gt: 0 }
      }
    });

    if (remainingArrears.length > 0) {
      const totalOutstanding = remainingArrears.reduce((sum, inst) => sum + inst.remainingAmount, 0);
      throw new BadRequestException(
        `Cannot expel student. Total outstanding arrears: PKR ${totalOutstanding}. Please clear all dues before finalizing status.`
      );
    }

    return this.prismaService.$transaction(async (tx) => {
      await tx.studentStatusHistory.create({
        data: {
          studentId: id,
          previousStatus: student.status,
          newStatus: 'EXPELLED',
          reason: reason,
        },
      });

      return tx.student.update({
        where: { id },
        data: {
          passedOut: true,
          status: 'EXPELLED',
          statusDate: new Date(),
        },
      });
    });
  }

  async struckOff(id: number, reason: string) {
    const student = await this.prismaService.student.findUnique({
      where: { id },
    });
    if (!student) throw new NotFoundException('Student not found');

    return this.prismaService.$transaction(async (tx) => {
      await tx.studentStatusHistory.create({
        data: {
          studentId: id,
          previousStatus: student.status,
          newStatus: 'STRUCK_OFF',
          reason: reason,
        },
      });

      return tx.student.update({
        where: { id },
        data: {
          passedOut: true,
          status: 'STRUCK_OFF',
          statusDate: new Date(),
        },
      });
    });
  }

  async rejoin(id: number, reason: string, details?: { 
    session?: string, 
    programId?: string, 
    classId?: string, 
    sectionId?: string,
    sameClass?: boolean | string
  }) {
    const student = await this.prismaService.student.findUnique({
      where: { id },
      include: {
        class: true,
        section: true,
        program: true
      }
    });
    if (!student) throw new NotFoundException('Student not found');
    if (student.status !== 'STRUCK_OFF' && student.status !== 'EXPELLED') {
      throw new BadRequestException('Only struck off or expelled students can re-join');
    }

    const isSameClass = details?.sameClass === true || details?.sameClass === 'true';

    return this.prismaService.$transaction(async (tx) => {
      await tx.studentStatusHistory.create({
        data: {
          studentId: id,
          previousStatus: student.status,
          newStatus: 'ACTIVE',
          reason: reason,
        },
      });

      const updateData: any = {
        passedOut: false,
        status: 'ACTIVE',
        statusDate: new Date(),
      };

      if (!isSameClass && details) {
        if (details.session) updateData.session = details.session;
        if (details.programId) updateData.program = { connect: { id: Number(details.programId) } };
        if (details.classId) updateData.class = { connect: { id: Number(details.classId) } };
        if (details.sectionId) {
          const sId = Number(details.sectionId);
          if (sId > 0) {
            updateData.section = { connect: { id: sId } };
          } else {
            updateData.section = { disconnect: true };
          }
        }

        // --- MANAGE ARREARS FOR OLD CLASS BEFORE SWITCHING (Consistent with Promote) ---
        if (student.classId && student.programId) {
          // Calculate arrears for the class they are leaving (before updating student record)
          const currentChallans = await tx.feeChallan.findMany({
            where: {
              studentId: id,
              OR: [
                { studentClassId: student.classId, studentProgramId: student.programId },
                { studentClassId: null, feeStructure: { classId: student.classId, programId: student.programId } },
              ],
            },
            include: { feeStructure: true },
          });

          let totalTuitionPaid = 0;
          let expectedTuitionTotal = (student as any).tuitionFee || 0;

          for (const challan of currentChallans) {
            if (challan.status === 'PAID' || challan.status === 'PARTIAL') {
              const netTuitionAmount = (challan.amount || 0) - (challan.discount || 0);
              const tuitionPortionPaid = challan.tuitionPaid ?? Math.min(challan.paidAmount || 0, netTuitionAmount);
              totalTuitionPaid += tuitionPortionPaid;
            }
            if (expectedTuitionTotal === 0 && challan.feeStructure) {
              expectedTuitionTotal = challan.feeStructure.totalAmount;
            }
          }

          if (expectedTuitionTotal === 0) {
            const structure = await tx.feeStructure.findUnique({
              where: {
                programId_classId: {
                  programId: student.programId,
                  classId: student.classId,
                },
              },
            });
            if (structure) expectedTuitionTotal = structure.totalAmount;
          }

          const outstandingAmount = Math.max(0, expectedTuitionTotal - totalTuitionPaid);

          if (outstandingAmount > 0) {
            await tx.studentArrear.upsert({
              where: {
                studentId_classId_programId: {
                  studentId: id,
                  classId: student.classId,
                  programId: student.programId,
                },
              },
              create: {
                studentId: id,
                classId: student.classId,
                programId: student.programId,
                arrearAmount: outstandingAmount,
              },
              update: {
                arrearAmount: outstandingAmount,
              },
            });
          }
        }

        // --- AUTO-GENERATE NEW FEES FOR NEW CLASS IF NOT SAME CLASS ---
        if (details.programId && details.classId) {
          const newProgId = Number(details.programId);
          const newClassId = Number(details.classId);

          const newFeeStructure = await tx.feeStructure.findUnique({
            where: {
              programId_classId: {
                programId: newProgId,
                classId: newClassId,
              },
            },
          });

          const totalAmount = newFeeStructure
            ? newFeeStructure.totalAmount
            : student.tuitionFee || 0;

          const installmentCount =
            newFeeStructure?.installments || student.numberOfInstallments || 1;

          if (totalAmount > 0) {
            updateData.tuitionFee = totalAmount;
            updateData.numberOfInstallments = installmentCount;

            const defaultInstallmentAmount = Math.floor(totalAmount / installmentCount);
            const newInstallments = Array.from({ length: installmentCount }).map((_, idx) => ({
              studentId: id,
              classId: newClassId,
              installmentNumber: idx + 1,
              amount: idx === installmentCount - 1 
                ? totalAmount - (defaultInstallmentAmount * (installmentCount - 1))
                : defaultInstallmentAmount,
              dueDate: new Date(new Date().setMonth(new Date().getMonth() + idx)),
              remainingAmount: idx === installmentCount - 1 
                ? totalAmount - (defaultInstallmentAmount * (installmentCount - 1))
                : defaultInstallmentAmount,
            }));

            // --- FIX: Delete existing installments for target class to avoid unique constraint --
            await tx.studentFeeInstallment.deleteMany({
              where: {
                studentId: id,
                classId: newClassId
              }
            });

            await tx.studentFeeInstallment.createMany({
              data: newInstallments,
            });
          }
        }
      }

      return tx.student.update({
        where: { id },
        data: updateData,
      });
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
        lName: true,
        session: true,
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
      lName: s.lName,
      session: s.session,
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
            class: { select: { name: true } },
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
      percentage:
        stat.total > 0
          ? ((stat.present + stat.halfDay * 0.5) / stat.total) * 100
          : 0,
    }));

    // Overall statistics
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(
      (r) => r.status === 'PRESENT',
    ).length;
    const absentDays = attendanceRecords.filter(
      (r) => r.status === 'ABSENT',
    ).length;
    const leaveDays = attendanceRecords.filter(
      (r) => r.status === 'LEAVE',
    ).length;
    const halfDays = attendanceRecords.filter(
      (r) => r.status === 'HALF_DAY',
    ).length;

    return {
      student: {
        id: student.id,
        name: `${student.fName} ${student.lName || ''}`.trim(),
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
        percentage:
          totalDays > 0
            ? ((presentDays + halfDays * 0.5) / totalDays) * 100
            : 0,
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

    console.log(student);
    return {
      student: {
        id: student.id,
        name: `${student.fName} ${student.lName || ''}`.trim(),
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
