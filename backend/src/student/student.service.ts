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
          orderBy: { installmentNumber: 'asc' }
        }
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
    const where: any = {
      OR: [
        { fName: { contains: query } },
        { mName: { contains: query } },
        { lName: { contains: query } },
        { rollNumber: { contains: query } },
      ],
    };

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
        feeInstallments: { orderBy: { installmentNumber: 'asc' } },
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
          feeInstallments: { orderBy: { installmentNumber: 'asc' } },
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
        classId: Number(payload.classId),
        programId: Number(payload.programId),
        sectionId: Number(payload.sectionId),
        inquiryId: payload.inquiryId ? Number(payload.inquiryId) : null,
        status: (payload.status as any) || 'ACTIVE',
        statusDate: new Date(),
        tuitionFee: payload.tuitionFee ? Number(payload.tuitionFee) : 0,
        numberOfInstallments: payload.numberOfInstallments ? Number(payload.numberOfInstallments) : 1,
        lateFeeFine: payload.lateFeeFine ? Number(payload.lateFeeFine) : 0,
        feeInstallments: {
          create: installmentsData.map(i => ({
            installmentNumber: Number(i.installmentNumber),
            amount: Number(i.amount),
            dueDate: new Date(i.dueDate)
          }))
        }
      },
    });

    // Sync challans after creation
    await this.feeManagementService.syncStudentChallans(result.id);

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
          const targetAmount = ((student as any).tuitionFee && (student as any).tuitionFee > 0)
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
      photo,
      installments,
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

    if (payload.tuitionFee !== undefined) data.tuitionFee = Number(payload.tuitionFee);
    if (payload.numberOfInstallments !== undefined) data.numberOfInstallments = Number(payload.numberOfInstallments);
    if (payload.lateFeeFine !== undefined) data.lateFeeFine = Number(payload.lateFeeFine);

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

      // We replace all installments for simplicity
      (data as any).feeInstallments = {
        deleteMany: {},
        create: installmentsData.map(i => ({
          installmentNumber: Number(i.installmentNumber),
          amount: Number(i.amount),
          dueDate: new Date(i.dueDate)
        }))
      };
    }

    const updatedStudent = await this.prismaService.student.update({
      where: { id },
      data,
    });

    // Sync challans after update
    await this.feeManagementService.syncStudentChallans(id);

    return updatedStudent;
  }

  async removeStudent(id: number) {
    // Delete dependent attendance and leaves first (to avoid FK constraint errors)
    await this.prismaService.$transaction([
      this.prismaService.attendance.deleteMany({ where: { studentId: id } }),
      this.prismaService.leave.deleteMany({ where: { studentId: id } }),
      (this.prismaService as any).studentFeeInstallment.deleteMany({ where: { studentId: id } }),
      this.prismaService.feeChallan.deleteMany({ where: { studentId: id } }),
      this.prismaService.result.deleteMany({ where: { studentId: id } }),
      this.prismaService.marks.deleteMany({ where: { studentId: id } }),
      this.prismaService.position.deleteMany({ where: { studentId: id } }),
      this.prismaService.studentArrear.deleteMany({ where: { studentId: id } }),
      this.prismaService.studentStatusHistory.deleteMany({ where: { studentId: id } }),
      this.prismaService.roomAllocation.deleteMany({ where: { studentId: id } }),
      this.prismaService.hostelRegistration.deleteMany({ where: { studentId: id } }),
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

  async promote(id: number, forcePromote: boolean | any = false, targetClassId?: number, targetSectionId?: number) {
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
          const netTuitionAmount = (challan.amount || 0) - (challan.discount || 0);
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

      const outstandingAmount = expectedTuitionTotal - totalTuitionPaid;

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
              name: `${student.fName} ${student.mName || ''} ${student.lName || ''}`.trim(),
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
                  balance: Math.round((c.amount || 0) + (c.fineAmount || 0) - (c.discount || 0) - (c.paidAmount || 0)),
                  dueDate: c.dueDate
                }))
                .filter(c => c.balance > 0)
                .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0))
            },
          };
        } else {
          // Force promote - create arrears record
          // Find the highest installment number paid (handle ranges like "1-6")
          const paidChallans = await this.prismaService.feeChallan.findMany({
            where: {
              studentId: student.id,
              status: 'PAID',
              OR: [
                {
                  studentClassId: student.classId,
                  studentProgramId: student.programId,
                },
                {
                  // Legacy support
                  studentClassId: null,
                  feeStructure: {
                    classId: student.classId,
                    programId: student.programId,
                  },
                },
              ],
            },
            select: { installmentNumber: true, coveredInstallments: true },
          });

          let lastInstallmentNumber = 0;

          // Parse coveredInstallments to find highest installment
          for (const challan of paidChallans) {
            if (challan.coveredInstallments) {
              // Parse "1-6" or "7" format
              const parts = challan.coveredInstallments.split('-');
              const highestInChallan = parseInt(parts[parts.length - 1]) || 0;
              lastInstallmentNumber = Math.max(
                lastInstallmentNumber,
                highestInChallan,
              );
            } else {
              // Fallback to installmentNumber if coveredInstallments not set
              lastInstallmentNumber = Math.max(
                lastInstallmentNumber,
                challan.installmentNumber || 0,
              );
            }
          }

          console.log('📊 Highest installment paid:', lastInstallmentNumber);

          console.log('🎓 Creating/Updating StudentArrear Record:');
          console.log('  Student ID:', student.id);
          console.log(
            '  Class ID:',
            student.classId,
            '(Class:',
            student.class?.name,
            ')',
          );
          console.log(
            '  Program ID:',
            student.programId,
            '(Program:',
            student.program?.name,
            ')',
          );
          console.log('  Arrear Amount:', outstandingAmount);
          console.log('  Last Installment Number:', lastInstallmentNumber);

          // Use upsert to handle case where StudentArrear already exists
          // This prevents unique constraint violations if student is promoted multiple times
          const createdArrear = await this.prismaService.studentArrear.upsert({
            where: {
              studentId_classId_programId: {
                studentId: student.id,
                classId: student.classId,
                programId: student.programId,
              },
            },
            update: {
              // If record exists, ADD the new outstanding amount to existing arrears
              arrearAmount: { increment: outstandingAmount },
              lastInstallmentNumber,
            },
            create: {
              studentId: student.id,
              classId: student.classId,
              programId: student.programId,
              arrearAmount: outstandingAmount,
              lastInstallmentNumber,
            },
          });

          console.log('✅ StudentArrear Created/Updated:', createdArrear);
        }
      }
    }

    // No arrears OR force promote - proceed with promotion
    const program = student.class.program;
    let nextClass;
    let matchingSection;

    if (targetClassId) {
      // Manual Promotion Override
      console.log('🔧 Manual Promotion Requested to Class ID:', targetClassId);

      // Verify class belongs to the same program
      const targetClass = program.classes.find(c => c.id === Number(targetClassId));
      if (!targetClass) {
        throw new BadRequestException('Target class does not belong to the student\'s program');
      }
      nextClass = targetClass;

      if (targetSectionId) {
        matchingSection = nextClass.sections.find(s => s.id === Number(targetSectionId));
        if (!matchingSection) {
          console.warn(`⚠️ Target section ${targetSectionId} not found in class ${nextClass.name}`);
        }
      }
    } else {
      // Automatic Promotion Logic
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

      nextClass = classes[curIdx + 1];
      matchingSection = nextClass.sections.find(
        (s) => s.name === student.section?.name,
      );
    }

    const promoted = await this.prismaService.student.update({
      where: { id },
      data: {
        class: { connect: { id: nextClass.id } },
        section: matchingSection
          ? { connect: { id: matchingSection.id } }
          : { disconnect: true },
        passedOut: false,
      },
    });

    // --- AUTO-GENERATE NEW FEES FOR PROMOTED CLASS ---
    // Fetch fee structure for the new class (if any)
    const newFeeStructure = await this.prismaService.feeStructure.findUnique({
      where: {
        programId_classId: {
          programId: program.id,
          classId: nextClass.id,
        },
      },
    });

    if (newFeeStructure) {
      // 1. Initialize Fee Details for the new class
      const totalAmount = newFeeStructure.totalAmount;
      const installmentCount = newFeeStructure.installments || 1;
      const defaultInstallmentAmount = Math.floor(totalAmount / installmentCount);

      // Generate the new installment plan
      const newInstallments = Array.from({ length: installmentCount }).map((_, idx) => ({
        installmentNumber: idx + 1,
        amount: defaultInstallmentAmount,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + idx)), // Monthly staggered
      }));

      // Fix rounding: last installment covers the remainder
      const totalCalculated = defaultInstallmentAmount * installmentCount;
      const diff = totalAmount - totalCalculated;
      if (diff !== 0 && newInstallments.length > 0) {
        newInstallments[newInstallments.length - 1].amount += diff;
      }

      // A. Update Student Tuition & Metadata
      await this.prismaService.student.update({
        where: { id },
        data: {
          tuitionFee: totalAmount,
          numberOfInstallments: installmentCount,
        }
      });

      // B. Replace Fee Installments (Relation)
      await this.prismaService.$transaction([
        this.prismaService.studentFeeInstallment.deleteMany({
          where: { studentId: id }
        }),
        this.prismaService.studentFeeInstallment.createMany({
          data: newInstallments.map(i => ({
            studentId: id,
            installmentNumber: i.installmentNumber,
            amount: i.amount,
            dueDate: i.dueDate
          }))
        })
      ]);

      // C. Sync Challans (strictly scoped to the NEW classId already set in 'promoted' record)
      await this.feeManagementService.syncStudentChallans(id);

      console.log(`✅ Auto-generated fees for Student ${id} promoted to Class ${nextClass.name}`);
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

    // --- AUTO-DELETE INVALID CHALLANS FOR DEMOTION ---
    // Remove unpaid challans associated with the current class (the one they are leaving)
    await this.feeManagementService.removeChallansForDemotion(id, student.classId);

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

  async rejoin(id: number, reason: string) {
    const student = await this.prismaService.student.findUnique({
      where: { id },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (student.status !== 'STRUCK_OFF') {
      throw new BadRequestException('Only struck off students can re-join');
    }

    return this.prismaService.$transaction(async (tx) => {
      await tx.studentStatusHistory.create({
        data: {
          studentId: id,
          previousStatus: student.status,
          newStatus: 'ACTIVE',
          reason: reason,
        },
      });

      return tx.student.update({
        where: { id },
        data: {
          passedOut: false,
          status: 'ACTIVE',
          statusDate: new Date(),
        },
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
