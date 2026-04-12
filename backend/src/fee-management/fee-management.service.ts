import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeHeadDto } from './dtos/create-fee-head.dto';
import { UpdateFeeHeadDto } from './dtos/update-fee-head.dto';
import { CreateFeeStructureDto } from './dtos/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dtos/update-fee-structure.dto';
import { CreateFeeChallanDto } from './dtos/create-fee-challan.dto';
import { UpdateFeeChallanDto } from './dtos/update-fee-challan.dto';

@Injectable()
export class FeeManagementService {
  constructor(private readonly prisma: PrismaService) { }

  private calculateLateFee(dueDate: Date, dailyFine: number, paidDate?: Date | null): number {
    if (!dueDate || !dailyFine || dailyFine <= 0) return 0;
    const due = new Date(dueDate);
    // If paidDate is known, calculate late fee up to when it was actually paid
    // Otherwise calculate up to today (still pending)
    const endDate = paidDate ? new Date(paidDate) : new Date();
    if (endDate <= due) return 0;

    const diffTime = Math.abs(endDate.getTime() - due.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * dailyFine;
  }

  private async generateChallanNumber(): Promise<string> {
    // Generate a random unique 6-digit challan number
    for (let attempt = 0; attempt < 10; attempt++) {
      // First digit 1-9 to ensure exactly 6 digits, rest 0-9
      const first = Math.floor(Math.random() * 9) + 1;
      const rest = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join('');
      const candidate = `${first}${rest}`;

      const existing = await this.prisma.feeChallan.findFirst({
        where: { challanNumber: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
    }
    // Fallback: timestamp-based to guarantee uniqueness
    return Date.now().toString().slice(-6).padStart(6, '0');
  }

  // Fee Heads
  async createFeeHead(payload: CreateFeeHeadDto) {
    return await this.prisma.feeHead.create({
      data: payload,
    });
  }

  async getFeeHeads() {
    return await this.prisma.feeHead.findMany();
  }

  async updateFeeHead(id: number, payload: UpdateFeeHeadDto) {
    return await this.prisma.feeHead.update({
      where: { id },
      data: payload,
    });
  }

  async deleteFeeHead(id: number) {
    return await this.prisma.feeHead.delete({
      where: { id },
    });
  }

  // Fee Structures
  async createFeeStructure(payload: CreateFeeStructureDto) {
    const { feeHeads, ...rest } = payload;

    // Only process feeHeads if they're provided
    if (feeHeads && feeHeads.length > 0) {
      const heads = await this.prisma.feeHead.findMany({
        where: { id: { in: feeHeads } },
      });

      if (heads.length !== feeHeads.length) {
        throw new NotFoundException('Some fee heads not found');
      }

      return await this.prisma.feeStructure.create({
        data: {
          ...rest,
          feeHeads: {
            create: heads.map((head) => ({
              feeHeadId: head.id,
              amount: head.amount,
            })),
          },
        },
        include: {
          feeHeads: {
            include: {
              feeHead: true,
            },
          },
          program: true,
          class: true,
        },
      });
    }

    // Create structure without feeHeads
    return await this.prisma.feeStructure.create({
      data: rest,
      include: {
        feeHeads: {
          include: {
            feeHead: true,
          },
        },
        program: true,
        class: true,
      },
    });
  }

  async getFeeStructures() {
    return await this.prisma.feeStructure.findMany({
      include: {
        feeHeads: {
          include: {
            feeHead: true,
          },
        },
        program: true,
        class: true,
      },
    });
  }

  async updateFeeStructure(id: number, payload: UpdateFeeStructureDto) {
    const { feeHeads, ...rest } = payload;

    // If feeHeads are provided, update them
    if (feeHeads && feeHeads.length > 0) {
      const heads = await this.prisma.feeHead.findMany({
        where: { id: { in: feeHeads } },
      });

      return await this.prisma.feeStructure.update({
        where: { id },
        data: {
          ...rest,
          feeHeads: {
            deleteMany: {},
            create: heads.map((head) => ({
              feeHeadId: head.id,
              amount: head.amount,
            })),
          },
        },
        include: {
          feeHeads: {
            include: {
              feeHead: true,
            },
          },
          program: true,
          class: true,
        },
      });
    }

    // If no feeHeads provided, just update other fields
    return await this.prisma.feeStructure.update({
      where: { id },
      data: rest,
      include: {
        feeHeads: {
          include: {
            feeHead: true,
          },
        },
        program: true,
        class: true,
      },
    });
  }

  async deleteFeeStructure(id: number) {
    return await this.prisma.feeStructure.delete({
      where: { id },
    });
  }

  // Arrears Management
  async getStudentArrears(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, program: true },
    });

    if (!student) throw new NotFoundException('Student not found');

    // Fetch arrears records from database
    const arrearRecords = await this.prisma.studentArrear.findMany({
      where: { studentId },
      include: {
        class: true,
        program: true,
      },
    });

    // Calculate total
    const totalArrears = arrearRecords.reduce(
      (sum, record) => sum + record.arrearAmount,
      0,
    );

    // Format for frontend
    const arrearsBySession = arrearRecords.map((record) => ({
      id: record.id, // Important: frontend needs this
      sessionKey: `${record.programId}-${record.classId}`,
      className: record.class.name,
      programName: record.program.name,
      classId: record.classId,
      programId: record.programId,
      totalArrears: record.arrearAmount,
      lastInstallmentNumber: record.lastInstallmentNumber,
    }));

    return {
      studentId,
      studentName:
        `${student.fName} ${student.lName || ''}`.trim(),
      rollNumber: student.rollNumber,
      currentClass: student.class?.name,
      currentProgram: student.program?.name,
      totalArrears,
      arrearsCount: arrearRecords.length,
      arrearsBySession,
      calculatedAt: new Date(),
    };
  }

  // Fee Challans
  async createFeeChallan(payload: CreateFeeChallanDto) {
    const {
      isArrearsPayment,
      arrearsInstallments,
      arrearsSessionClassId,
      arrearsSessionProgramId,
      arrearsSessionFeeStructureId,
      studentClassId: _,
      studentProgramId: __,
      ...restPayload
    } = payload as any;
    const student = await this.prisma.student.findUnique({
      where: { id: payload.studentId },
      include: { class: true, program: true },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    let feeStructureId = payload.feeStructureId;
    let amount = payload.amount;
    let installmentNumber = payload.installmentNumber || 1;
    let classId = student.classId;
    let programId = student.programId;

    console.log('ðŸ·ï¸ CreateFeeChallan - isArrearsPayment:', isArrearsPayment);
    console.log('ðŸ·ï¸ Initial classId:', classId, 'programId:', programId);

    // If arrears payment, use studentArrearId
    if (isArrearsPayment) {
      const studentArrearId = (payload as any).studentArrearId;

      if (!studentArrearId) {
        throw new BadRequestException(
          'Student arrear ID is required for arrears payment',
        );
      }

      // Get arrear record
      const arrearRecord = await this.prisma.studentArrear.findUnique({
        where: { id: studentArrearId },
      });

      if (!arrearRecord) {
        throw new NotFoundException('Arrear record not found');
      }

      // Validate amount
      if (amount > arrearRecord.arrearAmount) {
        throw new BadRequestException(
          `Amount (${amount}) exceeds arrears (${arrearRecord.arrearAmount})`,
        );
      }

      // Use session details from arrear record
      classId = arrearRecord.classId;
      programId = arrearRecord.programId;

      console.log(
        'ðŸŽ¯ Arrears Payment - Using arrear classId:',
        classId,
        'programId:',
        programId,
      );

      // CRITICAL: Fetch fee structure from the ORIGINAL class (where arrear originated)
      const arrearFeeStructure = await this.prisma.feeStructure.findUnique({
        where: {
          programId_classId: {
            programId: arrearRecord.programId,
            classId: arrearRecord.classId,
          },
        },
      });

      if (arrearFeeStructure) {
        feeStructureId = arrearFeeStructure.id;
        console.log(
          'âœ… Using fee structure from original class:',
          feeStructureId,
        );
      }

      // Next installment = last installment + 1
      installmentNumber = arrearRecord.lastInstallmentNumber + 1;
    }
    // Auto-fetch fee structure if not provided and not arrears
    if (!feeStructureId && student.programId && student.classId) {
      const structure = await this.prisma.feeStructure.findUnique({
        where: {
          programId_classId: {
            programId: student.programId,
            classId: student.classId,
          },
        },
      });
      if (structure) {
        feeStructureId = structure.id;
        // If amount is not manually overridden, calculate based on installments
        if (amount === undefined || amount === null) {
          amount = Math.round(
            ((student as any).tuitionFee || structure.totalAmount) / structure.installments,
          );
        }
        // Calculate installment number only if tuition is being paid
        if (amount > 0) {
          const prevChallans = await this.prisma.feeChallan.count({
            where: {
              studentId: student.id,
              feeStructureId: structure.id,
              amount: { gt: 0 }, // Only count challans that had tuition
            },
          });
          installmentNumber = prevChallans + 1;
        } else {
          installmentNumber = 0;
        }
      }
    }

    console.log(
      'ðŸ’¾ Creating challan with studentClassId:',
      classId,
      'studentProgramId:',
      programId,
    );

    return await this.prisma.feeChallan.create({
      data: {
        studentId: payload.studentId,
        selectedHeads: payload.selectedHeads
          ? JSON.stringify(payload.selectedHeads)
          : null,
        dueDate: new Date(payload.dueDate),
        amount,
        discount: 0,
        paidAmount: payload.paidAmount || 0,
        remarks: payload.remarks || null,
        coveredInstallments: payload.coveredInstallments || null,
        feeStructureId,
        installmentNumber,
        studentClassId: classId, // Use calculated classId - NOT from payload
        studentProgramId: programId, // Use calculated programId - NOT from payload
        studentSectionId: student.sectionId, // Snapshot current section
        fineAmount: payload.fineAmount || 0,
        challanNumber: await this.generateChallanNumber(),
        remainingAmount: (amount || 0) + (payload.fineAmount || 0) - (payload.paidAmount || 0),
        status: (payload.paidAmount || 0) >= ((amount || 0) + (payload.fineAmount || 0)) ? 'PAID' : ((payload.paidAmount || 0) > 0 ? 'PARTIAL' : 'PENDING'),
        challanType: isArrearsPayment ? 'ARREARS_ONLY' : 'INSTALLMENT',
        studentArrearId: (payload as any).studentArrearId
          ? Number((payload as any).studentArrearId)
          : null,
      },
      include: {
        student: true,
        feeStructure: true,
        studentClass: true,
        studentProgram: true,
        previousChallans: true,
      },
    });
  }

  async getFeeChallans(query: any) {
    const {
      studentId,
      search,
      status,
      month,
      installmentNumber,
      challanType,
      excludeChallanType,
      startDate,
      endDate,
      sessionId,
    } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const where: any = studentId ? { studentId: Number(studentId) } : {};

    if (search) {
      const searchTrimmed = search.trim();
      const words = searchTrimmed.split(/\s+/).filter(Boolean);

      const searchConditions: any[] = [
        { challanNumber: { contains: searchTrimmed } },
        { student: { fName: { contains: searchTrimmed } } },
        { student: { lName: { contains: searchTrimmed } } },
        { student: { session: { contains: searchTrimmed } } },
        { student: { rollNumber: { contains: searchTrimmed } } },
      ];

      // Multi-word search: match across first + last name
      if (words.length >= 2) {
        searchConditions.push({
          AND: [
            { student: { fName: { contains: words[0] } } },
            { student: { lName: { contains: words[words.length - 1] } } },
          ],
        });
      }

      // If search is a number, also check for installmentNumber
      if (!isNaN(Number(searchTrimmed))) {
        searchConditions.push({ installmentNumber: Number(searchTrimmed) });
      }

      where.AND = [...(where.AND || []), { OR: searchConditions }];
    }

    if (status && status !== 'all') {
      if (status === 'overdue') {
        where.status = 'PENDING';
        where.dueDate = { lt: new Date() };
      } else {
        where.status = status.toUpperCase();
      }
    }

    if (installmentNumber !== undefined && installmentNumber !== "" && installmentNumber !== null) {
      where.installmentNumber = Number(installmentNumber);
    }

    if (challanType) {
      where.challanType = challanType;
    }

    if (excludeChallanType) {
      where.challanType = { not: excludeChallanType };
    }

    if (query.programId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { studentProgramId: Number(query.programId) },
            {
              studentProgramId: null,
              student: { programId: Number(query.programId) },
            },
          ],
        },
      ];
    }

    if (query.classId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { studentClassId: Number(query.classId) },
            {
              studentClassId: null,
              student: { classId: Number(query.classId) },
            },
          ],
        },
      ];
    }

    if (query.sectionId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { studentSectionId: Number(query.sectionId) },
            // Fallback
            {
              studentSectionId: null,
              student: { sectionId: Number(query.sectionId) },
            },
          ],
        },
      ];
    }

    if (month) {
      const year = new Date().getFullYear();
      const startOfMonth = new Date(year, Number(month) - 1, 1);
      const endOfMonth = new Date(year, Number(month), 0, 23, 59, 59);
      where.dueDate = { ...where.dueDate, gte: startOfMonth, lte: endOfMonth };
    }
    if (startDate || endDate) {
      where.dueDate = { ...where.dueDate };
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }

    if (sessionId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { sessionId: Number(sessionId) },
            {
              sessionId: null,
              student: {
                academicRecords: {
                  some: {
                    sessionId: Number(sessionId),
                    isCurrent: true
                  }
                }
              }
            }
          ]
        }
      ];
    }

    const total = await this.prisma.feeChallan.count({ where });
    const lastPage = Math.ceil(total / limit);

    const data = await this.prisma.feeChallan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        student: true,
        feeStructure: true,
        studentClass: true,
        studentProgram: true,
        previousChallans: {
          select: {
            id: true, status: true, amount: true, fineAmount: true,
            lateFeeFine: true, dueDate: true, paidAmount: true, discount: true,
            settledAmount: true,
            installmentNumber: true, month: true, session: true, challanNumber: true,
            previousChallans: {
              select: {
                id: true, status: true, amount: true, fineAmount: true,
                lateFeeFine: true, dueDate: true, paidAmount: true, discount: true,
                settledAmount: true,
                installmentNumber: true, month: true, session: true, challanNumber: true,
                previousChallans: {
                  select: {
                    id: true, status: true, amount: true, fineAmount: true,
                    lateFeeFine: true, dueDate: true, paidAmount: true, discount: true,
                    settledAmount: true,
                    installmentNumber: true, month: true, session: true, challanNumber: true,
                  }
                }
              }
            }
          }
        },
        supersedes: {
          select: {
            id: true, challanNumber: true, status: true, amount: true,
            fineAmount: true, lateFeeFine: true, dueDate: true, paidAmount: true,
            discount: true, remainingAmount: true, month: true, session: true,
            installmentNumber: true,
          }
        },
        supersededBy: {
          select: { id: true, status: true, challanNumber: true, paidAmount: true, amount: true, fineAmount: true, lateFeeFine: true, discount: true }
        },
      },
      orderBy: [{ dueDate: 'asc' }, { installmentNumber: 'asc' }],
    });

    const instituteSettings = await this.prisma.instituteSettings.findFirst();
    const globalLateFee = instituteSettings?.lateFeeFine || 0;

    const formattedData = data.map((challan: any) => {
      // lateFeeFine is stamped at generation/update time and kept in sync by the cron job.
      // Use stored value directly — no dynamic recalculation.
      const instAccrued = challan.studentFeeInstallment?.lateFeeAccrued ?? null;

      if (challan.status === 'PAID') {
        challan.lateFeeFine = challan.lateFeeFine || 0;
      } else {
        // For all non-PAID statuses: prefer installment's accrued value (cron-maintained),
        // fall back to stored challan lateFeeFine (stamped at generation)
        challan.lateFeeFine = instAccrued !== null ? instAccrued : (challan.lateFeeFine || 0);
      }
      if (Array.isArray(challan.previousChallans)) {
        challan.previousChallans = this.injectLateFeeRecursive(challan.previousChallans, globalLateFee);
      }
      return challan;
    });

    return {
      data: formattedData,
      meta: {
        total,
        page,
        lastPage,
        limit,
      },
    };
  }

  async getBulkChallans(query: any) {
    const { startDate, endDate, programId, classId, sectionId, sessionId } = query;
    const where: any = {};

    // Prioritize Snapshot Search (OR logic for backward compatibility)
    if (programId) {
      where.OR = [
        ...(where.OR || []),
        { studentProgramId: Number(programId) },
        { studentProgramId: null, student: { programId: Number(programId) } },
      ];
    }

    if (classId) {
      // Must combine with existing OR if present ??
      // Actually simpler:
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { studentClassId: Number(classId) },
            { studentClassId: null, student: { classId: Number(classId) } },
          ],
        },
      ];
    }

    if (sectionId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { studentSectionId: Number(sectionId) },
            // Fallback only useful if student hasn't moved sections
            {
              studentSectionId: null,
              student: { sectionId: Number(sectionId) },
            },
          ],
        },
      ];
    }

    if (sessionId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { sessionId: Number(sessionId) },
            {
              sessionId: null,
              student: {
                academicRecords: {
                  some: {
                    sessionId: Number(sessionId),
                    isCurrent: true
                  }
                }
              }
            }
          ]
        }
      ];
    }

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }

    const data = await this.prisma.feeChallan.findMany({
      where,
      include: {
        student: true,
        feeStructure: true,
        studentClass: true,
        studentProgram: true,
        studentFeeInstallment: {
          select: { id: true, lateFeeAccrued: true, lateFeeLastCalculatedAt: true, paidDate: true } as any
        },
        previousChallans: {
          select: {
            id: true,
            status: true,
            amount: true,
            fineAmount: true,
            lateFeeFine: true,
            dueDate: true,
            paidAmount: true,
            discount: true,
            installmentNumber: true,
            month: true,
            session: true,
            challanNumber: true,
          }
        },
        supersedes: {
          select: {
            id: true,
            challanNumber: true,
            status: true,
            amount: true,
            fineAmount: true,
            lateFeeFine: true,
            dueDate: true,
            paidAmount: true,
            discount: true,
            remainingAmount: true,
            month: true,
            session: true,
            installmentNumber: true,
          }
        }
      },
      orderBy: [{ dueDate: 'asc' }, { student: { rollNumber: 'asc' } }],
    });

    // lateFeeFine is now stamped at generation/update time and kept in sync by the cron job.
    const instituteSettings = await this.prisma.instituteSettings.findFirst();
    const globalLateFee = instituteSettings?.lateFeeFine || 0;
    data.forEach((challan: any) => {
      const instAccrued = challan.studentFeeInstallment?.lateFeeAccrued ?? null;
      // Use stored value — prefer installment's accrued (cron-maintained), fall back to challan's stored value
      challan.lateFeeFine = challan.status === 'PAID'
        ? (challan.lateFeeFine || 0)
        : (instAccrued !== null ? instAccrued : (challan.lateFeeFine || 0));
      if (Array.isArray(challan.previousChallans)) {
        challan.previousChallans = this.injectLateFeeRecursive(challan.previousChallans, globalLateFee);
      }
    });

    return data;
  }

  async getInstallmentPlans(query: {
    studentId?: string;
    classId?: string;
    sectionId?: string;
    sessionId?: string;
    programId?: string;
  }) {
    const { studentId, classId, sectionId, sessionId, programId } = query;
    const where: any = { passedOut: false };

    if (studentId) where.id = Number(studentId);
    if (classId) where.classId = Number(classId);
    if (sectionId) where.sectionId = Number(sectionId);
    if (programId) where.programId = Number(programId);
    if (sessionId) where.academicRecords = {
      some: {
        sessionId: Number(sessionId),
        isCurrent: true,
      },
    };

    const students = await this.prisma.student.findMany({
      where,
      select: {
        id: true,
        fName: true,
        lName: true,
        rollNumber: true,
        classId: true,
        programId: true,
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        feeInstallments: {
          select: {
            id: true,
            installmentNumber: true,
            amount: true,
            paidAmount: true,
            pendingAmount: true,
            remainingAmount: true,
            status: true,
            dueDate: true,
            month: true,
            session: true,
            classId: true,
            class: { select: { name: true } },
            lateFeeAccrued: true,
            lateFeeLastCalculatedAt: true,
            sessionId: true,
          } as any,
          orderBy: { installmentNumber: 'asc' } as any,
        },
        challans: {
          where: { status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] } },
          select: {
            id: true,
            month: true,
            session: true,
            amount: true,
            paidAmount: true,
            fineAmount: true,
            lateFeeFine: true,
            status: true,
            dueDate: true,
            installmentNumber: true,
            studentClassId: true,
            studentFeeInstallmentId: true,
            previousChallans: {
              select: {
                id: true, amount: true, fineAmount: true, lateFeeFine: true,
                dueDate: true, paidAmount: true, discount: true, status: true,
                installmentNumber: true, month: true, session: true, challanNumber: true,
                previousChallans: {
                  select: {
                    id: true, amount: true, fineAmount: true, lateFeeFine: true,
                    dueDate: true, paidAmount: true, discount: true, status: true,
                    installmentNumber: true, month: true, session: true, challanNumber: true,
                    previousChallans: {
                      select: {
                        id: true, amount: true, fineAmount: true, lateFeeFine: true,
                        dueDate: true, paidAmount: true, discount: true, status: true,
                        installmentNumber: true, month: true, session: true, challanNumber: true,
                      }
                    }
                  }
                }
              }
            },
            remainingAmount: true
          }
        }
      },
    });

    // Enrich with FeeStructure context
    const studentsWithHeads = await Promise.all(students.map(async (student) => {
      if (!student.programId || !student.classId) return { ...student, feeStructure: null };
      
      const feeStructure = await this.prisma.feeStructure.findUnique({
        where: {
          programId_classId: {
            programId: student.programId,
            classId: student.classId
          }
        },
        include: {
          feeHeads: {
            include: {
              feeHead: true
            }
          }
        }
      });

      // lateFeeFine is stamped at generation/update time and kept in sync by the cron job — use stored values.
      const enrichedChallans = (student.challans as any[]).map((challan) => {
        if (Array.isArray(challan.previousChallans) && challan.previousChallans.length > 0) {
          return { ...challan, previousChallans: this.injectLateFeeRecursive(challan.previousChallans, 0) };
        }
        return challan;
      });

      return { ...student, challans: enrichedChallans, feeStructure };
    }));

    return studentsWithHeads;
  }

  async generateChallansFromPlan(payload: {
    month: string; // YYYY-MM
    studentId?: number;
    studentIds?: number[]; // For bulk selection
    programId?: number;
    classId?: number;
    sectionId?: number;
    customAmount?: number; // For individual student: custom billing amount (tuition portion)
    selectedHeads?: number[]; // For individual student: custom fee heads to add
    customArrearsAmount?: number; // For individual student: custom arrears amount to include
    arrearsLateFee?: number; // For individual student: late fee for arrears
    selectedArrears?: { id: number; amount: number; lateFee: number }[]; // For granular selection
    remarks?: string;
    excludedArrearsStudentIds?: number[];
    dueDate?: string; // For individual student: custom due date (YYYY-MM-DD)
    sessionId?: number;
  }) {
    const {
      month, studentId, studentIds, programId, classId, sectionId,
      customAmount, selectedHeads, customArrearsAmount, arrearsLateFee,
      selectedArrears, excludedArrearsStudentIds, remarks, dueDate, sessionId
    } = payload;
    const [year, monthNum] = month.split('-').map(Number);

    // 1. Find target students
    const studentWhere: any = { passedOut: false };
    if (studentId) {
      studentWhere.id = Number(studentId);
    } else if (studentIds && studentIds.length > 0) {
      studentWhere.id = { in: studentIds.map(id => Number(id)) };
    } else {
      if (programId) studentWhere.programId = Number(programId);
      if (classId) studentWhere.classId = Number(classId);
      if (sectionId) studentWhere.sectionId = Number(sectionId);
    }

    const students = await this.prisma.student.findMany({
      where: studentWhere,
      include: {
        feeInstallments: {
          include: { class: true }
        },
        program: true,
        challans: {
          where: { status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] } },
          select: {
            id: true,
            month: true,
            session: true,
            amount: true,
            paidAmount: true,
            fineAmount: true,
            lateFeeFine: true,
            status: true,
            dueDate: true,
            installmentNumber: true,
            studentClassId: true,
            studentFeeInstallmentId: true,
            remainingAmount: true
          }
        },
        studentArrears: {
          where: { arrearAmount: { gt: 0 } }
        }
      },
    });

    const results: any[] = [];

    // Fetch global late fee once for use in arrears calculations
    const genInstSettings = await this.prisma.instituteSettings.findFirst();
    const genGlobalLateFee = genInstSettings?.lateFeeFine || 0;

    for (const student of students) {
      // 2. Find matching installment in the plan for this class
      const [y, mNum] = month.split('-').map(Number);
      const dateObj = new Date(y, mNum - 1, 1);
      const monthName = dateObj.toLocaleString('default', { month: 'long' });

      // FIX 3: Compute correct session gap from program duration (e.g. "4 years" => gap=4)
      const progDuration = (student as any).program?.duration || '';
      const durationMatch = progDuration.match(/\d+/);
      const programGap = durationMatch ? parseInt(durationMatch[0], 10) : 1;
      const calcSession = (mNum >= 4) ? `${y}-${y + programGap}` : `${y - 1}-${y + programGap - 1}`;

      // Primary match: sessionId if provided, otherwise month name + computed session
      let targetInstallment: any = (student.feeInstallments as any[]).find((i) => {
        if (sessionId) {
          return i.month === monthName && i.sessionId === Number(sessionId);
        }
        return i.month === monthName && i.session === calcSession;
      });

      // Second pass: match month name only (ignores session — handles legacy data or any gap)
      if (!targetInstallment) {
        targetInstallment = (student.feeInstallments as any[]).find((i) => {
          return i.month === monthName && (i.remainingAmount > 0 || i.pendingAmount > 0 || i.status === 'PENDING');
        });
      }

      // Third pass: any installment with matching month name (regardless of status)
      if (!targetInstallment) {
        targetInstallment = (student.feeInstallments as any[]).find((i) => i.month === monthName);
      }

      // Fallback Match: Due Date (Strictly as last resort)
      if (!targetInstallment) {
        targetInstallment = (student.feeInstallments as any[]).find((i) => {
          const d = new Date(i.dueDate);
          return d.getFullYear() === y && (d.getMonth() + 1) === mNum;
        });
      }

      // 3. Status/Check flags
      const targetDate = new Date(year, monthNum - 1, 10); // Standardize to 10th for rank comparison
      const targetRank = targetInstallment
        ? this.getChronoRank(targetInstallment)
        : targetDate.getTime(); // Use selected month as a fallback limit

      const pastInstallments = (student.feeInstallments as any[]).filter(i =>
        this.getChronoRank(i) < targetRank
      );

      const previousMissingChallan = await (async () => {
        const allInsts = student.feeInstallments as any[];
        // Sort DESC to point to the MOST RECENT missing installment (back-track)
        const sortedPastInsts = [...allInsts].sort((a, b) => this.getChronoRank(b) - this.getChronoRank(a));

        const targetClassRank = targetInstallment ? this.getClassRank(targetInstallment.class) : 0;
        const targetInstNum = targetInstallment ? targetInstallment.installmentNumber : 0;

        for (const inst of sortedPastInsts) {
          const instClassRank = this.getClassRank(inst.class);

          let isPrevious = false;
          if (targetInstallment && inst.classId === targetInstallment.classId) {
            // Same class: earlier installment number
            isPrevious = inst.installmentNumber < targetInstNum;
          } else {
            // Different class: earlier class rank
            isPrevious = instClassRank < targetClassRank;
          }

          if (!isPrevious) continue;

          // Robust check: Is there ANY valid challan for this specific installment?
          // A VOID challan is acceptable if its superseding challan is PAID (debt was settled via chain)
          // CRITICAL FIX: Build session filter dynamically to handle NULL cases
          const sessionFilter: any[] = [];
          if (inst.sessionId) sessionFilter.push({ sessionId: inst.sessionId });
          if (inst.session) sessionFilter.push({ session: inst.session });
          // If no session info on installment, match challans with no session info
          if (sessionFilter.length === 0) {
            sessionFilter.push({ sessionId: null, session: null });
          }
          
          const existingChallan = await this.prisma.feeChallan.findFirst({
            where: {
              studentId: student.id,
              installmentNumber: inst.installmentNumber,
              month: inst.month,
              OR: sessionFilter,
              status: { not: 'VOID' }
            }
          });

          // Also check: is there a VOID challan for this installment whose superseding chain is fully PAID?
          // This helper recursively validates the entire superseding chain
          const isVoidChainSettled = async (challanId: number): Promise<boolean> => {
            const voidChallan = await this.prisma.feeChallan.findUnique({
              where: { id: challanId },
              select: { status: true, supersededById: true, supersededBy: { select: { id: true, status: true } } }
            });
            
            if (!voidChallan || voidChallan.status !== 'VOID') return false;
            if (!voidChallan.supersededBy) return false;
            
            // If the superseding challan exists and is active (PENDING/PARTIAL/OVERDUE/PAID),
            // the debt is being tracked — installment is handled, allow generation to proceed
            if (voidChallan.supersededBy.status !== 'VOID') return true;
            
            // If the superseding challan is also VOID, recursively check its chain
            return await isVoidChainSettled(voidChallan.supersededBy.id);
          };

          const settledVoidChallan = !existingChallan ? await this.prisma.feeChallan.findFirst({
            where: {
              studentId: student.id,
              installmentNumber: inst.installmentNumber,
              month: inst.month,
              OR: sessionFilter, // Use the same session filter
              status: 'VOID'
            }
          }).then(async (voidChallan) => {
            if (!voidChallan) return null;
            const isSettled = await isVoidChainSettled(voidChallan.id);
            return isSettled ? voidChallan : null;
          }) : null;

          if (!existingChallan && !settledVoidChallan) {
            // Also check via studentFeeInstallmentId — the installment itself may be PAID
            if (inst.status === 'PAID' || (inst.paidAmount >= inst.amount)) continue;
            const className = (inst.classId !== student.classId && inst.class?.name) ? `- ${inst.class.name}` : '';
            return `${inst.month || 'Previous Month'} ${inst.session || ''} ${className}`;
          }
        }
        return null;
      })();

      const pastUnbilledCount = pastInstallments.filter(i => i.remainingAmount > 0).length;

      const hasArrears = pastUnbilledCount > 0 || (selectedArrears && selectedArrears.length > 0) || (customArrearsAmount ?? 0) > 0;
      const possessesHeads = (selectedHeads && selectedHeads.length > 0);
      const hasCustomTuition = customAmount !== undefined && customAmount > 0;

      const isExtraOnly = possessesHeads && customAmount === 0;
      const isArrearsOnly = hasArrears && !targetInstallment && !hasCustomTuition && !possessesHeads && !isExtraOnly;
      const isFeeHeadOnly = (possessesHeads && !targetInstallment && !hasCustomTuition && !hasArrears) || isExtraOnly;

      // Skip sequence check for fee-head-only extra challans — they are independent of installment order
      if (previousMissingChallan && !isFeeHeadOnly) {
        results.push({
          studentId: student.id,
          studentName: `${student.fName} ${student.lName || ''}`,
          status: 'PREVIOUS_UNGENERATED',
          reason: `Generate ${previousMissingChallan} challan first`,
        });
        continue;
      }

      if (!targetInstallment && !hasArrears && !possessesHeads && !hasCustomTuition) {
        results.push({
          studentId: student.id,
          studentName: `${student.fName} ${student.lName || ''}`,
          status: 'SKIPPED',
          reason: 'No matching installment found, no arrears, and no fee heads to bill.',
        });
        continue;
      }

      // Determine if we should even CONSIDER tuition for this student
      let canBillTuition = !!targetInstallment;
      if (targetInstallment && !hasCustomTuition) {
        // Use base amount (not totalAmount) to check if tuition has already been billed
        const baseTuitionUnbilled = (targetInstallment.amount || 0) - (targetInstallment.paidAmount || 0);
        if (baseTuitionUnbilled <= 0) canBillTuition = false;
      }

      // 3b. Existing Challan Logic — only applies to installment/arrears challans, NOT fee-head-only extra challans
      if (!isFeeHeadOnly) {
        const existingChallans = await this.prisma.feeChallan.findMany({
          where: {
            studentId: student.id,
            installmentNumber: targetInstallment?.installmentNumber || 0,
            month: monthName,
            OR: [
              { sessionId: sessionId ? Number(sessionId) : (targetInstallment?.sessionId || null) },
              { session: targetInstallment?.session || student.session }
            ],
            status: { not: 'VOID' }
          },
          include: { student: true }
        });

        if (existingChallans.length > 0) {
          results.push({
            studentId: student.id,
            studentName: `${student.fName} ${student.lName || ''}`,
            status: 'SKIPPED',
            reason: `Month ${month} is already generated. Please delete the existing challan if you want to recreate it.`,
            challan: existingChallans[0]
          });
          continue;
        }
      }

      // 4. Arrears Collection & Linking (Dynamic Chain)
      let prevChallanLinks: any[] = [];
      let calculatedArrearsTotal = 0;
      let totalSessionArrearsTracked = 0;
      let snapshotObjects: any[] = [];
      let sessionArrearIdToLink: number | null = null;
      let studentMonthlyChallans: any[] = [];

      if (!isExtraOnly && !isFeeHeadOnly) {
        // A. Handle Previous Session Arrears (from StudentArrear table - legacy/previous session debt)
        const sessionArrears = await this.prisma.studentArrear.findMany({
          where: { studentId: student.id, arrearAmount: { gt: 0 } },
          include: { class: true }
        });

        // Filter for arrears not covered by the current granular class installments
        const granularClassIds = new Set((student.feeInstallments as any[]).map(i => i.classId));
        const filteredSessionArrears = sessionArrears.filter(a => !granularClassIds.has(a.classId));

        if (filteredSessionArrears.length > 0) {
          totalSessionArrearsTracked = filteredSessionArrears.reduce((sum, a) => sum + a.arrearAmount, 0);
          calculatedArrearsTotal += totalSessionArrearsTracked;
          sessionArrearIdToLink = filteredSessionArrears[0].id;

          snapshotObjects.push({
            name: `Previous Session Arrears (${filteredSessionArrears.map(a => a.class.name).join(', ')})`,
            amount: totalSessionArrearsTracked,
            type: 'additional',
            isSelected: true,
            isSessionArrear: true
          });
        }

        // B. Handle Monthly Installment Chain (Real-time Debt)
        studentMonthlyChallans = await this.prisma.feeChallan.findMany({
          where: {
            studentId: student.id,
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            challanType: { in: ['INSTALLMENT', 'MIXED', 'ARREARS_ONLY'] }
          },
          include: {
            nextChallans: {
              where: { status: { not: 'VOID' } }
            }
          }
        });

        // A leaf is a challan that has no non-VOID successors in the arrears chain
        const leafChallans = studentMonthlyChallans.filter(c => c.nextChallans.length === 0);
        prevChallanLinks = leafChallans.map(c => ({ id: c.id }));
        
        // Sum the current total debt from these leaves for the snapshot
        for (const leaf of leafChallans) {
          // For all non-PAID leaves, compute dynamic late fee from dueDate
          const leafDynamicLateFee = (leaf.status !== 'PAID' && leaf.dueDate && genGlobalLateFee > 0)
            ? this.calculateLateFee(leaf.dueDate, genGlobalLateFee)
            : (leaf.lateFeeFine || 0);
          const leafRem = Math.max(0, (leaf.amount || 0) + (leaf.fineAmount || 0) + leafDynamicLateFee - (leaf.paidAmount || 0) - (leaf.discount || 0));
          calculatedArrearsTotal += leafRem + (await this.getRecursiveArrearsIterative([leaf.id], this.prisma, genGlobalLateFee));
        }

        // Note: We no longer push an "Arrears Snapshot" to snapshotObjects.
        // Arrears are handled dynamically via the previousChallans relation.
      }

      // C. From Unbilled Past Installments
      let pastInstallmentsToBill: any[] = [];
      let coveredInstNumbers: number[] = [];
      
      // handledInstIds: installments already covered by active (PENDING/PARTIAL/OVERDUE) OR VOID challans.
      // VOID challans must be included because their debt was rolled into a successor — don't double-count.
      const handledInstIds = new Set(studentMonthlyChallans.map(pc => pc.studentFeeInstallmentId).filter(Boolean));

      // Also fetch VOID challans to mark their installments as handled
      const voidChallans = await this.prisma.feeChallan.findMany({
        where: {
          studentId: student.id,
          status: 'VOID',
          challanType: { in: ['INSTALLMENT', 'MIXED', 'ARREARS_ONLY'] },
          studentFeeInstallmentId: { not: null }
        },
        select: { studentFeeInstallmentId: true }
      });
      voidChallans.forEach(vc => {
        if (vc.studentFeeInstallmentId) handledInstIds.add(vc.studentFeeInstallmentId);
      });

      const pastUnbilledInsts = (student.feeInstallments as any[]).filter(i => {
        if (handledInstIds.has(i.id)) return false;
        return this.getChronoRank(i) < targetRank;
      }).filter(i => (i.amount - (i.paidAmount || 0)) > 0);

      for (const pi of pastUnbilledInsts) {
        const unpaid = pi.amount - pi.paidAmount;
        calculatedArrearsTotal += unpaid;
        
        // Include recurring heads for this unbilled month
        if (student.programId && student.classId) {
          const structure = await this.prisma.feeStructure.findUnique({
            where: {
              programId_classId: {
                programId: student.programId,
                classId: student.classId
              }
            },
            include: {
              feeHeads: {
                include: { feeHead: true }
              }
            }
          });

          if (structure?.feeHeads) {
            const monthHeads = structure.feeHeads
              .filter(sh => !sh.feeHead.isTuition && !sh.feeHead.isDiscount && !sh.feeHead.isLabFee && !sh.feeHead.isLibraryFee)
              .reduce((sum, sh) => sum + (sh.amount || 0), 0);
            calculatedArrearsTotal += monthHeads;
          }
        }
        
        pastInstallmentsToBill.push({ id: pi.id, amount: unpaid });
        coveredInstNumbers.push(pi.installmentNumber);

        const instituteSettings = await this.prisma.instituteSettings.findFirst();
        const globalFine = student.lateFeeFine || instituteSettings?.lateFeeFine || 0;
        const instFine = globalFine > 0 ? this.calculateLateFee(pi.dueDate, globalFine) : 0;

        if (instFine > 0) {
          calculatedArrearsTotal += instFine;
        }
      }

      // 5. Tuition Billing Calculation (Current Month)
      let billingTuition = 0;
      let installmentId: number | null = null;
      let currentInstallmentPortion = 0;

      if (!isExtraOnly && targetInstallment && canBillTuition) {
        installmentId = targetInstallment.id;

        if (studentId && customAmount !== undefined) {
          const currentMax = targetInstallment.amount - targetInstallment.paidAmount - targetInstallment.pendingAmount;
          let remainingCustom = customAmount;

          // 1. Fill current installment
          const currentBillable = Math.min(Math.max(0, currentMax), remainingCustom);
          currentInstallmentPortion = currentBillable; // Track specifically for this row
          remainingCustom -= currentBillable;

          // 2. Handle Overflow (Upcoming Installments)
          if (remainingCustom > 0) {
            const futureInsts = (student.feeInstallments as any[]).filter(i =>
              i.installmentNumber > targetInstallment.installmentNumber
            ).sort((a, b) => a.installmentNumber - b.installmentNumber);

            for (const futureInst of futureInsts) {
              if (remainingCustom <= 0) break;
              const futureMax = futureInst.amount - futureInst.paidAmount - futureInst.pendingAmount;
              const applyToFuture = Math.min(futureMax, remainingCustom);

              if (applyToFuture > 0) {
                const newPending = futureInst.pendingAmount + applyToFuture;
                const newRemaining = Math.max(0, futureInst.amount - futureInst.paidAmount - newPending);
                await this.prisma.studentFeeInstallment.update({
                  where: { id: futureInst.id },
                  data: {
                    pendingAmount: newPending,
                    remainingAmount: newRemaining,
                  }
                });
                billingTuition += applyToFuture;
                remainingCustom -= applyToFuture;
                coveredInstNumbers.push(futureInst.installmentNumber);
              }
            }
          }

          // Initial tuition for the challan is the sum of all allocated parts
          billingTuition = currentInstallmentPortion + (customAmount - currentInstallmentPortion - remainingCustom);

          // 3. Final Check: Does it still exceed the total plan?
          if (remainingCustom > 0) {
            results.push({
              studentId: student.id,
              studentName: `${student.fName} ${student.lName || ''}`,
              status: 'EXCEEDS_TOTAL_PLAN',
              reason: `Billing amount exceeds the entire remaining plan by PKR ${remainingCustom}`,
              excessAmount: remainingCustom,
              maxAllowed: billingTuition
            });
            continue;
          }
        } else {
          // Bulk mode: bill the base tuition amount only (late fee is tracked separately via lateFeeFine)
          // remainingAmount now reflects totalAmount-based remaining, but challan.amount must be base tuition
          billingTuition = targetInstallment.amount - (targetInstallment.paidAmount || 0);
          currentInstallmentPortion = billingTuition;
        }

        if (billingTuition > 0) {
          coveredInstNumbers.push(targetInstallment.installmentNumber);
        }
      }

      // 6. Additional Fee Heads
      let additionalCharges = 0;

      // START: Auto-include recurring heads from structure (Bulk Mode or no explicit selection)
      const hasExplicitHeads = studentId && selectedHeads && selectedHeads.length > 0;
      
      if (!hasExplicitHeads) {
        const studentObj = await this.prisma.student.findUnique({
          where: { id: student.id },
          select: { programId: true, classId: true }
        });

        if (studentObj?.programId && studentObj?.classId) {
          const structure = await this.prisma.feeStructure.findUnique({
            where: {
              programId_classId: {
                programId: studentObj.programId,
                classId: studentObj.classId
              }
            },
            include: {
              feeHeads: {
                include: { feeHead: true }
              }
            }
          });

          if (structure?.feeHeads) {
            structure.feeHeads.forEach(sh => {
              // Add non-tuition recurring heads, excluding specific ones like lab/library fees
              if (!sh.feeHead.isTuition && !sh.feeHead.isDiscount && !sh.feeHead.isLabFee && !sh.feeHead.isLibraryFee) {
                snapshotObjects.push({
                  id: sh.feeHead.id,
                  name: sh.feeHead.name,
                  amount: sh.amount,
                  type: 'additional',
                  isSelected: true
                });
              }
            });
          }
        }
      }

      // Handle explicit additional heads (individual mode) - override automatically if provided
      if (hasExplicitHeads) {
        const headIds = (selectedHeads as any[]).filter(h => typeof h === 'number') as number[];
        const adHocHeads = (selectedHeads as any[]).filter(h => typeof h === 'object' && h !== null && !(h as any).id) as any[];

        const dbHeads = headIds.length > 0 ? await this.prisma.feeHead.findMany({
          where: { id: { in: headIds } }
        }) : [];

        const activeDbHeads = dbHeads.filter(h => !h.isDiscount);

        snapshotObjects.push(
          ...activeDbHeads.map(h => ({
            id: h.id, name: h.name, amount: h.amount,
            type: h.isTuition ? 'tuition' : 'additional',
            isSelected: true,
          })),
          ...adHocHeads.map(h => ({
            name: h.name as string, amount: h.amount as number,
            type: 'additional',
            isSelected: true,
            isAdHoc: true
          }))
        );
      }

      // 7. Snapshots are already populated with arrears fines/late fees from loops above.
      // (Currently we don't add redundant Late Fee (Arrears) if already pushed in loops)
      const finalArrearsLateFee = studentId && arrearsLateFee !== undefined ? arrearsLateFee : 0;
      if (finalArrearsLateFee > 0) {
        snapshotObjects.push({
          name: 'Manual Late Fee Adjustment',
          amount: finalArrearsLateFee,
          type: 'additional',
          isSelected: true,
          isLateFee: true,
          isAdHoc: true
        });
      }
      // Note: Calculated arrears fine is already handled by the chain.
      // We only care about current installment fine if it's explicitly passed or if we want to auto-calc it for current.


      // 8a. Final Totals & Dates (EXCLUDING previous arrears - they are linked instead)
      const currentChallanTotal = billingTuition + additionalCharges;

      // PRIORITIZE original installment due date if available, fallback to provided or current date
      // For FEE_HEADS_ONLY extra challans, always use the explicitly provided dueDate
      let challanDueDate = (isFeeHeadOnly && dueDate)
        ? new Date(dueDate)
        : (targetInstallment?.dueDate
          ? new Date(targetInstallment.dueDate)
          : (dueDate ? new Date(dueDate) : new Date()));

      if (currentChallanTotal <= 0 && calculatedArrearsTotal <= 0 && !isFeeHeadOnly) {
        results.push({
          studentId: student.id,
          studentName: `${student.fName} ${student.lName || ''}`,
          status: 'SKIPPED',
          reason: targetInstallment && (targetInstallment.amount - (targetInstallment.paidAmount || 0)) <= 0
            ? `Month ${month} tuition is already fully billed or paid`
            : 'Total billing amount is 0',
          challan: null
        });
        continue;
      }

      let challanType: any = 'INSTALLMENT';
      if (isArrearsOnly) challanType = 'ARREARS_ONLY';
      else if (isFeeHeadOnly) challanType = 'FEE_HEADS_ONLY';
      else if (studentId) challanType = 'MIXED';

      const headSnapshot = JSON.stringify(snapshotObjects);

      // 8. Create Challan
      // Calculate current late fee for this installment's due date
      const challanLateFee = (targetInstallment?.dueDate && genGlobalLateFee > 0 && !isFeeHeadOnly && !isArrearsOnly)
        ? this.calculateLateFee(new Date(targetInstallment.dueDate), genGlobalLateFee)
        : (snapshotObjects.filter(h => h.isLateFee).reduce((sum, h) => sum + (h.amount || 0), 0));

      // Determine initial status based on due date
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const due = new Date(challanDueDate);
      due.setHours(0, 0, 0, 0);
      const initialStatus = now > due ? 'OVERDUE' : 'PENDING';

      const challan = await (this.prisma.feeChallan.create as any)({
        data: {
          studentId: student.id,
          amount: billingTuition,
          fineAmount: 0,
          lateFeeFine: challanLateFee,
          totalAmount: billingTuition + challanLateFee,
          discount: 0,
          dueDate: challanDueDate,
          status: initialStatus,
          studentFeeInstallmentId: installmentId,
          installmentNumber: (isFeeHeadOnly || isArrearsOnly) ? 0 : (targetInstallment?.installmentNumber || 1),
          month: targetInstallment ? targetInstallment.month : monthName,
          session: targetInstallment ? targetInstallment.session : calcSession,
          sessionId: targetInstallment ? targetInstallment.sessionId : (sessionId ? Number(sessionId) : null),
          coveredInstallments: [...new Set(coveredInstNumbers)].sort((a, b) => a - b).join(','),
          selectedHeads: headSnapshot,
          remarks: remarks || `Challan for ${month}`,
          challanNumber: await this.generateChallanNumber(),
          // remainingAmount = totalAmount (tuition + late fee) at generation; reduces as payments come in
          remainingAmount: billingTuition + challanLateFee,
          challanType,
          studentClassId: targetInstallment?.classId || student.classId,
          studentProgramId: targetInstallment?.class?.programId || student.programId,
          studentSectionId: targetInstallment?.sectionId || student.sectionId,
          studentArrearId: sessionArrearIdToLink,
          previousChallans: {
            connect: prevChallanLinks
          }
        },
      });

      // 9a. VOID all linked previous (arrears chain) challans now that they are superseded
      if (prevChallanLinks.length > 0) {
        for (const link of prevChallanLinks) {
          const existingChallan = await this.prisma.feeChallan.findUnique({ 
            where: { id: link.id }, 
            select: { remarks: true, lateFeeFine: true, dueDate: true, status: true } 
          });
          
          // Stamp the dynamic late fee at the moment of supersession (so it's preserved even if DB was 0)
          const stampedLateFee = (existingChallan?.dueDate && genGlobalLateFee > 0)
            ? this.calculateLateFee(existingChallan.dueDate, genGlobalLateFee)
            : (existingChallan?.lateFeeFine || 0);
          
          const lateFeeNote = stampedLateFee > 0 
            ? `; Late Fee PKR ${stampedLateFee} preserved in superseding challan` 
            : '';
          
          await this.prisma.feeChallan.update({
            where: { id: link.id },
            data: {
              status: 'VOID',
              supersededById: challan.id,
              lateFeeFine: stampedLateFee, // stamp at supersession time
              remarks: (existingChallan?.remarks ? `${existingChallan.remarks}; ` : '') + 
                       `Superseded by Challan #${challan.challanNumber} (${challan.month || monthName}${challan.session ? ' ' + challan.session : ''})${lateFeeNote}`,
            },
          });
        }
      }

      // 9. Update Installment Tracking (Current + Past Arrears)
      // Current Month — pendingAmount = totalAmount (full billed amount including late fee)
      if (targetInstallment && currentInstallmentPortion > 0) {
        const newPaid = targetInstallment.paidAmount;
        const instTotalAmount = targetInstallment.amount + challanLateFee;
        // pendingAmount = totalAmount (entire billed amount is now pending)
        const newPending = instTotalAmount;
        // remainingAmount = totalAmount - paidAmount - pendingAmount = 0 (fully billed)
        const newRemaining = Math.max(0, instTotalAmount - newPaid - newPending);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await (this.prisma.studentFeeInstallment.update as any)({
          where: { id: targetInstallment.id },
          data: {
            pendingAmount: newPending,
            remainingAmount: newRemaining,
            lateFeeAccrued: challanLateFee,
            lateFeeLastCalculatedAt: challanLateFee > 0 ? today : undefined,
            totalAmount: instTotalAmount,
          }
        });
      }

      // Past Arrears (Deep Tracking)
      for (const pastInto of pastInstallmentsToBill) {
        const inst = await this.prisma.studentFeeInstallment.findUnique({ where: { id: pastInto.id } });
        if (inst) {
          // Check if there's already a PENDING/OVERDUE/PARTIAL challan for this installment
          // Improved: Search across ALL pending challans for this student/class that might cover this installment number
          const existingPrevChallans = (await this.prisma.feeChallan.findMany({
            where: {
              studentId: student.id,
              studentClassId: inst.classId,
              status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] }
            }
          })).filter(c => {
            // CRITICAL: Exclude the current challan being created, otherwise it voids itself!
            if (c.id === challan.id) return false;

            if (c.studentFeeInstallmentId === inst.id) return true;
            const covered = (c.coveredInstallments || "").split(/[,\-]/).map(Number);
            return covered.includes(inst.installmentNumber);
          });

          // VOID existing older challans as they are now superseded by this newer one
          for (const epc of existingPrevChallans) {
            // Stamp the dynamic late fee at the moment of supersession
            const stampedLateFee = (epc.dueDate && genGlobalLateFee > 0)
              ? this.calculateLateFee(epc.dueDate, genGlobalLateFee)
              : (epc.lateFeeFine || 0);
            
            const lateFeeNote = stampedLateFee > 0 
              ? `; Late Fee PKR ${stampedLateFee} preserved in superseding challan` 
              : '';
            
            await this.prisma.feeChallan.update({
              where: { id: epc.id },
              data: {
                status: 'VOID',
                supersededById: challan.id,
                lateFeeFine: stampedLateFee, // stamp at supersession time
                remarks: (epc.remarks ? `${epc.remarks}; ` : '') + 
                         `Superseded by Challan #${challan.challanNumber} (${challan.month || monthName}${challan.session ? ' ' + challan.session : ''})${lateFeeNote}`
              }
            });
          }

          // Note: In the dynamic model, past unpaid challans remain active as chain nodes.
          // Their debt is aggregated via the previousChallans relation, not by voiding them here.

          if (existingPrevChallans.length === 0) {
            const newPending = inst.pendingAmount + pastInto.amount;
            const newRemaining = Math.max(0, inst.amount - inst.paidAmount - newPending);
            await this.prisma.studentFeeInstallment.update({
              where: { id: inst.id },
              data: {
                pendingAmount: newPending,
                remainingAmount: newRemaining,
              }
            });
          }
        }
      }

      results.push({
        studentId: student.id,
        studentName: `${student.fName} ${student.lName || ''}`,
        status: 'CREATED',
        challanId: challan.id,
        challanNumber: challan.challanNumber,
        challan: await this.prisma.feeChallan.findUnique({
          where: { id: challan.id },
          include: { student: true }
        })
      });
    }

    return results;
  }

  async updateFeeChallan(id: number, payload: UpdateFeeChallanDto) {
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Fetch current challan
      const challan = await prisma.feeChallan.findUnique({
        where: { id },
        include: {
          student: true,
          feeStructure: true,
          studentFeeInstallment: true,
          studentClass: true,
        },
      });

      if (!challan) throw new Error('Challan not found');

      if (challan.status === 'VOID') {
        const allowedVoidFields = ['selectedHeads', 'dueDate', 'remarks'];
        const updateAttemptedOnProtected = Object.keys(payload).some(k => 
          !allowedVoidFields.includes(k) && 
          payload[k] !== undefined && 
          payload[k] !== (challan as any)[k]
        );
        
        if (updateAttemptedOnProtected) {
          throw new BadRequestException('This challan has been superseded and is VOID. Only fee heads and due dates can be updated. To change other financial fields, delete the latest challan first.');
        }
      }

      // Block direct payment for superseded challans (they must be settled via the superseding challan)
      if (challan.status === 'VOID' && (payload.status === 'PAID' || (payload.paidAmount || 0) > (challan.paidAmount || 0))) {
        throw new BadRequestException('This challan has been superseded and cannot be paid directly. Please pay the latest challan instead.');
      }

      // 1a. Pre-calculate dynamic late fee for overdue challans
      const instituteSettings = await prisma.instituteSettings.findFirst();
      const globalLateFee = instituteSettings?.lateFeeFine || 0;
      let dynamicLateFee = 0;
      
      // Use new due date for late fee calculation if provided, otherwise use current
      const effectiveDueDate = payload.dueDate ? new Date(payload.dueDate) : (challan.dueDate ? new Date(challan.dueDate) : null);
      
      if (challan.status !== 'PAID' && effectiveDueDate && globalLateFee > 0) {
        const now = new Date();
        if (now > effectiveDueDate) {
          const diffDays = Math.floor(Math.abs(now.getTime() - effectiveDueDate.getTime()) / (1000 * 60 * 60 * 24));
          dynamicLateFee = diffDays * globalLateFee;
        }
      }

      const data: any = { ...payload };

      // Handle selectedHeads update for VOID challans - recalculate amount and track delta
      if (challan.status === 'VOID' && payload.selectedHeads) {
        const heads = Array.isArray(payload.selectedHeads) ? payload.selectedHeads : JSON.parse(payload.selectedHeads);
        const newAmount = heads.reduce((sum, h) => sum + (h.amount || 0), 0);
        const deltaAmount = newAmount - (challan.amount || 0);
        
        // Update the challan's amount fields
        data.amount = newAmount;
        data.totalAmount = newAmount + (challan.fineAmount || 0) + (challan.lateFeeFine || 0);
        data.remainingAmount = Math.max(0, data.totalAmount - (challan.paidAmount || 0) - (challan.discount || 0));
        
        // Store delta for propagation (will be used later in step 9)
        (data as any)._deltaAmount = deltaAmount;
      }

      // lateFeeFine stamping strategy:
      // - PENDING/PARTIAL: keep lateFeeFine at 0 — it is calculated dynamically from dueDate in GET endpoints
      // - PAID: stamp the final calculated late fee once and lock it permanently
      // - VOID: preserve original lateFeeFine for audit trail (do not overwrite)
      // This prevents double-counting on repeated partial payments.
      if (challan.status === 'VOID') {
        // VOID challans: preserve original lateFeeFine, do not overwrite (req 2.2, 2.7)
        delete data.lateFeeFine;
      } else if (payload.status === 'PAID') {
        // Lock the late fee at the moment of full payment.
        // Prefer the installment's incremental lateFeeAccrued if available.
        const instForLateFee = challan.studentFeeInstallmentId
          ? await (prisma.studentFeeInstallment.findUnique as any)({
              where: { id: challan.studentFeeInstallmentId },
              select: { lateFeeAccrued: true },
            })
          : null;
        const finalLateFee = instForLateFee?.lateFeeAccrued ?? dynamicLateFee;
        data.lateFeeFine = finalLateFee;

        // Freeze the installment's lateFeeAccrued so the cron stops updating it
        if (challan.studentFeeInstallmentId) {
          await (prisma.studentFeeInstallment.update as any)({
            where: { id: challan.studentFeeInstallmentId },
            data: { lateFeeLastCalculatedAt: new Date() },
          });
        }
      } else {
        // For PENDING/PARTIAL updates: stamp the current dynamicLateFee immediately so the
        // DB is up-to-date and the cron job has an accurate baseline to increment from.
        if (dynamicLateFee > 0) {
          data.lateFeeFine = dynamicLateFee;
          if (challan.studentFeeInstallmentId) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            await (prisma.studentFeeInstallment.update as any)({
              where: { id: challan.studentFeeInstallmentId },
              data: {
                lateFeeAccrued: dynamicLateFee,
                lateFeeLastCalculatedAt: today,
              },
            });
          }
        } else {
          delete data.lateFeeFine; // not overdue yet — let stored value remain
        }
      }

      // fineAmount: only update if explicitly passed (e.g. admin override), otherwise keep existing
      // Do NOT accumulate heads into fineAmount — heads live in selectedHeads only
      if (payload.fineAmount !== undefined) {
        data.fineAmount = payload.fineAmount;
      } else {
        delete data.fineAmount; // don't overwrite existing value
      }

      // Convert selectedHeads to JSON string
      if (payload.selectedHeads) {
        data.selectedHeads = JSON.stringify(payload.selectedHeads);
      }

      // 1c. Re-calculate covered installments string for persistent pre-checks
      const coveredNums = new Set<number>();
      const entryInst = payload.installmentNumber !== undefined ? payload.installmentNumber : challan.installmentNumber;
      if (entryInst > 0) coveredNums.add(entryInst);
      if (payload.arrearsSelections && Array.isArray(payload.arrearsSelections)) {
        const selectedInsts = await prisma.studentFeeInstallment.findMany({
          where: { id: { in: payload.arrearsSelections.map(s => s.id) } },
          select: { installmentNumber: true }
        });
        selectedInsts.forEach(si => coveredNums.add(si.installmentNumber));
      }
      if (coveredNums.size > 0) {
        const sorted = Array.from(coveredNums).sort((a, b) => a - b);
        data.coveredInstallments = sorted.length > 1 && (sorted[sorted.length - 1] - sorted[0] === sorted.length - 1)
          ? `${sorted[0]}-${sorted[sorted.length - 1]}`
          : sorted.join(',');
      }

      // Cleanup fields that are not in the database schema
      delete data.arrearsLateFee;
      delete data.arrearsSelections;
      delete data.receivingAmount;
      delete data.paidBy;
      // Also remove any other non-schema fields that might have leaked in
      const validFields = ['status', 'paidAmount', 'paidDate', 'selectedHeads', 'amount', 'dueDate', 'fineAmount', 'lateFeeFine', 'remarks', 'installmentNumber', 'coveredInstallments', 'paymentHistory', 'discount', 'isLateFeeExempt', 'studentId', 'feeStructureId', 'remainingAmount', 'totalAmount'];
      Object.keys(data).forEach(key => {
        if (!validFields.includes(key) && key !== 'customArrearsAmount') delete data[key];
      });

      // 2. Handle Due Date Change and Sync
      if (payload.dueDate) {
        const newDate = new Date(payload.dueDate);
        data.dueDate = newDate;

        // Sync with linked installment if exists
        if (challan.studentFeeInstallmentId) {
          await prisma.studentFeeInstallment.update({
            where: { id: challan.studentFeeInstallmentId },
            data: { dueDate: newDate }
          });
        }
      }

      if (payload.paidDate) data.paidDate = new Date(payload.paidDate);

      // Dynamic Arrears: customArrearsAmount is no longer persisted as a field.
      delete data.customArrearsAmount;

      // 3. Handle Billing Amount Change (Tuition portion)
      const oldTuition = (challan.amount || 0);
      if (payload.amount !== undefined && challan.studentFeeInstallmentId) {
        const newTuition = (payload.amount || 0);
        const diff = newTuition - oldTuition;

        if (diff !== 0) {
          const inst = await prisma.studentFeeInstallment.findUnique({
            where: { id: challan.studentFeeInstallmentId }
          });
          if (inst) {
            if (diff > inst.remainingAmount) {
              throw new Error(`Insufficient remaining amount in installment. Available: ${inst.remainingAmount}`);
            }
            const newPending = inst.pendingAmount + diff;
            const instTotalAmount = (inst as any).totalAmount > 0 ? (inst as any).totalAmount : inst.amount;
            const newRemaining = Math.max(0, instTotalAmount - inst.paidAmount - newPending);
            await prisma.studentFeeInstallment.update({
              where: { id: inst.id },
              data: {
                pendingAmount: newPending,
                remainingAmount: newRemaining,
              }
            });
          }
        }
      }

      // 4. Handle Payment Recording
      if (payload.status === 'PAID' || payload.status === 'PARTIAL') {

        // CRITICAL: Calculate totalAmount to include ALL VOID predecessors' pending amounts
        // This is the total amount that needs to be paid to settle this challan and all its arrears
        const collectVoidDue = async (challanId: number): Promise<number> => {
          const ch = await prisma.feeChallan.findUnique({
            where: { id: challanId },
            select: {
              supersedes: {
                select: { id: true, amount: true, fineAmount: true, lateFeeFine: true, discount: true, settledAmount: true }
              }
            }
          });
          if (!ch) return 0;
          let total = 0;
          for (const pred of (ch.supersedes || [])) {
            const due = (pred.amount || 0) + (pred.fineAmount || 0) + (pred.lateFeeFine || 0) - (pred.discount || 0);
            const settled = pred.settledAmount || 0;
            total += Math.max(0, due - settled);
            total += await collectVoidDue(pred.id);
          }
          return total;
        };
        const voidChainTotal = await collectVoidDue(id);
        
        // Calculate heads total from selectedHeads snapshot (not fineAmount)
        let headsTotal = 0;
        try {
          const rawHeads = typeof challan.selectedHeads === 'string'
            ? JSON.parse(challan.selectedHeads)
            : (challan.selectedHeads || []);
          headsTotal = Array.isArray(rawHeads)
            ? rawHeads.filter((h: any) => h?.isSelected !== false && h?.type === 'additional').reduce((s: number, h: any) => s + (h.amount || 0), 0)
            : 0;
        } catch { headsTotal = 0; }
        
        // totalAmount = VOID chain + current challan's own amount + heads + late fee
        const currentChallanAmount = (payload.amount || challan.amount) + headsTotal + (data.lateFeeFine || challan.lateFeeFine || 0);
        const totalAmountDue = voidChainTotal + currentChallanAmount;
        
        // Update totalAmount to reflect the full amount including VOID chain
        data.totalAmount = totalAmountDue;

        if (data.paidAmount === undefined) {
          // For PAID: include the locked lateFeeFine; for PARTIAL: lateFeeFine is 0 (dynamic)
          data.paidAmount = (payload.amount || challan.amount) + headsTotal + (data.lateFeeFine || 0);
        }

        const paymentIncrease = data.paidAmount - challan.paidAmount;
        if (paymentIncrease > 0) {
          // Admin-provided paidDate is the authoritative settlement date for late fee calculation
          const settlementDate = payload.paidDate ? new Date(payload.paidDate) : new Date();

          // SIMPLIFIED PAYMENT DISTRIBUTION LOGIC
          // Payment flows in FIFO order: oldest VOID predecessor → newest → current challan
          // Only advance to next installment if current challan is 100% paid AND there's extra money
          
          let remainingPayment = paymentIncrease;
          
          // Step 1: Collect VOID chain (oldest first)
          const collectVoidChain = async (challanId: number): Promise<any[]> => {
            const ch = await prisma.feeChallan.findUnique({
              where: { id: challanId },
              select: {
                id: true, amount: true, fineAmount: true, lateFeeFine: true,
                discount: true, settledAmount: true, remarks: true,
                studentFeeInstallmentId: true, supersededById: true,
                installmentNumber: true, month: true, session: true, challanNumber: true,
                supersedes: {
                  select: {
                    id: true, amount: true, fineAmount: true, lateFeeFine: true,
                    discount: true, settledAmount: true, remarks: true,
                    studentFeeInstallmentId: true, supersededById: true,
                    installmentNumber: true, month: true, session: true, challanNumber: true,
                  }
                }
              }
            });
            if (!ch) return [];
            
            const result: any[] = [];
            for (const superseded of (ch.supersedes || [])) {
              const deeper = await collectVoidChain(superseded.id);
              result.push(...deeper);
              result.push(superseded);
            }
            return result; // oldest first
          };
          
          const voidPredecessors = await collectVoidChain(id);
          
          // Step 2: Distribute payment FIFO through VOID chain
          for (const pred of voidPredecessors) {
            if (remainingPayment <= 0) break;
            
            const freshPred = await prisma.feeChallan.findUnique({
              where: { id: pred.id },
              select: { settledAmount: true, remarks: true, lateFeeFine: true, studentFeeInstallmentId: true, amount: true, fineAmount: true, discount: true }
            });
            const currentSettled = freshPred?.settledAmount || 0;
            
            const totalDue = (pred.amount || 0) + (pred.fineAmount || 0) + (pred.lateFeeFine || 0) - (pred.discount || 0);
            const stillOwed = Math.max(0, totalDue - currentSettled);
            
            if (stillOwed <= 0) continue;
            
            const allocate = Math.min(remainingPayment, stillOwed);
            remainingPayment -= allocate;
            const newSettled = currentSettled + allocate;
            const fullySettled = newSettled >= totalDue - 0.01;
            
            // Update VOID challan settlement
            const note = fullySettled
              ? `Fully settled via Challan #${challan.challanNumber} (${challan.month || ''}${challan.session ? ' ' + challan.session : ''})`
              : `Partially settled (PKR ${Math.round(newSettled).toLocaleString()} / ${Math.round(totalDue).toLocaleString()}) via Challan #${challan.challanNumber}`;
            
            const existingRemarks = freshPred?.remarks || pred.remarks || '';
            const cleanedRemarks = existingRemarks
              .split('; ')
              .filter(r => !r.includes(`via Challan #${challan.challanNumber}`))
              .join('; ');
            
            await prisma.feeChallan.update({
              where: { id: pred.id },
              data: {
                settledAmount: newSettled,
                lateFeeFine: freshPred?.lateFeeFine ?? pred.lateFeeFine,
                remarks: cleanedRemarks ? `${cleanedRemarks}; ${note}` : note,
              },
            });
            
            // Update linked installment
            const instId = freshPred?.studentFeeInstallmentId ?? pred.studentFeeInstallmentId;
            if (instId) {
              const predInst = await (prisma.studentFeeInstallment.findUnique as any)({
                where: { id: instId },
                select: { id: true, amount: true, totalAmount: true, paidAmount: true, pendingAmount: true, status: true }
              });
              if (predInst && predInst.status !== 'PAID') {
                const instTotalAmount = (predInst.totalAmount || 0) > 0 ? predInst.totalAmount : predInst.amount;
                if (fullySettled) {
                  await (prisma.studentFeeInstallment.update as any)({
                    where: { id: instId },
                    data: {
                      paidAmount: instTotalAmount,
                      pendingAmount: 0,
                      remainingAmount: 0,
                      status: 'PAID',
                      paidDate: settlementDate,
                    }
                  });
                } else {
                  // Partially settled: only apply tuition portion to installment
                  const tuitionPortion = pred.amount || 0;
                  const finesPortion = (pred.fineAmount || 0) + (pred.lateFeeFine || 0) - (pred.discount || 0);
                  const totalDueForPred = tuitionPortion + finesPortion;
                  
                  const tuitionRatio = totalDueForPred > 0 ? tuitionPortion / totalDueForPred : 1;
                  const tuitionSettled = Math.min(newSettled * tuitionRatio, tuitionPortion);
                  
                  const newInstPaid = predInst.paidAmount + tuitionSettled;
                  const newInstRemaining = Math.max(0, instTotalAmount - newInstPaid);
                  await (prisma.studentFeeInstallment.update as any)({
                    where: { id: instId },
                    data: {
                      paidAmount: newInstPaid,
                      pendingAmount: Math.max(0, predInst.pendingAmount - tuitionSettled),
                      remainingAmount: newInstRemaining,
                      status: newInstPaid >= instTotalAmount ? 'PAID' : (newInstPaid > 0 ? 'PARTIAL' : predInst.status),
                    }
                  });
                }
              }
            }
          }
          
          // Step 3: Apply remaining payment to current challan's installment
          if (remainingPayment > 0 && challan.studentFeeInstallmentId) {
            const inst = await (prisma.studentFeeInstallment.findUnique as any)({
              where: { id: challan.studentFeeInstallmentId },
              select: { id: true, amount: true, totalAmount: true, paidAmount: true, pendingAmount: true, remainingAmount: true }
            });
            if (inst) {
              const instTotalAmount = (inst.totalAmount || 0) > 0 ? inst.totalAmount : inst.amount;
              const instDue = Math.max(0, instTotalAmount - inst.paidAmount);
              
              const applyToInst = Math.min(remainingPayment, instDue);
              remainingPayment -= applyToInst;
              
              const newPaid = inst.paidAmount + applyToInst;
              const newPending = Math.max(0, inst.pendingAmount - applyToInst);
              const newRemaining = Math.max(0, instTotalAmount - newPaid - newPending);
              
              await (prisma.studentFeeInstallment.update as any)({
                where: { id: inst.id },
                data: {
                  paidAmount: newPaid,
                  pendingAmount: newPending,
                  remainingAmount: newRemaining,
                  status: newPaid >= instTotalAmount ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'PENDING'),
                  paidDate: newPaid >= instTotalAmount ? settlementDate : undefined
                }
              });
              
              await (this as any).settleRelatedChallans(prisma, challan.studentId, inst.id, applyToInst, [id], challan.challanNumber);
            }
          }
          
          // Step 4: Validate overpayment - if there's still money left, check if next installment exists
          if (remainingPayment > 0.01) {
            const currentInstNum = challan.installmentNumber || 0;
            if (currentInstNum > 0) {
              const nextInst = await (prisma.studentFeeInstallment.findFirst as any)({
                where: {
                  studentId: challan.studentId,
                  installmentNumber: currentInstNum + 1,
                  status: { not: 'PAID' },
                },
                orderBy: { installmentNumber: 'asc' },
              });
              
              if (!nextInst) {
                // No next installment exists - reject overpayment and rollback
                throw new BadRequestException(
                  `Overpayment detected: PKR ${Math.round(remainingPayment).toLocaleString()} exceeds the total due amount. ` +
                  `Total due: PKR ${Math.round(totalAmountDue).toLocaleString()}, ` +
                  `Payment received: PKR ${Math.round(paymentIncrease).toLocaleString()}. ` +
                  `No next installment available to apply the excess amount. Please adjust the payment amount.`
                );
              }
              
              // Next installment exists - apply advance payment
              const newPaid = Math.min((nextInst.paidAmount || 0) + remainingPayment, nextInst.amount);
              const newRemaining = Math.max(0, nextInst.amount - newPaid);
              await (prisma.studentFeeInstallment.update as any)({
                where: { id: nextInst.id },
                data: {
                  paidAmount: newPaid,
                  remainingAmount: newRemaining,
                  status: newRemaining === 0 ? 'PAID' : 'PARTIAL',
                  ...(newRemaining === 0 ? { paidDate: settlementDate } : {}),
                }
              });
              
              remainingPayment = 0;
            }
          }
          
          // Calculate covered installments string
          const coveredNums = new Set<number>();
          if (challan.installmentNumber > 0) coveredNums.add(challan.installmentNumber);
          for (const pred of voidPredecessors) {
            if (pred.installmentNumber > 0) coveredNums.add(pred.installmentNumber);
          }
          if (coveredNums.size > 0) {
            const sorted = Array.from(coveredNums).sort((a, b) => a - b);
            data.coveredInstallments = sorted.length > 1 && (sorted[sorted.length - 1] - sorted[0] === sorted.length - 1)
              ? `${sorted[0]}-${sorted[sorted.length - 1]}`
              : sorted.join(',');
          }
        }
      }

      // 7.5 Update payment history (JSON field) if receiving amount is provided
      if (payload.receivingAmount && payload.receivingAmount > 0) {
        const currentHistory = Array.isArray((challan as any).paymentHistory)
          ? (challan as any).paymentHistory
          : (typeof (challan as any).paymentHistory === 'string' ? JSON.parse((challan as any).paymentHistory) : []);

        const newEntry = {
          amount: payload.receivingAmount,
          discount: (payload.discount !== undefined ? (payload.discount - (challan.discount || 0)) : 0),
          date: payload.paidDate ? new Date(payload.paidDate) : new Date(),
          method: payload.paidBy || 'Cash',
          remarks: payload.remarks || 'Partial Payment'
        };

        data.paymentHistory = [...currentHistory, newEntry];
      }

      // 7.6 Calculate remainingAmount for the challan (Dynamic Arrears logic)
      // Total billable = tuition + selectedHeads sum + lateFeeFine (fineAmount is NOT used for heads anymore)
      const currentArrears = await this.getRecursiveArrearsIterative([id], prisma, globalLateFee);
      let headsTotal7 = 0;
      try {
        // Use the INCOMING selectedHeads if being updated, otherwise use existing challan value
        const headsSource = data.selectedHeads !== undefined ? data.selectedHeads : challan.selectedHeads;
        const rawHeads7 = typeof headsSource === 'string'
          ? JSON.parse(headsSource)
          : (headsSource || []);
        headsTotal7 = Array.isArray(rawHeads7)
          ? rawHeads7.filter((h: any) => h?.isSelected !== false && h?.type === 'additional').reduce((s: number, h: any) => s + (h.amount || 0), 0)
          : 0;
      } catch { headsTotal7 = 0; }
      // For remainingAmount: use locked lateFeeFine if PAID, otherwise use dynamicLateFee for accurate balance
      const effectiveLateFeeForRemaining = payload.status === 'PAID'
        ? (data.lateFeeFine || 0)
        : dynamicLateFee;
      const totalBillableForChallan = (payload.amount || challan.amount) +
        headsTotal7 +
        effectiveLateFeeForRemaining +
        currentArrears;
      const totalPaidAndDiscount = (data.paidAmount ?? challan.paidAmount) +
        (payload.discount !== undefined ? payload.discount : (challan.discount || 0));
      data.remainingAmount = Math.max(0, totalBillableForChallan - totalPaidAndDiscount);

      // 7.6b Keep totalAmount in sync: tuition + fineAmount (heads) + lateFeeFine
      // totalAmount represents the full billed amount on this challan (excluding arrears from predecessors)
      const currentLateFeeFine = data.lateFeeFine !== undefined ? (data.lateFeeFine || 0) : (challan.lateFeeFine || 0);
      const currentFineAmount = data.fineAmount !== undefined ? (data.fineAmount || 0) : (challan.fineAmount || 0);
      data.totalAmount = (payload.amount || challan.amount) + currentFineAmount + currentLateFeeFine;

      // Determine status based on payments and due date
      if (challan.status === 'VOID') {
        data.status = 'VOID'; // Retain superseded state
      } else if (data.remainingAmount === 0 && totalPaidAndDiscount > 0) {
        data.status = 'PAID';
      } else if (data.remainingAmount > 0) {
        if (totalPaidAndDiscount > 0) {
          data.status = 'PARTIAL';
        } else {
          // Check if overdue
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const effectiveDueDate = payload.dueDate ? new Date(payload.dueDate) : (challan.dueDate ? new Date(challan.dueDate) : null);
          if (effectiveDueDate) {
            const due = new Date(effectiveDueDate);
            due.setHours(0, 0, 0, 0);
            data.status = now > due ? 'OVERDUE' : 'PENDING';
          } else {
            data.status = 'PENDING';
          }
        }
      }

      // Final cleanup of undefined values and invalid keys for Prisma
      Object.keys(data).forEach(key => {
        if (data[key] === undefined) delete data[key];
      });

      const updatedChallan = await prisma.feeChallan.update({
        where: { id },
        data,
        include: { student: true, feeStructure: true },
      });

      // 7.8 Backtrack previousChallans chain and stamp paidDate on all linked installments
      if (updatedChallan.status === 'PAID') {
        const settlementDate = (updatedChallan as any).paidDate || new Date();

        // Collect all installment IDs from the full previousChallans chain recursively
        const collectInstallmentIds = async (challanId: number): Promise<number[]> => {
          const ch = await prisma.feeChallan.findUnique({
            where: { id: challanId },
            select: {
              studentFeeInstallmentId: true,
              previousChallans: { select: { id: true } }
            }
          });
          if (!ch) return [];
          const ids: number[] = [];
          if (ch.studentFeeInstallmentId) ids.push(ch.studentFeeInstallmentId);
          for (const prev of (ch.previousChallans || [])) {
            const nested = await collectInstallmentIds(prev.id);
            ids.push(...nested);
          }
          return ids;
        };

        const allInstIds = await collectInstallmentIds(id);
        const uniqueInstIds = [...new Set(allInstIds)];

        for (const instId of uniqueInstIds) {
          const inst = await prisma.studentFeeInstallment.findUnique({ where: { id: instId } });
          if (inst && inst.status === 'PAID' && !(inst as any).paidDate) {
            await (prisma.studentFeeInstallment.update as any)({
              where: { id: instId },
              data: { paidDate: settlementDate }
            });
          }
        }
      }

      // 8. Update Legacy StudentArrear record if present
      if (updatedChallan.status === 'PAID' && updatedChallan.studentArrearId) {
        const arrear = await prisma.studentArrear.findUnique({
          where: { id: updatedChallan.studentArrearId },
        });

        if (arrear) {
          const newArrearAmount = Math.max(0, arrear.arrearAmount - (updatedChallan.paidAmount || 0));
          let highestInstallment = arrear.lastInstallmentNumber;
          if (updatedChallan.coveredInstallments) {
            const parts = updatedChallan.coveredInstallments.split('-');
            highestInstallment = parseInt(parts[parts.length - 1]) || arrear.lastInstallmentNumber;
          }

          await prisma.studentArrear.update({
            where: { id: arrear.id },
            data: {
              lastInstallmentNumber: highestInstallment,
              arrearAmount: newArrearAmount,
            },
          });

          if (newArrearAmount === 0) {
            await prisma.studentArrear.delete({ where: { id: arrear.id } });
          }
        }
      }

      // 9. Propagation (Propagate changes from VOID challans to their successors)
      if (challan.status === 'VOID') {
        // Check if there's a delta from selectedHeads update
        const deltaTuition = (data as any)._deltaAmount || 0;
        const newFine = data.fineAmount !== undefined ? data.fineAmount : (challan.fineAmount || 0);
        const newLateFee = data.lateFeeFine !== undefined ? data.lateFeeFine : (challan.lateFeeFine || 0);
        const newPaid = data.paidAmount !== undefined ? data.paidAmount : (challan.paidAmount || 0);

        const deltaFine = newFine - (challan.fineAmount || 0);
        const deltaLateFee = newLateFee - (challan.lateFeeFine || 0);
        const deltaPaid = newPaid - challan.paidAmount;

        // Clean up temporary delta field
        delete (data as any)._deltaAmount;

        if (deltaTuition !== 0 || deltaFine !== 0 || deltaLateFee !== 0 || deltaPaid !== 0) {
          await this.propagateAmountChanges(challan.id, deltaTuition, deltaFine, deltaLateFee, deltaPaid, prisma);
        }
      }

      return updatedChallan;
    });
  }

  async deleteFeeChallan(id: number) {
    return await this.prisma.$transaction(async (prisma) => {
      const challan = await prisma.feeChallan.findUnique({
        where: { id },
        include: { feeStructure: true }
      });
      if (!challan) throw new NotFoundException('Challan not found');

      // Block deletion of VOID challans — must delete the superseding challan(s) first
      if (challan.status === 'VOID') {
        const supersedingChallan = await prisma.feeChallan.findUnique({
          where: { id: challan.supersededById! },
          select: { challanNumber: true }
        });
        throw new BadRequestException(
          `Cannot delete a superseded (VOID) challan. Please delete the superseding challan${supersedingChallan ? ` #${supersedingChallan.challanNumber}` : ''} first, which will automatically restore this one.`
        );
      }

      // 1. Identify what was paid for this challan
      // Dynamic Arrears: arrears are no longer stored on the challan itself.
      // Each challan represents its own tuition portion; arrears are tracked via previousChallans links.
      const currentInstTuition = Math.max(0, (challan.amount || 0));
      const arrearsTuition = 0; // No longer stored on single challan
      const totalPaidRev = challan.paidAmount || 0;

      // 2. Locate all linked installments
      const coveredNums = (challan.coveredInstallments || "")
        .split(',')
        .flatMap(s => s.includes('-')
          ? (() => { const [start, end] = s.split('-').map(Number); return Array.from({ length: end - start + 1 }, (_, i) => start + i); })()
          : [Number(s)]
        )
        .filter(n => !isNaN(n) && n > 0);

      const targetInstallmentId = challan.studentFeeInstallmentId;

      // 3a. Reverse on TARGET installment (current month's tuition)
      if (targetInstallmentId) {
        const inst = await (prisma.studentFeeInstallment.findUnique as any)({
          where: { id: targetInstallmentId },
          select: { id: true, amount: true, totalAmount: true }
        });
        if (inst) {
          const resetAmount = (inst.totalAmount || 0) > 0 ? inst.totalAmount : inst.amount;
          // CRITICAL: Check if there are other challans for this installment
          // If yes, put amount in pendingAmount; if no, put in remainingAmount
          const otherChallans = await prisma.feeChallan.count({
            where: {
              studentFeeInstallmentId: targetInstallmentId,
              id: { not: id }, // Exclude the challan being deleted
              status: { in: ['PENDING', 'OVERDUE', 'PARTIAL', 'VOID'] } // Active challans
            }
          });
          
          if (otherChallans > 0) {
            // Other challans exist, put amount in pending
            await (prisma.studentFeeInstallment.update as any)({
              where: { id: inst.id },
              data: {
                paidAmount: 0,
                pendingAmount: resetAmount,
                remainingAmount: 0,
                status: 'PENDING',
                paidDate: null,
              }
            });
          } else {
            // No other challans, put amount in remaining
            await (prisma.studentFeeInstallment.update as any)({
              where: { id: inst.id },
              data: {
                paidAmount: 0,
                pendingAmount: 0,
                remainingAmount: resetAmount,
                status: 'PENDING',
                paidDate: null,
              }
            });
          }
        }
      }

      // 3b. Reverse on ARREARS installments (past months' tuition folded into this challan)
      // Only reverse on installments whose pending was actually set by THIS challan
      // (i.e., they had no prior challan — checked via supersededById linkage)
      if (arrearsTuition > 0 && coveredNums.length > 0) {
        const arrearsInsts = await prisma.studentFeeInstallment.findMany({
          where: {
            studentId: challan.studentId,
            classId: challan.studentClassId || undefined,
            installmentNumber: { in: coveredNums },
            ...(targetInstallmentId ? { id: { not: targetInstallmentId } } : {})
          }
        });

        // How much paid went to arrears (after filling current)?
        let remainingArrearsPaidRev = Math.max(0, totalPaidRev - Math.min(totalPaidRev, currentInstTuition));
        let remainingArrearsPendingRev = Math.max(0, arrearsTuition - remainingArrearsPaidRev);

        const sortedArrearsInsts = arrearsInsts.sort((a, b) => this.getChronoRank(b) - this.getChronoRank(a));

        for (const inst of sortedArrearsInsts) {
          if (remainingArrearsPaidRev <= 0 && remainingArrearsPendingRev <= 0) break;

          // Check if this installment's pending was managed by its own challan (that we VOID'd)
          // If so, the VOID restoration in step 5 handles it — don't double-reverse
          const ownChallan = await prisma.feeChallan.findFirst({
            where: {
              studentFeeInstallmentId: inst.id,
              supersededById: id  // It was VOID'd by the challan we're deleting
            }
          });
          if (ownChallan) continue; // Step 5 will restore this one

          const revPaid = Math.min(inst.paidAmount, remainingArrearsPaidRev);
          remainingArrearsPaidRev -= revPaid;

          const revPending = Math.min(inst.pendingAmount, remainingArrearsPendingRev);
          remainingArrearsPendingRev -= revPending;

          if (revPaid > 0 || revPending > 0) {
            const newPaid = Math.max(0, inst.paidAmount - revPaid);
            const newPending = Math.max(0, inst.pendingAmount - revPending);
            const newRemaining = Math.max(0, inst.amount - newPaid - newPending);

            await (prisma.studentFeeInstallment.update as any)({
              where: { id: inst.id },
              data: {
                paidAmount: newPaid,
                pendingAmount: newPending,
                remainingAmount: newRemaining,
                status: newPaid >= inst.amount ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'PENDING'),
                paidDate: newPaid >= inst.amount ? undefined : null,
              }
            });
          }
        }
      }

      // 4. Restore Session Arrears (if any)
      if (challan.studentArrearId) {
        const arrear = await prisma.studentArrear.findUnique({ where: { id: challan.studentArrearId } });
        if (arrear) {
          await prisma.studentArrear.update({
            where: { id: arrear.id },
            data: { arrearAmount: arrear.arrearAmount + totalPaidRev }
          });
        }
      }

      // 5. Restore entire VOID chain recursively (not just direct predecessor)
      const restoreVoidChain = async (supersedingId: number): Promise<void> => {
        const voided = await prisma.feeChallan.findMany({
          where: { supersededById: supersedingId },
          select: {
            id: true, amount: true, fineAmount: true, lateFeeFine: true,
            discount: true, paidAmount: true, dueDate: true, remarks: true,
            studentFeeInstallmentId: true,
          }
        });

        for (const pred of voided) {
          // Determine restored status based on paidAmount
          const totalDue = (pred.amount || 0) + (pred.fineAmount || 0) + (pred.lateFeeFine || 0) - (pred.discount || 0);
          const paid = pred.paidAmount || 0;

          let newStatus: any = 'PENDING';
          if (paid >= totalDue && totalDue > 0) {
            newStatus = 'PAID';
          } else if (paid > 0) {
            newStatus = 'PARTIAL';
          } else {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const due = new Date(pred.dueDate);
            due.setHours(0, 0, 0, 0);
            if (now > due) newStatus = 'OVERDUE';
          }

          // Strip supersession remarks and settlement notes
          let newRemarks = pred.remarks || '';
          newRemarks = newRemarks.split('; ').filter(r =>
            !r.includes('Superseded by Challan #') &&
            !r.includes('settled via Challan #') &&
            !r.includes('Late Fee PKR') &&
            !r.includes('preserved in superseding')
          ).join('; ').trim();
          if (newRemarks.endsWith(';')) newRemarks = newRemarks.slice(0, -1).trim();

          await prisma.feeChallan.update({
            where: { id: pred.id },
            data: {
              status: newStatus,
              supersededById: null,
              settledAmount: 0, // reset settlement allocation
              remarks: newRemarks || null,
            }
          });

          // Restore the linked installment to unpaid state
          if (pred.studentFeeInstallmentId) {
            const inst = await (prisma.studentFeeInstallment.findUnique as any)({
              where: { id: pred.studentFeeInstallmentId },
              select: { id: true, amount: true, totalAmount: true, status: true }
            });
            if (inst && inst.status === 'PAID') {
              const resetAmount = (inst.totalAmount || 0) > 0 ? inst.totalAmount : inst.amount;
              // CRITICAL: Since a challan already exists for this installment (the one being restored),
              // put the amount in pendingAmount, not remainingAmount
              await (prisma.studentFeeInstallment.update as any)({
                where: { id: pred.studentFeeInstallmentId },
                data: {
                  paidAmount: 0,
                  pendingAmount: resetAmount, // Amount goes to pending since challan exists
                  remainingAmount: 0,
                  status: 'PENDING',
                  paidDate: null,
                }
              });
            }
          }

          // CRITICAL FIX: Do NOT recurse to restore the entire chain
          // Only restore direct predecessors (challans directly superseded by the deleted challan)
          // The chain should remain: if #107 supersedes #106, and #106 supersedes #105,
          // deleting #107 should only restore #106, leaving #105 still superseded by #106
          // await restoreVoidChain(pred.id); // REMOVED - don't restore entire chain
        }
      };

      await restoreVoidChain(id);

      // 5b. Reset any future installments that were marked PAID via advance credit (FIFO overflow)
      // These are installments with installmentNumber > challan's installmentNumber that have no PAID challan
      const challanInstNum = challan.installmentNumber || 0;
      if (challanInstNum > 0 && challan.studentId) {
        const futureInsts = await prisma.studentFeeInstallment.findMany({
          where: {
            studentId: challan.studentId,
            installmentNumber: { gt: challanInstNum },
            status: { in: ['PAID', 'PARTIAL'] },
          }
        });

        for (const futInst of futureInsts) {
          // Check if there's a PAID challan for this installment (legitimate payment)
          const paidChallan = await prisma.feeChallan.findFirst({
            where: {
              studentFeeInstallmentId: futInst.id,
              status: 'PAID',
            }
          });
          if (paidChallan) continue; // Legitimately paid — don't touch

          // Also check if there's a PENDING/PARTIAL challan (billed but not yet paid)
          const activeChallan = await prisma.feeChallan.findFirst({
            where: {
              studentFeeInstallmentId: futInst.id,
              status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            }
          });

          if (!activeChallan) {
            // No challan covers this installment — it was marked PAID via advance credit, reset it
            await (prisma.studentFeeInstallment.update as any)({
              where: { id: futInst.id },
              data: {
                paidAmount: 0,
                pendingAmount: 0,
                // Preserve totalAmount (includes accrued late fee) — only reset paid/pending/remaining
                remainingAmount: (futInst as any).totalAmount > 0 ? (futInst as any).totalAmount : futInst.amount,
                status: 'PENDING',
                paidDate: null,
              }
            });
          }
        }
      }

      return await prisma.feeChallan.delete({ where: { id } });
    });
  }

  async getStudentFeeHistory(studentId: number) {
    const history = await this.prisma.feeChallan.findMany({
      where: { studentId },
      include: {
        student: true,
        feeStructure: {
          include: {
            program: true,
            class: true,
          },
        },
        studentClass: true,
        studentProgram: true,
        studentFeeInstallment: {
          select: { id: true, lateFeeAccrued: true, lateFeeLastCalculatedAt: true, paidDate: true } as any
        },
        supersededBy: {
          select: { id: true, status: true, challanNumber: true, paidAmount: true, amount: true, fineAmount: true, lateFeeFine: true, discount: true }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // lateFeeFine is stamped at generation/update time and kept in sync by the cron job — use stored values.
    history.forEach((challan: any) => {
      const instAccrued = challan.studentFeeInstallment?.lateFeeAccrued ?? null;
      challan.lateFeeFine = challan.status === 'PAID'
        ? (challan.lateFeeFine || 0)
        : (instAccrued !== null ? instAccrued : (challan.lateFeeFine || 0));
    });

    return history;
  }

  async getStudentFeeSummary(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, program: true },
    });

    if (!student) throw new NotFoundException('Student not found');

    const allChallans = await this.prisma.feeChallan.findMany({
      where: { studentId },
      include: {
        feeStructure: {
          include: {
            feeHeads: { include: { feeHead: true } },
            class: true,
            program: true,
          },
        },
        studentClass: true,
        studentProgram: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const instituteSettings = await this.prisma.instituteSettings.findFirst();
    const globalLateFee = instituteSettings?.lateFeeFine || 0;

    const sessionMap = new Map<string, any>();
    let totalAllSessionsPaid = 0;
    let totalAllSessionsAdditional = 0;

    allChallans.forEach((c: any) => {
      totalAllSessionsPaid += c.paidAmount;
      totalAllSessionsAdditional += c.fineAmount;

      // Calculate dynamic late fee for this challan if not paid
      if (c.status === 'PAID') {
        // keep locked value
      } else if (c.dueDate && globalLateFee > 0) {
        // All non-PAID statuses including VOID: calculate dynamically
        c.lateFeeFine = this.calculateLateFee(c.dueDate, globalLateFee);
      } else {
        c.lateFeeFine = c.lateFeeFine || 0;
      }

      const sessionKey = c.feeStructureId
        ? `structure - ${c.feeStructureId} `
        : c.studentClassId && c.studentProgramId
          ? `snapshot - ${c.studentProgramId} -${c.studentClassId} `
          : 'unclassified';

      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, {
          sessionKey,
          class: c.feeStructure?.class || c.studentClass,
          program: c.feeStructure?.program || c.studentProgram,
          feeStructure: c.feeStructure,
          challans: [],
          isCurrentSession:
            c.studentClassId === student.classId &&
            c.studentProgramId === student.programId,
        });
      }
      sessionMap.get(sessionKey).challans.push(c);
    });

    const sessions = Array.from(sessionMap.values()).map((session: any) => {
      // For each session, calculate stats
      const challans = session.challans;
      const feeStructure = session.feeStructure;

      // tuitionOnlyAmount from structure
      let tuitionOnlyAmount = 0;
      if (feeStructure) {
        tuitionOnlyAmount = feeStructure.feeHeads
          .filter((fh) => fh.feeHead.isTuition)
          .reduce((sum, fh) => sum + fh.amount, 0);
      }

      const totalPaid = challans.reduce(
        (sum, c) => sum + (c.paidAmount || 0),
        0,
      );
      const totalAdditional = challans.reduce(
        (sum, c: any) => sum + (c.fineAmount || 0),
        0,
      );
      const currentLateFee = challans.reduce(
        (sum, c: any) => sum + (c.lateFeeFine || 0),
        0,
      );

      // Robust installment counting: Count actual paid challans that have a tuition portion
      const paidInstallments = challans.filter(
        (c) => c.status === 'PAID' && c.amount > 0,
      ).length;

      const totalInstallments = feeStructure?.installments || 0;

      // Improved logic for session total:
      // If no fee heads are marked as tuition, treat the entire structure as tuition to be replaced.
      const tuitionBaseInStructure =
        tuitionOnlyAmount > 0
          ? tuitionOnlyAmount
          : feeStructure?.totalAmount || 0;
      const otherChargesAmount = Math.max(
        0,
        (feeStructure?.totalAmount || 0) - tuitionBaseInStructure,
      );

      const effectiveTuition =
        session.isCurrentSession && student.tuitionFee && student.tuitionFee > 0
          ? student.tuitionFee
          : tuitionBaseInStructure;

      const sessionTotalAmount = effectiveTuition + otherChargesAmount;
      const tuitionPaid = totalPaid - totalAdditional;

      // New: Calculate breakdown of additional charges paid from selectedHeads JSON
      const additionalChargesMap = new Map();
      challans
        .filter((c) => c.status === 'PAID' && c.selectedHeads)
        .forEach((c) => {
          try {
            const parsedHeads = JSON.parse(c.selectedHeads) || [];
            if (Array.isArray(parsedHeads)) {
              parsedHeads.forEach((head) => {
                // Only count if it's an additional charge (not tuition, not discount)
                const isAdditional =
                  head.type === 'additional' ||
                  (!head.type && !head.isTuition && !head.isDiscount);
                if (isAdditional && head.amount > 0) {
                  const current = additionalChargesMap.get(head.name) || 0;
                  additionalChargesMap.set(head.name, current + head.amount);
                }
              });
            }
          } catch (e) {
            /* ignore parse errors */
          }
        });
      const additionalChargesPaid = Object.fromEntries(additionalChargesMap);

      return {
        ...session,
        sessionLabel:
          session.class && session.program
            ? `${session.class.name} - ${session.program.name} `
            : 'Unclassified',
        stats: {
          sessionFee: sessionTotalAmount,
          tuitionFee: effectiveTuition,
          otherCharges: otherChargesAmount,
          paidThisSession: totalPaid,
          tuitionPaid,
          remainingDues: Math.max(0, sessionTotalAmount - tuitionPaid),
          paidInstallments,
          totalInstallments,
          pendingInstallments: Math.max(
            0,
            totalInstallments - paidInstallments,
          ),
          additionalChargesPaid, // Breakdown object { name: amount }
          currentLateFee,
        },
      };
    });

    // current session summary for the "Create Challan" view
    const currentSession = sessions.find((s) => s.isCurrentSession);
    const summary = currentSession
      ? currentSession.stats
      : {
        sessionFee: 0,
        paidThisSession: 0,
        tuitionPaid: 0,
        remainingDues: 0,
        paidInstallments: 0,
        totalInstallments: 0,
        pendingInstallments: 0,
      };

    return {
      student,
      sessions,
      summary: {
        ...summary,
        totalAmount: summary.sessionFee, // Alias for backward compatibility
        overall: {
          totalPaid: totalAllSessionsPaid,
          totalAdditional: totalAllSessionsAdditional,
        },
      },
    };
  }

  // Reports
  async getRevenueOverTime(
    period: 'daily' | 'weekly' | 'month' | 'year' | 'overall',
  ) {
    const startDate = this.getDateRange(period);

    const paidChallans = await this.prisma.feeChallan.findMany({
      where: {
        status: 'PAID',
        paidDate: {
          gte: startDate,
        },
      },
      select: { paidAmount: true, paidDate: true },
    });

    const groupedData = {};

    paidChallans.forEach((challan) => {
      if (!challan.paidDate) return;

      const date = new Date(challan.paidDate);
      let key = '';

      if (period === 'daily') {
        // Daily: "2024-01-01"
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        // Group by Week (e.g., "Week 45, 2024") - simple approximation
        // Can be improved with actual ISO week logic
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil(
          ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
        );
        key = `Week ${weekNo}, ${date.getFullYear()} `;
      } else if (period === 'month') {
        // Group by Month (e.g., "Jan 2024")
        key = date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
      } else if (period === 'year') {
        // Group by Year (e.g., "2024")
        key = date.getFullYear().toString();
      } else {
        // Overall - default to monthly for overall trend
        key = date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
      }

      groupedData[key] = (groupedData[key] || 0) + (challan.paidAmount || 0);
    });

    // Convert to array format for Recharts
    const chartData = Object.entries(groupedData).map(([name, value]) => ({
      name,
      value,
    }));

    // Sort by date for daily filter
    if (period === 'daily') {
      chartData.sort(
        (a, b) => new Date(a.name).getTime() - new Date(b.name).getTime(),
      );
    } else if (period === 'month') {
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      chartData.sort((a, b) => {
        const [monA, yearA] = a.name.split(' ');
        const [monB, yearB] = b.name.split(' ');
        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
        return months.indexOf(monA) - months.indexOf(monB);
      });
    }

    return chartData;
  }

  // Helper to get date range based on period
  private getDateRange(period: string): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    if (period === 'daily') {
      // Last 30 Days
      date.setDate(date.getDate() - 30);
    } else if (period === 'weekly') {
      // Last 12 Weeks (approx 3 months)
      date.setDate(date.getDate() - 12 * 7);
    } else if (period === 'month') {
      // Last 12 Months
      date.setMonth(date.getMonth() - 12);
    } else if (period === 'year') {
      // Last 5 Years
      date.setFullYear(date.getFullYear() - 5);
    } else {
      // Overall - retrieve everything (e.g. from year 2000)
      date.setFullYear(2000);
    }

    return date;
  }

  async getFeeCollectionSummary(
    period: 'daily' | 'weekly' | 'month' | 'year' | 'overall' = 'month',
  ) {
    const startDate = this.getDateRange(period);

    const where: any = {
      status: 'PAID',
      paidDate: {
        gte: startDate,
      },
    };

    // 1. Total Revenue — PAID challans' full paidAmount + PARTIAL challans' paidAmount (no double-counting via settledAmount on VOID)
    const paidRevenueAggr = await this.prisma.feeChallan.aggregate({
      where,
      _sum: { paidAmount: true },
    });

    // Also include PARTIAL challans that received payment in the period
    const partialRevenueAggr = await this.prisma.feeChallan.aggregate({
      where: {
        status: 'PARTIAL',
        paidDate: { gte: startDate },
      },
      _sum: { paidAmount: true },
    });

    const totalRevenue = (paidRevenueAggr._sum.paidAmount || 0) + (partialRevenueAggr._sum.paidAmount || 0);

    // 2. Outstanding: Sum of pendingAmount from all StudentFeeInstallment records
    // This represents installments that have been generated but not fully paid
    const outstandingAggr = await this.prisma.studentFeeInstallment.aggregate({
      _sum: { pendingAmount: true },
    });

    const totalOutstanding = outstandingAggr._sum.pendingAmount || 0;

    return {
      totalRevenue,
      totalOutstanding,
    };
  }

  async getClassCollectionStats(
    period: 'daily' | 'weekly' | 'month' | 'year' | 'overall' = 'month',
  ) {
    const startDate = this.getDateRange(period);

    const stats: any = {};

    // Fetch all challans within the period
    const challans = await this.prisma.feeChallan.findMany({
      where: {
        OR: [
          { paidDate: { gte: startDate } }, // for collection
          { dueDate: { gte: startDate } }, // for outstanding
        ],
      },
      include: {
        student: {
          select: {
            lateFeeFine: true,
          },
        },
        studentClass: {
          include: { program: true },
        },
      } as any,
    });

    const now = new Date();

    challans.forEach((c: any) => {
      let className = 'Unknown Class';

      if (c.studentClass) {
        className = `${c.studentClass.name} - ${c.studentClass.program?.name || '-'} `;
      }

      if (!stats[className]) {
        stats[className] = { name: className, collected: 0, outstanding: 0 };
      }

      if ((c.status === 'PAID' || c.status === 'PARTIAL') && c.paidDate && new Date(c.paidDate) >= startDate) {
        stats[className].collected += c.paidAmount || 0;
      }

      // Outstanding: use totalAmount (kept in sync by cron + updates)
      if (c.status !== 'PAID' && c.status !== 'VOID' && new Date(c.dueDate) >= startDate) {
        const netAmount = (c.totalAmount || 0) - (c.discount || 0);
        stats[className].outstanding += Math.max(0, netAmount - (c.paidAmount || 0));
      }
    });

    // Convert to array
    return Object.values(stats);
  }
  // Fee Challan Templates
  async createFeeChallanTemplate(payload: any) {
    // Sanitize payload to remove extraneous fields like 'createdBy'
    const { name, htmlContent, isDefault } = payload;

    // If the new template is set as default, unset other defaults
    if (isDefault) {
      await this.prisma.feeChallanTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return await this.prisma.feeChallanTemplate.create({
      data: {
        name,
        htmlContent,
        isDefault,
      },
    });
  }

  async getFeeChallanTemplates() {
    return await this.prisma.feeChallanTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeChallansForDemotion(studentId: number, classId: number) {
    if (!studentId || !classId) return;

    console.log(
      `🧹 Cleaning up challans for student ${studentId} in class ${classId} (Demotion)`,
    );

    // Delete ONLY unpaid/pending challans for the class being left
    // We rely on the snapshot 'studentClassId' AND the 'feeStructure.classId' to be safe
    // Since we fixed snapshots, we should prioritize them.
    const result = await this.prisma.feeChallan.deleteMany({
      where: {
        studentId,
        paidAmount: 0, // STRICT: Only delete challans with ZERO payments. Preserves partial history.
        status: { not: 'PAID' }, // Should be redundant if paidAmount is 0, but good for clarity.
        AND: [
          {
            OR: [
              { studentClassId: classId }, // Snapshot match
              {
                studentClassId: null, // Legacy fallback
                feeStructure: { classId: classId },
              },
              // FALLBACK: If no snapshot and no fee structure link (orphaned?),
              // we might want to check against the student's *current* class (which is still 'classId' coming in)
              // But 'classId' arg IS the current class.
            ],
          },
        ],
      },
    });

    console.log(`✅ Deleted ${result.count} challans.`);
  }

  async getFeeChallanTemplateById(id: number) {
    const template = await this.prisma.feeChallanTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(
        `Fee challan template with ID ${id} not found`,
      );
    }

    return template;
  }

  async updateFeeChallanTemplate(id: number, payload: any) {
    const template = await this.prisma.feeChallanTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(
        `Fee challan template with ID ${id} not found`,
      );
    }

    // If setting as default, unset other defaults
    if (payload.isDefault) {
      await this.prisma.feeChallanTemplate.updateMany({
        where: {
          id: { not: id },
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return await this.prisma.feeChallanTemplate.update({
      where: { id },
      data: payload,
    });
  }

  async deleteFeeChallanTemplate(id: number) {
    const template = await this.prisma.feeChallanTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(
        `Fee challan template with ID ${id} not found`,
      );
    }

    return await this.prisma.feeChallanTemplate.delete({
      where: { id },
    });
  }

  async getDefaultTemplate() {
    const template = await this.prisma.feeChallanTemplate.findFirst({
      where: { isDefault: true },
    });
    return template;
  }

  private async settleRelatedChallans(
    prisma: any,
    studentId: number,
    installmentId: number,
    amount: number,
    excludeIds: number[] = [],
    originChallanNumber?: string,
  ) {
    const relatedChallans = await prisma.feeChallan.findMany({
      where: {
        studentId,
        studentFeeInstallmentId: installmentId,
        status: { notIn: ['PAID', 'VOID'] }, // Exclude both PAID and VOID challans
        id: { notIn: excludeIds },
      },
    });

    let remainingToSettle = amount;
    for (const rc of relatedChallans) {
      if (remainingToSettle <= 0) break;
      const rcTotal = rc.amount + rc.fineAmount - rc.discount;
      const rcNeeded = rcTotal - rc.paidAmount;
      const rcApply = Math.min(remainingToSettle, rcNeeded);

      if (rcApply > 0) {
        const rcNewPaid = rc.paidAmount + rcApply;
        const currentRemarks = rc.remarks ? `${rc.remarks}; ` : '';
        const arrearsRemark = originChallanNumber ? `Settled in arrears via Challan #${originChallanNumber}` : '';

        await prisma.feeChallan.update({
          where: { id: rc.id },
          data: {
            paidAmount: rcNewPaid,
            remainingAmount: Math.max(0, rcTotal - rcNewPaid),
            status: rcNewPaid >= rcTotal ? 'PAID' : 'PARTIAL',
            remarks: arrearsRemark ? `${currentRemarks}${arrearsRemark}` : rc.remarks,
          },
        });
        remainingToSettle -= rcApply;
      }
    }
  }

  private injectLateFeeRecursive(challans: any[], _globalLateFee: number): any[] {
    // lateFeeFine is now stamped at generation/update time and kept in sync by the cron job.
    // No dynamic recalculation needed — just pass through stored values.
    return challans.map((prev: any) => {
      const enriched = { ...prev, lateFeeFine: prev.lateFeeFine || 0 };
      if (Array.isArray(enriched.previousChallans) && enriched.previousChallans.length > 0) {
        return { ...enriched, previousChallans: this.injectLateFeeRecursive(enriched.previousChallans, _globalLateFee) };
      }
      return enriched;
    });
  }

  private getClassRank(cls: any): number {
    if (!cls) return 0;
    return (Number(cls.year || 0) * 100) + (Number(cls.semester || 0));
  }

  private getChronoRank(inst: any): number {
    if (!inst) return 0;

    // 1. Hierarchical Class Rank
    const classRank = this.getClassRank(inst.class);

    // 2. Relative date or installment rank
    let subRank = 0;
    if (inst.dueDate) {
      subRank = new Date(inst.dueDate).getTime();
    } else {
      // Fallback: Session Base + Installment Number
      const sessionYear = inst.session ? parseInt(inst.session.split('-')[0]) : 2000;
      const instNum = Number(inst.installmentNumber || 0);
      subRank = (sessionYear * 1000) + instNum;
    }

    // Combine Class Order (High Weight) with Time/Sequence (Low Weight)
    return (classRank * 1e14) + subRank;
  }

  private async getRecursiveArrearsIterative(challanIds: number[], prisma: any, _globalLateFee: number = 0): Promise<number> {
    let total = 0;
    let currentLevelIds = [...challanIds];
    const visited = new Set<number>();

    while (currentLevelIds.length > 0) {
      // Find all predecessors at the current level — via BOTH ArrearsChain and Supersession relations
      const levelChallans = await prisma.feeChallan.findMany({
        where: { id: { in: currentLevelIds } },
        include: { 
          previousChallans: { 
            select: { 
              id: true, status: true, amount: true, fineAmount: true, lateFeeFine: true, 
              dueDate: true, paidAmount: true, discount: true, settledAmount: true
            } 
          },
          // Also traverse VOID chain (supersedes relation)
          supersedes: {
            select: {
              id: true, status: true, amount: true, fineAmount: true, lateFeeFine: true,
              dueDate: true, paidAmount: true, discount: true, settledAmount: true
            }
          }
        }
      });

      const nextLevelIds: number[] = [];
      for (const c of levelChallans) {
        if (visited.has(c.id)) continue;
        visited.add(c.id);

        // Merge both predecessor lists (ArrearsChain + Supersession VOID chain)
        // Use a Set to deduplicate — the same challan can appear in both relations
        const seenIds = new Set<number>();
        const allPredecessors: any[] = [];
        for (const p of [...(c.previousChallans || []), ...(c.supersedes || [])]) {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            allPredecessors.push(p);
          }
        }

        for (const prev of allPredecessors) {
          if (visited.has(prev.id)) continue;
          
          // PAID ancestors: their entire chain is settled — stop recursion here
          if (prev.status === 'PAID') continue;

          if (prev.status === 'VOID') {
            // VOID challans: add full totalDue as arrears (paidAmount on superseding challan covers the settled portion)
            const totalDue = (prev.amount || 0) + (prev.fineAmount || 0) + (prev.lateFeeFine || 0) - (prev.discount || 0);
            total += totalDue;
            nextLevelIds.push(prev.id);
            continue;
          }

          // Use stored lateFeeFine (stamped at generation, cron-maintained) — no dynamic recalculation
          const effectiveLateFee = prev.lateFeeFine || 0;

          // Current balance of this ancestor (Tuition + Heads(fineAmount) + LateFee - Paid - Discount)
          const rem = Math.max(0, 
            (prev.amount || 0) + 
            (prev.fineAmount || 0) + 
            effectiveLateFee - 
            (prev.paidAmount || 0) - 
            (prev.discount || 0)
          );
          
          total += rem;
          nextLevelIds.push(prev.id);
        }
      }
      currentLevelIds = nextLevelIds;
    }
    return total;
  }

  // Propagate amount changes from VOID challans to their superseding challans
  private async propagateAmountChanges(challanId: number, deltaTuition: number, deltaFine: number, deltaLateFee: number, deltaPaid: number, prisma: any) {
    // Find the VOID challan and its superseding challan
    const voidChallan = await prisma.feeChallan.findUnique({
      where: { id: challanId },
      select: { id: true, supersededById: true, status: true }
    });

    if (!voidChallan || voidChallan.status !== 'VOID' || !voidChallan.supersededById) {
      return; // Nothing to propagate
    }

    // Get the superseding challan
    const supersedingChallan = await prisma.feeChallan.findUnique({
      where: { id: voidChallan.supersededById },
      select: {
        id: true,
        amount: true,
        fineAmount: true,
        lateFeeFine: true,
        paidAmount: true,
        discount: true,
        totalAmount: true,
        remainingAmount: true,
        status: true
      }
    });

    if (!supersedingChallan) return;

    // Calculate new totals for the superseding challan
    // The superseding challan's remainingAmount should reflect the VOID challan's balance
    const newTotalAmount = (supersedingChallan.totalAmount || 0) + deltaTuition + deltaFine + deltaLateFee;
    const newRemainingAmount = Math.max(0, newTotalAmount - (supersedingChallan.paidAmount || 0) - (supersedingChallan.discount || 0));

    // Determine new status based on remaining amount
    let newStatus = supersedingChallan.status;
    if (newRemainingAmount === 0 && (supersedingChallan.paidAmount || 0) > 0) {
      newStatus = 'PAID';
    } else if (newRemainingAmount > 0 && (supersedingChallan.paidAmount || 0) > 0) {
      newStatus = 'PARTIAL';
    } else if (newRemainingAmount > 0 && (supersedingChallan.paidAmount || 0) === 0) {
      // Check if overdue
      const challanWithDate = await prisma.feeChallan.findUnique({
        where: { id: supersedingChallan.id },
        select: { dueDate: true }
      });
      if (challanWithDate?.dueDate) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const due = new Date(challanWithDate.dueDate);
        due.setHours(0, 0, 0, 0);
        newStatus = now > due ? 'OVERDUE' : 'PENDING';
      }
    }

    // Update the superseding challan
    await prisma.feeChallan.update({
      where: { id: supersedingChallan.id },
      data: {
        totalAmount: newTotalAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus
      }
    });

    // Recursively propagate if this challan is also superseded
    if (newStatus === 'VOID') {
      const nextSuperseding = await prisma.feeChallan.findUnique({
        where: { id: supersedingChallan.id },
        select: { supersededById: true }
      });
      if (nextSuperseding?.supersededById) {
        await this.propagateAmountChanges(supersedingChallan.id, deltaTuition, deltaFine, deltaLateFee, deltaPaid, prisma);
      }
    }
  }
}
