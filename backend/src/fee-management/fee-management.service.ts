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

  private async generateChallanNumber(): Promise<string> {
    // Find the last challan ordered by id to get the next sequence number
    const lastChallan = await this.prisma.feeChallan.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const nextSeq = (lastChallan?.id || 0) + 1;
    // Pad to 13 digits as requested
    const seqStr = String(nextSeq).padStart(13, '0');

    return seqStr;
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
        `${student.fName} ${student.mName || ''} ${student.lName || ''}`.trim(),
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

    console.log('🏷️ CreateFeeChallan - isArrearsPayment:', isArrearsPayment);
    console.log('🏷️ Initial classId:', classId, 'programId:', programId);

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
        '🎯 Arrears Payment - Using arrear classId:',
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
          '✅ Using fee structure from original class:',
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
      '💾 Creating challan with studentClassId:',
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
        status: 'PENDING',
        challanType: isArrearsPayment ? 'ARREARS_ONLY' : 'INSTALLMENT',
        includesArrears: isArrearsPayment || false,
        arrearsAmount: isArrearsPayment ? amount : 0,
        studentArrearId: (payload as any).studentArrearId
          ? Number((payload as any).studentArrearId)
          : null,
      },
      include: {
        student: true,
        feeStructure: true,
        studentClass: true,
        studentProgram: true,
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
      startDate,
      endDate,
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
        { student: { mName: { contains: searchTrimmed } } },
        { student: { lName: { contains: searchTrimmed } } },
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

    if (installmentNumber) {
      where.installmentNumber = Number(installmentNumber);
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
      },
      orderBy: [{ dueDate: 'asc' }, { installmentNumber: 'asc' }],
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage,
        limit,
      },
    };
  }

  async getBulkChallans(query: any) {
    const { startDate, endDate, programId, classId, sectionId } = query;
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
      },
      orderBy: [{ dueDate: 'asc' }, { student: { rollNumber: 'asc' } }],
    });

    // Calculate dynamic late fees
    const instituteSettings = await this.prisma.instituteSettings.findFirst();
    const globalLateFee = instituteSettings?.lateFeeFine || 0;
    const now = new Date();
    data.forEach((challan: any) => {
      challan.lateFeeFine = 0;
      if (
        challan.status === 'PENDING' &&
        challan.dueDate &&
        globalLateFee > 0
      ) {
        const dueDate = new Date(challan.dueDate);
        if (now > dueDate) {
          const diffTime = Math.abs(now.getTime() - dueDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          challan.lateFeeFine = diffDays * globalLateFee;
        }
      }
    });

    return data;
  }

  async getInstallmentPlans(query: {
    studentId?: string;
    classId?: string;
    sectionId?: string;
  }) {
    const { studentId, classId, sectionId } = query;
    const where: any = { passedOut: false };

    if (studentId) where.id = Number(studentId);
    if (classId) where.classId = Number(classId);
    if (sectionId) where.sectionId = Number(sectionId);

    return await this.prisma.student.findMany({
      where,
      select: {
        id: true,
        fName: true,
        mName: true,
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
            classId: true,
          } as any,
          where: classId
            ? ({ classId: Number(classId) } as any)
            : studentId
              ? {}
              : undefined,
          orderBy: { installmentNumber: 'asc' } as any,
        },
      },
    });
  }

  async generateChallansFromPlan(payload: {
    month: string; // YYYY-MM
    studentId?: number;
    programId?: number;
    classId?: number;
    sectionId?: number;
    customAmount?: number; // For individual student: custom billing amount (tuition portion)
    selectedHeads?: number[]; // For individual student: custom fee heads to add
    customArrearsAmount?: number; // For individual student: custom arrears amount to include
    remarks?: string;
    dueDate?: string; // For individual student: custom due date (YYYY-MM-DD)
  }) {
    const { month, studentId, programId, classId, sectionId, customAmount, selectedHeads, customArrearsAmount, remarks, dueDate } = payload;
    const [year, monthNum] = month.split('-').map(Number);

    // 1. Find target students
    const studentWhere: any = { passedOut: false };
    if (studentId) studentWhere.id = Number(studentId);
    if (programId) studentWhere.programId = Number(programId);
    if (classId) studentWhere.classId = Number(classId);
    if (sectionId) studentWhere.sectionId = Number(sectionId);

    const students = await this.prisma.student.findMany({
      where: studentWhere,
      include: {
        feeInstallments: true,
      },
    });

    const results: any[] = [];

    for (const student of students) {
      // 2. Find matching installment in the plan for this class
      const targetInstallment: any = (student.feeInstallments as any[]).find((i) => {
        if (i.classId !== student.classId) return false;
        const d = new Date(i.dueDate);
        return d.getFullYear() === year && d.getMonth() + 1 === monthNum;
      });

      // ARREARS ONLY check: if individual mode, and customAmount is 0/undefined and customArrearsAmount > 0
      const isArrearsOnly = !!studentId && (customAmount === 0 || customAmount === undefined) && (customArrearsAmount ?? 0) > 0;

      // FEE HEAD ONLY check: if individual mode, customAmount is 0 and heads selected
      const isFeeHeadOnly = studentId && customAmount === 0 && selectedHeads && selectedHeads.length > 0;

      if (!targetInstallment && !isArrearsOnly && !isFeeHeadOnly) {
        results.push({
          studentId: student.id,
          studentName: `${student.fName} ${student.lName || ''}`,
          status: 'SKIPPED',
          reason: 'No matching installment found and not an ad-hoc challan',
        });
        continue;
      }

      // 3. Skip/Check logic
      if (!studentId && targetInstallment) {
        // In bulk mode, we only skip if there is NO remaining amount to bill for this month
        if (targetInstallment.remainingAmount <= 0) {
          results.push({
            studentId: student.id,
            studentName: `${student.fName} ${student.lName || ''}`,
            status: 'SKIPPED',
            reason: `Month ${month} is already fully billed or paid`,
          });
          continue;
        }
      }

      // 4. Calculate Arrears (Deep Tracking)
      let arrearsAmount = 0;
      let pastInstallmentsToBill: any[] = [];

      if (customArrearsAmount !== undefined) {
        arrearsAmount = customArrearsAmount;
        // FIFO Allocation of customArrearsAmount to past installments
        if (arrearsAmount > 0) {
          const pastUnbilled = await this.prisma.studentFeeInstallment.findMany({
            where: {
              studentId: student.id,
              classId: student.classId,
              dueDate: { lt: targetInstallment?.dueDate || new Date() },
              remainingAmount: { gt: 0 }
            },
            orderBy: { dueDate: 'asc' }
          });

          let remainingToAllocate = arrearsAmount;
          for (const pastInst of pastUnbilled) {
            if (remainingToAllocate <= 0) break;
            const canBill = Math.min(pastInst.remainingAmount, remainingToAllocate);
            pastInstallmentsToBill.push({ id: pastInst.id, amount: canBill });
            remainingToAllocate -= canBill;
          }
          // Note: If remainingToAllocate > 0, it means user entered more arrears than available in plan
          // We allow this (legacy ad-hoc debt), but it won't be tracked against installments.
        }
      } else {
        // Default bulk/individual mode: calculate all unpaid portions from past installments
        const pastUnbilled = await this.prisma.studentFeeInstallment.findMany({
          where: {
            studentId: student.id,
            classId: student.classId,
            dueDate: { lt: targetInstallment?.dueDate || new Date() },
            remainingAmount: { gt: 0 }
          },
          orderBy: { dueDate: 'asc' }
        });

        for (const pastInst of pastUnbilled) {
          arrearsAmount += pastInst.remainingAmount;
          pastInstallmentsToBill.push({ id: pastInst.id, amount: pastInst.remainingAmount });
        }
      }

      // 5. Tuition Billing Calculation (Current Month)
      let billingTuition = 0;
      let installmentId: number | null = null;

      if (targetInstallment) {
        installmentId = targetInstallment.id;

        if (studentId && customAmount !== undefined) {
          if (customAmount > targetInstallment.remainingAmount) {
            results.push({
              studentId: student.id,
              studentName: `${student.fName} ${student.lName || ''}`,
              status: 'FAILED',
              reason: `Custom amount ${customAmount} exceeds available remaining amount ${targetInstallment.remainingAmount}`,
            });
            continue;
          }
          billingTuition = customAmount;
        } else {
          // Bulk mode: bill full remaining portion
          billingTuition = targetInstallment.remainingAmount;
        }
      }

      // 6. Additional Fee Heads
      let additionalCharges = 0;
      let headSnapshot: any = null;
      if (studentId && selectedHeads && selectedHeads.length > 0) {
        const heads = await this.prisma.feeHead.findMany({
          where: { id: { in: selectedHeads } }
        });
        // Filter out discounts entirely as they are no longer supported
        const activeHeads = heads.filter(h => !h.isDiscount);
        additionalCharges = activeHeads.reduce((sum, h) => sum + h.amount, 0);

        headSnapshot = JSON.stringify(activeHeads.map(h => ({
          id: h.id, name: h.name, amount: h.amount,
          type: h.isTuition ? 'tuition' : 'additional',
          isSelected: true,
        })));
      }

      // 7. Final Totals
      // Total billable is strictly tuition + arrears + extra heads. No discounts.
      const totalAmount = billingTuition + arrearsAmount + additionalCharges;
      const challanDueDate = dueDate ? new Date(dueDate) : (targetInstallment?.dueDate || new Date());

      let challanType: any = 'INSTALLMENT';
      if (isArrearsOnly) challanType = 'ARREARS_ONLY';
      else if (isFeeHeadOnly) challanType = 'FEE_HEADS_ONLY';
      else if (studentId) challanType = 'MIXED';

      // 8. Create Challan
      const challan = await this.prisma.feeChallan.create({
        data: {
          studentId: student.id,
          amount: billingTuition + arrearsAmount, // Base billable (tuition + arrears)
          fineAmount: additionalCharges,
          discount: 0,
          dueDate: challanDueDate,
          status: 'PENDING',
          studentFeeInstallmentId: installmentId,
          installmentNumber: targetInstallment?.installmentNumber || 1,
          selectedHeads: headSnapshot,
          remarks: remarks || `Challan for ${month}`,
          challanNumber: await this.generateChallanNumber(),
          challanType,
          includesArrears: arrearsAmount > 0,
          arrearsAmount: arrearsAmount,
          studentClassId: student.classId,
          studentProgramId: student.programId,
          studentSectionId: student.sectionId,
        },
      });

      // 9. Update Installment Tracking (Current + Past Arrears)
      // Current Month
      if (targetInstallment && billingTuition > 0) {
        await this.prisma.studentFeeInstallment.update({
          where: { id: targetInstallment.id },
          data: {
            pendingAmount: { increment: billingTuition },
            remainingAmount: { decrement: billingTuition },
          }
        });
      }

      // Past Arrears (Deep Tracking)
      for (const pastInst of pastInstallmentsToBill) {
        await this.prisma.studentFeeInstallment.update({
          where: { id: pastInst.id },
          data: {
            pendingAmount: { increment: pastInst.amount },
            remainingAmount: { decrement: pastInst.amount },
          }
        });
      }

      results.push({
        studentId: student.id,
        studentName: `${student.fName} ${student.lName || ''}`,
        status: 'CREATED',
        challanId: challan.id,
        challanNumber: challan.challanNumber,
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
        },
      });

      if (!challan) throw new Error('Challan not found');

      const data: any = { ...payload };

      // Convert selectedHeads to JSON string
      if (payload.selectedHeads) {
        data.selectedHeads = JSON.stringify(payload.selectedHeads);
      }

      // 2. Handle Due Date Restriction (within installment month)
      if (payload.dueDate) {
        const newDate = new Date(payload.dueDate);
        const oldDate = new Date(challan.dueDate);
        if (newDate.getMonth() !== oldDate.getMonth() || newDate.getFullYear() !== oldDate.getFullYear()) {
          throw new Error('Due date must remain within the original installment month');
        }
        data.dueDate = newDate;
      }

      if (payload.paidDate) data.paidDate = new Date(payload.paidDate);

      if (payload.customArrearsAmount !== undefined) {
        data.arrearsAmount = payload.customArrearsAmount;
        data.includesArrears = payload.customArrearsAmount > 0;
        delete data.customArrearsAmount;
      }

      // 3. Handle Billing Amount Change (Tuition portion)
      // Tuition portion = challan.amount - challan.arrearsAmount
      const oldTuition = challan.amount - challan.arrearsAmount;
      if (payload.amount !== undefined && challan.studentFeeInstallmentId) {
        const newArrears = data.arrearsAmount !== undefined ? data.arrearsAmount : challan.arrearsAmount;
        const newTuition = payload.amount - newArrears;
        const diff = newTuition - oldTuition;

        if (diff !== 0) {
          const inst = await prisma.studentFeeInstallment.findUnique({
            where: { id: challan.studentFeeInstallmentId }
          });
          if (inst) {
            // If increasing tuition, check if enough is remaining
            if (diff > inst.remainingAmount) {
              throw new Error(`Insufficient remaining amount in installment. Available: ${inst.remainingAmount}`);
            }
            await prisma.studentFeeInstallment.update({
              where: { id: inst.id },
              data: {
                pendingAmount: { increment: diff },
                remainingAmount: { decrement: diff },
              }
            });
          }
        }
      }

      // 4. Handle Payment Recording
      if (payload.status === 'PAID' || payload.status === 'PARTIAL') {
        const instituteSettings = await prisma.instituteSettings.findFirst();
        const globalLateFee = instituteSettings?.lateFeeFine || 0;
        let dynamicLateFee = 0;
        if (challan.status === 'PENDING' && challan.dueDate && globalLateFee > 0) {
          const now = new Date();
          const dueDate = new Date(challan.dueDate);
          if (now > dueDate) {
            const diffDays = Math.floor(Math.abs(now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            dynamicLateFee = diffDays * globalLateFee;
          }
        }

        if (data.paidAmount === undefined) {
          data.paidAmount = (payload.amount || challan.amount) + (payload.fineAmount || challan.fineAmount) + dynamicLateFee;
        }

        const paymentIncrease = data.paidAmount - challan.paidAmount;
        if (paymentIncrease > 0) {
          // Allocation logic
          const currentTotal = (payload.amount || challan.amount);
          const currentFine = (payload.fineAmount !== undefined ? payload.fineAmount : challan.fineAmount);

          const netTuitionTotal = currentTotal;
          const tuitionDue = Math.max(0, netTuitionTotal - challan.tuitionPaid);
          const additionalDue = Math.max(0, currentFine - challan.additionalPaid);

          let remainingPayment = paymentIncrease;
          const tuitionPayment = Math.min(remainingPayment, tuitionDue);
          remainingPayment -= tuitionPayment;
          const additionalPayment = Math.min(remainingPayment, additionalDue);

          data.tuitionPaid = challan.tuitionPaid + tuitionPayment;
          data.additionalPaid = challan.additionalPaid + additionalPayment;

          // 5. Calculate covered installments (for string representation on challan)
          let installmentsCovered = 0;
          if (challan.feeStructure && challan.feeStructure.installments > 0) {
            const installmentAmount = challan.feeStructure.totalAmount / challan.feeStructure.installments;
            installmentsCovered = Math.round(tuitionPayment / installmentAmount);
          } else if (challan.installmentNumber > 0 && tuitionPayment > 0) {
            installmentsCovered = 1;
          }

          if (installmentsCovered > 0) {
            const startInst = challan.installmentNumber || 1;
            const endInst = startInst + installmentsCovered - 1;
            data.coveredInstallments = startInst === endInst ? `${startInst}` : `${startInst}-${endInst}`;
          }

          let remainingTuitionPayment = tuitionPayment;

          // 6. FIFO Allocation to Installments (Past Arrears First)
          if (remainingTuitionPayment > 0) {
            // A. Past Installments (FIFO)
            const pastInsts = await prisma.studentFeeInstallment.findMany({
              where: {
                studentId: challan.studentId,
                classId: challan.studentClassId || undefined,
                dueDate: { lt: challan.dueDate },
                pendingAmount: { gt: 0 }
              },
              orderBy: { dueDate: 'asc' }
            });

            for (const pastInst of pastInsts) {
              if (remainingTuitionPayment <= 0) break;
              const applyAmt = Math.min(pastInst.pendingAmount, remainingTuitionPayment);

              await prisma.studentFeeInstallment.update({
                where: { id: pastInst.id },
                data: {
                  paidAmount: { increment: applyAmt },
                  pendingAmount: { decrement: applyAmt },
                }
              });

              // Check if PAID
              const updatedInst = await prisma.studentFeeInstallment.findUnique({ where: { id: pastInst.id } });
              if (updatedInst && updatedInst.paidAmount >= updatedInst.amount) {
                await prisma.studentFeeInstallment.update({
                  where: { id: updatedInst.id },
                  data: { status: 'PAID' }
                });
              }
              remainingTuitionPayment -= applyAmt;
            }

            // B. Current Month Installment
            if (remainingTuitionPayment > 0 && challan.studentFeeInstallmentId) {
              await prisma.studentFeeInstallment.update({
                where: { id: challan.studentFeeInstallmentId },
                data: {
                  paidAmount: { increment: remainingTuitionPayment },
                  pendingAmount: { decrement: remainingTuitionPayment },
                }
              });

              const updatedInst = await prisma.studentFeeInstallment.findUnique({
                where: { id: challan.studentFeeInstallmentId }
              });
              if (updatedInst && updatedInst.paidAmount >= updatedInst.amount) {
                await prisma.studentFeeInstallment.update({
                  where: { id: updatedInst.id },
                  data: { status: 'PAID' }
                });
              }
            }
          }
        }
      }

      const updatedChallan = await prisma.feeChallan.update({
        where: { id },
        data,
        include: { student: true, feeStructure: true },
      });

      // 7. Update Legacy StudentArrear record if present
      if (updatedChallan.status === 'PAID' && updatedChallan.studentArrearId) {
        const arrear = await prisma.studentArrear.findUnique({
          where: { id: updatedChallan.studentArrearId },
        });

        if (arrear) {
          const newArrearAmount = Math.max(0, arrear.arrearAmount - updatedChallan.tuitionPaid);
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

      return updatedChallan;
    });
  }

  async deleteFeeChallan(id: number) {
    return await this.prisma.$transaction(async (prisma) => {
      const challan = await prisma.feeChallan.findUnique({ where: { id } });
      if (!challan) throw new Error('Challan not found');

      // Restore tuition portion to installment remaining
      if (challan.status !== 'PAID') {
        const totalTuitionToRestore = challan.amount - challan.tuitionPaid; // amount is (tuition + arrears)
        let remainingToRestore = totalTuitionToRestore;

        // 1. Current Month Installment
        if (challan.studentFeeInstallmentId) {
          const inst = await prisma.studentFeeInstallment.findUnique({ where: { id: challan.studentFeeInstallmentId } });
          if (inst && inst.pendingAmount > 0) {
            const restoreAmt = Math.min(inst.pendingAmount, remainingToRestore);
            await prisma.studentFeeInstallment.update({
              where: { id: inst.id },
              data: {
                pendingAmount: { decrement: restoreAmt },
                remainingAmount: { increment: restoreAmt },
              }
            });
            remainingToRestore -= restoreAmt;
          }
        }

        // 2. Deep Arrears Restoration (for past installments)
        if (remainingToRestore > 0) {
          const pastInsts = await prisma.studentFeeInstallment.findMany({
            where: {
              studentId: challan.studentId,
              classId: challan.studentClassId || undefined,
              dueDate: { lt: challan.dueDate },
              pendingAmount: { gt: 0 }
            },
            orderBy: { dueDate: 'desc' } // Restore most recent first
          });

          for (const pastInst of pastInsts) {
            if (remainingToRestore <= 0) break;
            const restoreAmt = Math.min(pastInst.pendingAmount, remainingToRestore);
            await prisma.studentFeeInstallment.update({
              where: { id: pastInst.id },
              data: {
                pendingAmount: { decrement: restoreAmt },
                remainingAmount: { increment: restoreAmt },
              }
            });
            remainingToRestore -= restoreAmt;
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
        student: true, // Need this for lateFeeFine
        feeStructure: {
          include: {
            program: true,
            class: true,
          },
        },
        studentClass: true, // Session snapshot
        studentProgram: true, // Session snapshot
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate dynamic late fees
    const instituteSettings = await this.prisma.instituteSettings.findFirst();
    const globalLateFee = instituteSettings?.lateFeeFine || 0;
    const now = new Date();
    history.forEach((challan: any) => {
      challan.lateFeeFine = 0;
      if (
        challan.status === 'PENDING' &&
        challan.dueDate &&
        globalLateFee > 0
      ) {
        const dueDate = new Date(challan.dueDate);
        if (now > dueDate) {
          const diffTime = Math.abs(now.getTime() - dueDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          challan.lateFeeFine = diffDays * globalLateFee;
        }
      }
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

    // Grouping logic for sessions (similar to the frontend processFeesData)
    const sessionMap = new Map();
    let totalAllSessionsPaid = 0;
    let totalAllSessionsDiscount = 0;
    let totalAllSessionsAdditional = 0;

    allChallans.forEach((c) => {
      totalAllSessionsPaid += c.paidAmount;
      totalAllSessionsAdditional += c.fineAmount;

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

    const sessions = Array.from(sessionMap.values()).map((session) => {
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
        (sum, c) => sum + (c.fineAmount || 0),
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

    // 1. Total Revenue (Paid Amount)
    const revenueAggr = await this.prisma.feeChallan.aggregate({
      where,
      _sum: {
        paidAmount: true,
      },
    });

    const totalRevenue = revenueAggr._sum.paidAmount || 0;

    // 2. Outstanding (Pending or Partial)
    // Outstanding depends on Due Date being within the range?
    // Or outstanding created within range?
    // Let's assume outstanding challans whose due date is within the range
    const outstandingAggr = await this.prisma.feeChallan.findMany({
      where: {
        status: { not: 'PAID' },
        dueDate: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        fineAmount: true,
        paidAmount: true,
        dueDate: true,
        student: {
          select: {
            lateFeeFine: true,
          } as any,
        },
      },
    });

    const now = new Date();
    const instituteSettings = await this.prisma.instituteSettings.findFirst();
    const globalLateFee = instituteSettings?.lateFeeFine || 0;

    const totalOutstanding = outstandingAggr.reduce((sum, c: any) => {
      let dynamicLateFee = 0;
      if (c.dueDate && globalLateFee > 0) {
        const dueDate = new Date(c.dueDate);
        if (now > dueDate) {
          const diffTime = Math.abs(now.getTime() - dueDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          dynamicLateFee = diffDays * globalLateFee;
        }
      }

      const netAmount =
        (c.amount || 0) +
        (c.fineAmount || 0) +
        dynamicLateFee;
      const remaining = netAmount - (c.paidAmount || 0);
      return sum + Math.max(0, remaining);
    }, 0);

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
    const instituteSettings = await this.prisma.instituteSettings.findFirst();
    const globalLateFee = instituteSettings?.lateFeeFine || 0;

    challans.forEach((c: any) => {
      // Determine class name from history (studentClassId) or nothing
      let className = 'Unknown Class';
      let dynamicLateFee = 0;

      // Calculate dynamic late fee for pending/overdue
      if (c.status === 'PENDING' && c.dueDate && globalLateFee > 0) {
        const dueDate = new Date(c.dueDate);
        if (now > dueDate) {
          const diffTime = Math.abs(now.getTime() - dueDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          dynamicLateFee = diffDays * globalLateFee;
        }
      }

      if (c.studentClass) {
        className = `${c.studentClass.name} - ${c.studentClass.program?.name || '-'} `;
      }

      if (!stats[className]) {
        stats[className] = { name: className, collected: 0, outstanding: 0 };
      }

      // Collection count
      if (
        c.status === 'PAID' &&
        c.paidDate &&
        new Date(c.paidDate) >= startDate
      ) {
        stats[className].collected += c.paidAmount || 0;
      }

      // Outstanding count
      if (c.status !== 'PAID' && new Date(c.dueDate) >= startDate) {
        const netAmount =
          (c.amount || 0) +
          (c.fineAmount || 0) +
          dynamicLateFee;

        stats[className].outstanding += Math.max(
          0,
          netAmount - (c.paidAmount || 0),
        );
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
      `🧹 Cleaning up challans for student ${studentId} in class $ { classId }(Demotion)`,
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
}
