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

  private calculateLateFee(dueDate: Date, dailyFine: number): number {
    if (!dueDate || !dailyFine || dailyFine <= 0) return 0;
    const now = new Date();
    const due = new Date(dueDate);
    if (now <= due) return 0;

    const diffTime = Math.abs(now.getTime() - due.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * dailyFine;
  }

  private async generateChallanNumber(): Promise<string> {
    // Generate a random unique 13-digit challan number
    for (let attempt = 0; attempt < 10; attempt++) {
      // First digit 1-9 to ensure exactly 13 digits, rest 0-9
      const first = Math.floor(Math.random() * 9) + 1;
      const rest = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
      const candidate = `${first}${rest}`;

      const existing = await this.prisma.feeChallan.findFirst({
        where: { challanNumber: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
    }
    // Fallback: timestamp-based to guarantee uniqueness
    return Date.now().toString().slice(-13).padStart(13, '0');
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
      challanType,
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

    const instituteSettings = await this.prisma.instituteSettings.findFirst();
    const globalLateFee = instituteSettings?.lateFeeFine || 0;

    const formattedData = data.map((challan: any) => {
      challan.lateFeeFine = 0;
      if (challan.status === 'PENDING' && challan.dueDate && globalLateFee > 0) {
        challan.lateFeeFine = this.calculateLateFee(challan.dueDate, globalLateFee);
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
    data.forEach((challan: any) => {
      challan.lateFeeFine = 0;
      if (
        challan.status === 'PENDING' &&
        challan.dueDate &&
        globalLateFee > 0
      ) {
        challan.lateFeeFine = this.calculateLateFee(challan.dueDate, globalLateFee);
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
          } as any,
          orderBy: { installmentNumber: 'asc' } as any,
        },
      },
    });
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
  }) {
    const { 
      month, studentId, studentIds, programId, classId, sectionId, 
      customAmount, selectedHeads, customArrearsAmount, arrearsLateFee, 
      selectedArrears, excludedArrearsStudentIds, remarks, dueDate 
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
      },
    });

    const results: any[] = [];

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

      // Primary match: month name + session (using program-aware gap)
      let targetInstallment: any = (student.feeInstallments as any[]).find((i) => {
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
        const sortedPastInsts = [...allInsts].sort((a,b) => this.getChronoRank(b) - this.getChronoRank(a));
        
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
          const existingChallan = await this.prisma.feeChallan.findFirst({
            where: {
              studentId: student.id,
              installmentNumber: inst.installmentNumber,
              month: inst.month,
              session: inst.session,
            }
          });

          if (!existingChallan) {
             const className = (inst.classId !== student.classId && inst.class?.name) ? `- ${inst.class.name}` : '';
             return `${inst.month || 'Previous Month'} ${inst.session || ''} ${className}`;
          }
        }
        return null;
      })();

      if (previousMissingChallan) {
        results.push({
          studentId: student.id,
          studentName: `${student.fName} ${student.lName || ''}`,
          status: 'PREVIOUS_UNGENERATED',
          reason: `Generate ${previousMissingChallan} challan first`,
        });
        continue;
      }

      const pastUnbilledCount = pastInstallments.filter(i => i.remainingAmount > 0).length;

      const hasArrears = pastUnbilledCount > 0 || (selectedArrears && selectedArrears.length > 0) || (customArrearsAmount ?? 0) > 0;
      const possessesHeads = (selectedHeads && selectedHeads.length > 0);
      const hasCustomTuition = customAmount !== undefined && customAmount > 0;

      const isExtraOnly = possessesHeads && customAmount === 0;
      const isArrearsOnly = hasArrears && !targetInstallment && !hasCustomTuition && !possessesHeads && !isExtraOnly;
      const isFeeHeadOnly = (possessesHeads && !targetInstallment && !hasCustomTuition && !hasArrears) || isExtraOnly;

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
      if (targetInstallment && targetInstallment.remainingAmount <= 0 && !hasCustomTuition) {
        canBillTuition = false;
      }
      
      // 3b. Existing Challan Logic (Replace if Pending, Block if Paid/Full)
      // HARD DUPLICATE BLOCK: enrollment + installment + class + section + session
      const existingChallans = await this.prisma.feeChallan.findMany({
        where: {
          studentId: student.id,
          installmentNumber: targetInstallment?.installmentNumber || 0,
          month: monthName,
          session: targetInstallment?.session || student.session,
          status: { not: 'VOID' }
        },
        include: { student: true }
      });

      const paidOrPartial = existingChallans.filter(c => c.status === 'PAID' || c.status === 'PARTIAL');
      // 3b. Existing Challan Logic (Strict Blocking)
      if (existingChallans.length > 0) {
        // User requested: "if same installment's challan exists, dont allow generating another one."
        // Admin must delete the old one first to re-generate.
        results.push({
          studentId: student.id,
          studentName: `${student.fName} ${student.lName || ''}`,
          status: 'SKIPPED',
          reason: `Month ${month} is already generated. Please delete the existing challan if you want to recreate it.`,
          challan: existingChallans[0]
        });
        continue;
      }

      // 4. Calculate Arrears (Deep Tracking)
      let arrearsAmount = 0;
      let calculatedArrearsLateFee = 0;
      let pastInstallmentsToBill: any[] = [];
      let coveredInstNumbers: number[] = [];
      let snapshotObjects: any[] = [];
      let sessionArrearIdToLink: number | null = null;
      let totalSessionArrears = 0;

      if (!isExtraOnly) {
        // ADDITION: Include Previous Session Arrears from StudentArrear table
        const sessionArrears = await this.prisma.studentArrear.findMany({
          where: { studentId: student.id, arrearAmount: { gt: 0 } },
          include: { class: true }
        });
        
        // FIXED: Use all installments to determine granular class coverage, even if they are currently pending/remaining=0.
        const granularClassIds = new Set((student.feeInstallments as any[]).map(i => i.classId));
        const filteredSessionArrears = sessionArrears.filter(a => !granularClassIds.has(a.classId));
        
        if (filteredSessionArrears.length > 0) {
          totalSessionArrears = filteredSessionArrears.reduce((sum, a) => sum + a.arrearAmount, 0);
          arrearsAmount += totalSessionArrears;
          // Link to the first one if multiple
          sessionArrearIdToLink = filteredSessionArrears[0].id;

          snapshotObjects.push({
            name: `Previous Session Arrears (${filteredSessionArrears.map(a => a.class.name).join(', ')})`,
            amount: totalSessionArrears,
            type: 'additional',
            isSelected: true,
            isSessionArrear: true
          });
        }
      }

      if (!isExtraOnly) {
        if (selectedArrears && selectedArrears.length > 0) {
          // Individual Mode: uses specific selections from UI
          for (const sel of selectedArrears) {
            arrearsAmount += sel.amount;
            calculatedArrearsLateFee += (sel.lateFee || 0);
            pastInstallmentsToBill.push({ id: sel.id, amount: sel.amount });
            
            const instObj = student.feeInstallments.find(i => i.id === sel.id);
            if (instObj) coveredInstNumbers.push(instObj.installmentNumber);
          }
        } else if (customArrearsAmount !== undefined) {
          // Individual Mode (Legacy/Fallback): uses FIFO
          arrearsAmount = customArrearsAmount;
          calculatedArrearsLateFee = arrearsLateFee || 0;
          if (arrearsAmount > 0) {
            const targetMonthStart = new Date(year, monthNum - 1, 1);
            const targetRank = this.getChronoRank(targetInstallment);
            const pastUnbilled = (student.feeInstallments as any[]).filter(i => 
              targetInstallment 
                ? this.getChronoRank(i) < targetRank
                : true // If no target installment, take all unbilled as potential arrears
            ).filter(i => (i.amount - (i.paidAmount || 0)) > 0).sort((a, b) => this.getChronoRank(a) - this.getChronoRank(b));

            let remainingToAllocate = arrearsAmount;
            for (const pastInst of pastUnbilled) {
              if (remainingToAllocate <= 0) break;
              const unpaidBal = (pastInst.amount - (pastInst.paidAmount || 0));
              const canBill = Math.min(unpaidBal, remainingToAllocate);
              pastInstallmentsToBill.push({ id: pastInst.id, amount: canBill });
              coveredInstNumbers.push(pastInst.installmentNumber);
              remainingToAllocate -= canBill;
            }
          }
        } else {
          // Bulk mode: calculate all unpaid portions from past installments + automatic late fees
          const isExcluded = (excludedArrearsStudentIds || []).includes(student.id);
          
          if (!isExcluded) {
            const targetRank = this.getChronoRank(targetInstallment);
            const pastUnbilled = (student.feeInstallments as any[]).filter(i => {
              if (!targetInstallment) return true;
              return this.getChronoRank(i) < targetRank;
            }).filter(i => (i.amount - (i.paidAmount || 0)) > 0).sort((a, b) => this.getChronoRank(a) - this.getChronoRank(b));

            const instituteSettings = await this.prisma.instituteSettings.findFirst();
            const globalFine = student.lateFeeFine || instituteSettings?.lateFeeFine || 0;

            for (const pastInst of pastUnbilled) {
              const unpaidBal = (pastInst.amount - (pastInst.paidAmount || 0));
              const instFine = globalFine > 0 ? this.calculateLateFee(pastInst.dueDate, globalFine) : 0;

              // FIX 1: Keep tuition arrears separate from late fees.
              // arrearsAmount tracks only unpaid tuition; late fees go into fineAmount via snapshotObjects.
              arrearsAmount += unpaidBal;
              calculatedArrearsLateFee += instFine;
              pastInstallmentsToBill.push({ id: pastInst.id, amount: unpaidBal, fine: instFine });
              coveredInstNumbers.push(pastInst.installmentNumber);
            }
          }
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
          // Bulk mode: bill full remaining portion
          billingTuition = targetInstallment.remainingAmount;
          // FIX 2: Set currentInstallmentPortion so the installment tracking block fires
          currentInstallmentPortion = billingTuition;
        }
        
        if (billingTuition > 0) {
          coveredInstNumbers.push(targetInstallment.installmentNumber);
        }
      }

      // 6. Additional Fee Heads
      let additionalCharges = 0;
      
      // Handle explicit additional heads (individual mode)
      if (studentId && selectedHeads && selectedHeads.length > 0) {
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

      // 7. Late Fee / Fine (Arrears Late Fee)
      const finalArrearsLateFee = studentId && arrearsLateFee !== undefined ? arrearsLateFee : calculatedArrearsLateFee;
      if (finalArrearsLateFee > 0) {
        snapshotObjects.push({
          name: 'Late Fee (Arrears)',
          amount: finalArrearsLateFee,
          type: 'additional',
          isSelected: true,
          isAdHoc: true
        });
      }
      
      // (Current Month's Fine Only - Arrears fine is already added to arrearsAmount above)
      const finalLateFee = studentId && arrearsLateFee !== undefined ? arrearsLateFee : 0; 
      // Note: Calculated arrears fine is already in arrearsAmount.
      // We only care about current installment fine if it's explicitly passed or if we want to auto-calc it for current.

      const headSnapshot = snapshotObjects.length > 0 ? JSON.stringify(snapshotObjects) : null;
      additionalCharges = snapshotObjects.reduce((sum, h) => sum + (h.amount || 0), 0);

      // 8. Final Totals & Dates
      const totalAmount = billingTuition + arrearsAmount + additionalCharges;
      
      // PRIORITIZE original installment due date if available, fallback to provided or current date
      let challanDueDate = targetInstallment?.dueDate 
        ? new Date(targetInstallment.dueDate) 
        : (dueDate ? new Date(dueDate) : new Date());

      if (totalAmount <= 0) {
        results.push({
          studentId: student.id,
          studentName: `${student.fName} ${student.lName || ''}`,
          status: 'SKIPPED',
          reason: targetInstallment && targetInstallment.remainingAmount <= 0 
            ? `Month ${month} tuition is already fully billed or paid` 
            : 'Total billing amount is 0',
          challan: null // FIX 6: existingChallans is always empty at this point (all non-empty cases continue'd above)
        });
        continue;
      }

      let challanType: any = 'INSTALLMENT';
      if (isArrearsOnly) challanType = 'ARREARS_ONLY';
      else if (isFeeHeadOnly) challanType = 'FEE_HEADS_ONLY';
      else if (studentId) challanType = 'MIXED';

      // 8. Create Challan
      const challan = await this.prisma.feeChallan.create({
        data: {
          studentId: student.id,
          amount: billingTuition + arrearsAmount, // Base billable (tuition + arrears)
          fineAmount: additionalCharges, // Contains both explicit heads and Arrears Late Fee
          discount: 0,
          dueDate: challanDueDate,
          status: 'PENDING',
          studentFeeInstallmentId: installmentId,
          installmentNumber: (isFeeHeadOnly || isArrearsOnly) ? 0 : (targetInstallment?.installmentNumber || 1),
          month: targetInstallment ? targetInstallment.month : monthName,
          session: targetInstallment ? targetInstallment.session : ((mNum >= 4) ? `${y}-${y + 1}` : `${y - 1}-${y}`),
          coveredInstallments: [...new Set(coveredInstNumbers)].sort((a,b) => a-b).join(','),
          selectedHeads: headSnapshot,
          remarks: remarks || `Challan for ${month}`,
          challanNumber: await this.generateChallanNumber(),
          challanType,
          arrearsAmount: arrearsAmount,
          studentClassId: targetInstallment?.classId || student.classId,
          studentProgramId: targetInstallment?.class?.programId || student.programId,
          studentSectionId: targetInstallment?.sectionId || student.sectionId,
          studentArrearId: sessionArrearIdToLink, // Link to session arrears record
        },
      });

      // 9. Update Installment Tracking (Current + Past Arrears)
      // Current Month
      if (targetInstallment && currentInstallmentPortion > 0) {
        const newPaid = targetInstallment.paidAmount;
        const newPending = targetInstallment.pendingAmount + currentInstallmentPortion;
        const newRemaining = Math.max(0, targetInstallment.amount - newPaid - newPending);
        
        await this.prisma.studentFeeInstallment.update({
          where: { id: targetInstallment.id },
          data: {
            pendingAmount: newPending,
            remainingAmount: newRemaining,
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
            await this.prisma.feeChallan.update({
              where: { id: epc.id },
              data: { 
                status: 'VOID',
                remarks: (epc.remarks ? `${epc.remarks}; ` : '') + `Superseded by Challan #${challan.challanNumber}`
              }
            });
          }

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
      
      // Allow general updates (remarks, heads, etc.) but block PAYMENT for superseded challans
      if (challan.status === 'VOID' && payload.status === 'PAID') {
        throw new BadRequestException('This challan has been superseded and cannot be marked as PAID.');
      }

      // 1a. Pre-calculate dynamic late fee for overdue challans
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

      const data: any = { ...payload };

      // STAMP the dynamic late fee into fineAmount for persistence
      if (dynamicLateFee > 0 && payload.fineAmount === undefined) {
        data.fineAmount = (challan.fineAmount || 0) + dynamicLateFee;
      }

      // Convert selectedHeads to JSON string
      if (payload.selectedHeads) {
        data.selectedHeads = JSON.stringify(payload.selectedHeads);
      }

      // 1b. Correct fineAmount to include manual heads, arrears late fee, and STAMP the current dynamic late fee
      const manualFine = payload.fineAmount !== undefined ? payload.fineAmount : (challan.fineAmount || 0);
      const arrearsLateFee = payload.arrearsLateFee || 0;
      data.fineAmount = (manualFine + arrearsLateFee + dynamicLateFee);

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
      const validFields = ['status', 'paidAmount', 'paidDate', 'selectedHeads', 'amount', 'dueDate', 'fineAmount', 'remarks', 'installmentNumber', 'arrearsAmount', 'includesArrears', 'coveredInstallments', 'paymentHistory', 'tuitionPaid', 'additionalPaid', 'discount', 'isLateFeeExempt', 'studentId', 'feeStructureId', 'remainingAmount'];
      Object.keys(data).forEach(key => {
        if (!validFields.includes(key)) delete data[key];
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

      if (payload.customArrearsAmount !== undefined) {
        data.arrearsAmount = payload.customArrearsAmount;
        data.includesArrears = payload.customArrearsAmount > 0;
        delete data.customArrearsAmount;
      }

      // 3. Handle Billing Amount Change (Tuition portion)
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
            if (diff > inst.remainingAmount) {
              throw new Error(`Insufficient remaining amount in installment. Available: ${inst.remainingAmount}`);
            }
            const newPending = inst.pendingAmount + diff;
            const newRemaining = Math.max(0, inst.amount - inst.paidAmount - newPending);
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

        if (data.paidAmount === undefined) {
          const arrearsLateFee = payload.arrearsLateFee || 0;
          data.paidAmount = (payload.amount || challan.amount) + (payload.fineAmount || challan.fineAmount) + dynamicLateFee + arrearsLateFee;
        }

        const paymentIncrease = data.paidAmount - challan.paidAmount;
        if (paymentIncrease > 0) {
          // 5. Calculate Allocation
          const discount = payload.discount !== undefined ? payload.discount : (challan.discount || 0);
          const currentTotal = (payload.amount || challan.amount);
          const currentFine = (payload.fineAmount !== undefined ? payload.fineAmount : (challan.fineAmount || 0));

          const netTuitionTotal = Math.max(0, currentTotal - discount);
          const tuitionDue = Math.max(0, netTuitionTotal - challan.tuitionPaid);
          const additionalDue = Math.max(0, currentFine - challan.additionalPaid);

          let remainingPayment = paymentIncrease;
          const tuitionPaymentSnapshot = Math.min(remainingPayment, tuitionDue);
          remainingPayment -= tuitionPaymentSnapshot;
          const additionalPayment = Math.min(remainingPayment, additionalDue);
          remainingPayment -= additionalPayment; // Leftover for FIFO arrears/excess

          data.tuitionPaid = challan.tuitionPaid + tuitionPaymentSnapshot;
          data.additionalPaid = challan.additionalPaid + additionalPayment;
          data.discount = discount;

          // Calculate covered installments string
          let installmentsCovered = 0;
          if (challan.feeStructure && challan.feeStructure.installments > 0) {
            const installmentAmount = (challan.feeStructure.totalAmount / challan.feeStructure.installments);
            if (installmentAmount > 0) {
               installmentsCovered = Math.round(tuitionPaymentSnapshot / installmentAmount);
            }
          } else if (challan.installmentNumber > 0 && tuitionPaymentSnapshot > 0) {
            installmentsCovered = 1;
          }

          if (installmentsCovered > 0) {
            const startInst = challan.installmentNumber || 1;
            const endInst = startInst + installmentsCovered - 1;
            data.coveredInstallments = startInst === endInst ? `${startInst}` : `${startInst}-${endInst}`;
          }

          let remainingTuitionAlloc = remainingPayment;

          // 5.5 Allocate to USER SELECTED arrears first
          if (remainingTuitionAlloc > 0 && payload.arrearsSelections && Array.isArray(payload.arrearsSelections)) {
            for (const selection of payload.arrearsSelections) {
              if (remainingTuitionAlloc <= 0) break;
              
              const inst = await prisma.studentFeeInstallment.findUnique({
                where: { id: selection.id }
              });

              if (inst && inst.remainingAmount > 0) {
                const applyAmt = Math.min(inst.remainingAmount, remainingTuitionAlloc, selection.amount);
                const newPaid = inst.paidAmount + applyAmt;
                const newRemaining = Math.max(0, inst.amount - newPaid - inst.pendingAmount);

                await prisma.studentFeeInstallment.update({
                  where: { id: inst.id },
                  data: {
                    paidAmount: newPaid,
                    remainingAmount: newRemaining,
                    status: newPaid >= inst.amount ? 'PAID' : 'PARTIAL'
                  }
                });
                
                // Update related challans for this installment
                await (this as any).settleRelatedChallans(prisma, challan.studentId, inst.id, applyAmt, [], challan.challanNumber);
                
                remainingTuitionAlloc -= applyAmt;
              }
            }
          }

          // Allocate to Session Arrears (Legacy/Manual)
          if (remainingTuitionAlloc > 0 && challan.studentArrearId) {
            const arrear = await prisma.studentArrear.findUnique({ where: { id: challan.studentArrearId } });
            if (arrear && arrear.arrearAmount > 0) {
              const applyAmt = Math.min(remainingTuitionAlloc, arrear.arrearAmount);
              await prisma.studentArrear.update({
                where: { id: arrear.id },
                data: { arrearAmount: Math.max(0, arrear.arrearAmount - applyAmt) }
              });
              remainingTuitionAlloc -= applyAmt;
            }
          }

          // 6. FIFO Allocation (Any REMAINING Past Arrears NOT explicitly selected)
          if (remainingTuitionAlloc > 0 || tuitionPaymentSnapshot > 0) {
            const allStudentInsts = await prisma.studentFeeInstallment.findMany({
              where: { studentId: challan.studentId },
              orderBy: { installmentNumber: 'asc' } // Placeholder, will sort in JS
            });

            const sortedInsts = allStudentInsts.sort((a, b) => this.getChronoRank(a) - this.getChronoRank(b));
            
            const currentInstRank = this.getChronoRank(challan.studentFeeInstallment || {
               installmentNumber: challan.installmentNumber,
               session: (challan.studentClass as any)?.session || (challan.student as any)?.session, // Fallback
               month: (challan.remarks?.match(/January|February|March|April|May|June|July|August|September|October|November|December/)?.[0])
            });

            // Past Arrears (FIFO)
            if (remainingTuitionAlloc > 0) {
              const pastInsts = sortedInsts.filter(i => this.getChronoRank(i) < currentInstRank && i.remainingAmount > 0);
              for (const pastInst of pastInsts) {
                if (remainingTuitionAlloc <= 0) break;
                
                // Find all related non-PAID challans for this past installment to know total needed (Tuition + Fines)
                const relatedRCs = await prisma.feeChallan.findMany({
                  where: { studentFeeInstallmentId: pastInst.id, status: { not: 'PAID' } }
                });
                const totalRelNeeded = relatedRCs.reduce((sum, r) => sum + (r.amount + r.fineAmount - r.discount - r.paidAmount), 0);
                
                // applyAmt can now cover both the installment tuition and its related challan fines
                const applyAmt = Math.min(totalRelNeeded > 0 ? totalRelNeeded : pastInst.remainingAmount, remainingTuitionAlloc);
                if (applyAmt <= 0) continue;

                const tuitionToApply = Math.min(pastInst.remainingAmount, applyAmt);
                const newPaid = pastInst.paidAmount + tuitionToApply;
                const newRemaining = Math.max(0, pastInst.amount - newPaid - pastInst.pendingAmount);

                await prisma.studentFeeInstallment.update({
                  where: { id: pastInst.id },
                  data: {
                    paidAmount: newPaid,
                    remainingAmount: newRemaining,
                    status: newPaid >= pastInst.amount ? 'PAID' : 'PARTIAL'
                  }
                });

                await (this as any).settleRelatedChallans(prisma, challan.studentId, pastInst.id, applyAmt, [], challan.challanNumber);
                remainingTuitionAlloc -= applyAmt;
                coveredNums.add(pastInst.installmentNumber);
              }
            }

            // 6.5 FIFO Allocation (Future Installments - Overpayment Credit)
            if (remainingTuitionAlloc > 0) {
              const futureInsts = sortedInsts.filter(i => this.getChronoRank(i) > currentInstRank && i.remainingAmount > 0);
              for (const futInst of futureInsts) {
                if (remainingTuitionAlloc <= 0) break;
                const applyAmt = Math.min(futInst.remainingAmount, remainingTuitionAlloc);
                const newPaid = futInst.paidAmount + applyAmt;
                const newRemaining = Math.max(0, futInst.amount - newPaid - futInst.pendingAmount);

                await prisma.studentFeeInstallment.update({
                  where: { id: futInst.id },
                  data: {
                    paidAmount: newPaid,
                    remainingAmount: newRemaining,
                    status: newPaid >= futInst.amount ? 'PAID' : 'PARTIAL'
                  }
                });

                await (this as any).settleRelatedChallans(prisma, challan.studentId, futInst.id, applyAmt, [], challan.challanNumber);
                remainingTuitionAlloc -= applyAmt;
                coveredNums.add(futInst.installmentNumber);
              }
            }
          }

          // Update coveredInstallments in the challan to reflect all settled debts
          if (coveredNums.size > 0) {
            const sorted = Array.from(coveredNums).sort((a, b) => a - b);
            data.coveredInstallments = sorted.length > 1 && (sorted[sorted.length - 1] - sorted[0] === sorted.length - 1)
              ? `${sorted[0]}-${sorted[sorted.length - 1]}`
              : sorted.join(',');
          }

          // 7. Update Current Month Installment (Linked to this challan)
          if (challan.studentFeeInstallmentId) {
            const inst = await prisma.studentFeeInstallment.findUnique({ where: { id: challan.studentFeeInstallmentId } });
            if (inst) {
              const discountDiff = (payload.discount !== undefined ? (payload.discount - (challan.discount || 0)) : 0);
              const totalApplied = tuitionPaymentSnapshot + discountDiff;
              const newPaid = inst.paidAmount + totalApplied;
              const newRemaining = Math.max(0, inst.amount - newPaid - inst.pendingAmount);
              
              await prisma.studentFeeInstallment.update({
                where: { id: inst.id },
                data: {
                  paidAmount: newPaid,
                  remainingAmount: newRemaining,
                  status: newPaid >= inst.amount ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'PENDING')
                }
              });

              // Current challan itself doesn't need settleRelatedChallans call because it is the one being updated
              // However, if there are OTHER challans for this same current installment (rare), they should be updated
              await (this as any).settleRelatedChallans(prisma, challan.studentId, inst.id, totalApplied, [id], challan.challanNumber);
            }
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

      // 7.6 Calculate remainingAmount for the challan
      const totalBillableForChallan = (payload.amount || challan.amount) + 
                                     (payload.fineAmount !== undefined ? payload.fineAmount : (challan.fineAmount || 0)) + 
                                     dynamicLateFee + 
                                     (payload.arrearsLateFee || 0);
      const totalPaidAndDiscount = (data.paidAmount ?? challan.paidAmount) + 
                                  (payload.discount !== undefined ? payload.discount : (challan.discount || 0));
      data.remainingAmount = Math.max(0, totalBillableForChallan - totalPaidAndDiscount);

      // Determine status based on payments
      if (challan.status === 'VOID') {
        data.status = 'VOID'; // Retain superseded state
      } else if (data.remainingAmount === 0 && totalPaidAndDiscount > 0) {
        data.status = 'PAID';
      } else if (data.remainingAmount > 0) {
        if (totalPaidAndDiscount > 0) {
          data.status = 'PARTIAL';
        } else {
          data.status = 'PENDING';
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

      // 8. Update Legacy StudentArrear record if present
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
      const challan = await prisma.feeChallan.findUnique({ 
        where: { id },
        include: { feeStructure: true }
      });
      if (!challan) throw new NotFoundException('Challan not found');

      // 1. Identify which portions to reverse
      // amount in challan is (Current Tuition + Arrears Tuition)
      // tuitionPaid is what was actually collected from that amount
      const tuitionPaidToReverse = challan.tuitionPaid || 0;
      const pendingTuitionToReverse = (challan.amount || 0) - tuitionPaidToReverse;

      // 2. Locate all linked installments
      const coveredNums = (challan.coveredInstallments || "")
        .split(',')
        .flatMap(s => s.includes('-') 
          ? (() => { const [start, end] = s.split('-').map(Number); return Array.from({length: end - start + 1}, (_, i) => start + i); })()
          : [Number(s)]
        )
        .filter(n => !isNaN(n) && n > 0);

      const targetInstallmentId = challan.studentFeeInstallmentId;

      // 3. Reverse on StudentFeeInstallment
      if (coveredNums.length > 0 || targetInstallmentId) {
        const installments = await prisma.studentFeeInstallment.findMany({
          where: {
            OR: [
              targetInstallmentId ? { id: targetInstallmentId } : null,
              coveredNums.length > 0 ? {
                studentId: challan.studentId,
                classId: challan.studentClassId || undefined,
                installmentNumber: { in: coveredNums },
              } : null
            ].filter(Boolean) as any
          }
        });

        let remainingPaidRev = tuitionPaidToReverse;
        let remainingPendingRev = pendingTuitionToReverse;

        // Reverse chronologically (restore most recent first)
        const sortedInsts = installments.sort((a,b) => this.getChronoRank(b) - this.getChronoRank(a));

        for (const inst of sortedInsts) {
          // Reverse Paid
          const revPaid = Math.min(inst.paidAmount, remainingPaidRev);
          remainingPaidRev -= revPaid;

          // Reverse Pending
          const revPending = Math.min(inst.pendingAmount, remainingPendingRev);
          remainingPendingRev -= revPending;

          if (revPaid > 0 || revPending > 0 || inst.id === targetInstallmentId) {
            const newPaid = Math.max(0, inst.paidAmount - revPaid);
            const newPending = Math.max(0, inst.pendingAmount - revPending);
            const newRemaining = Math.max(0, inst.amount - newPaid - newPending);

            await prisma.studentFeeInstallment.update({
              where: { id: inst.id },
              data: {
                paidAmount: newPaid,
                pendingAmount: newPending,
                remainingAmount: newRemaining,
                status: newPaid >= inst.amount ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'PENDING')
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
            data: { arrearAmount: arrear.arrearAmount + tuitionPaidToReverse }
          });
        } else {
          // Recreate if it was deleted (optional, but safer)
          // Find the last known session details from snapshots
          if (challan.studentClassId && challan.studentProgramId) {
             await prisma.studentArrear.create({
               data: {
                 studentId: challan.studentId,
                 classId: challan.studentClassId,
                 programId: challan.studentProgramId,
                 arrearAmount: tuitionPaidToReverse,
                 lastInstallmentNumber: 0 // Estimate
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

    history.forEach((challan: any) => {
      challan.lateFeeFine = 0;
      if (challan.status === 'PENDING' && challan.dueDate && globalLateFee > 0) {
        challan.lateFeeFine = this.calculateLateFee(challan.dueDate, globalLateFee);
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

    const instituteSettings = await this.prisma.instituteSettings.findFirst();
    const globalLateFee = instituteSettings?.lateFeeFine || 0;

    const sessionMap = new Map<string, any>();
    let totalAllSessionsPaid = 0;
    let totalAllSessionsAdditional = 0;

    allChallans.forEach((c: any) => {
      totalAllSessionsPaid += c.paidAmount;
      totalAllSessionsAdditional += c.fineAmount;

      // Calculate dynamic late fee for this challan if pending
      c.lateFeeFine = 0;
      if (c.status === 'PENDING' && c.dueDate && globalLateFee > 0) {
        c.lateFeeFine = this.calculateLateFee(c.dueDate, globalLateFee);
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
        dynamicLateFee = (this as any).calculateLateFee(c.dueDate, globalLateFee);
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
        dynamicLateFee = (this as any).calculateLateFee(c.dueDate, globalLateFee);
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
      `ðŸ§¹ Cleaning up challans for student ${studentId} in class $ { classId }(Demotion)`,
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

    console.log(`âœ… Deleted ${result.count} challans.`);
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
        status: { notIn: ['PAID', 'VOID'] },
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
        // Proportionally update tuitionPaid/additionalPaid
        const tuitionPortion = rc.amount - rc.discount;
        const additionalPortion = rc.fineAmount;
        
        const newTuitionPaid = Math.min(
          tuitionPortion,
          rc.tuitionPaid + rcApply,
        );
        const leftoverForAdditional = Math.max(
          0,
          rcApply - (newTuitionPaid - rc.tuitionPaid),
        );
        const newAdditionalPaid = Math.min(
          additionalPortion,
          rc.additionalPaid + leftoverForAdditional,
        );
        
        const currentRemarks = rc.remarks ? `${rc.remarks}; ` : '';
        const arrearsRemark = originChallanNumber ? `Settled in arrears via Challan #${originChallanNumber}` : '';
        
        await prisma.feeChallan.update({
          where: { id: rc.id },
          data: {
            paidAmount: rcNewPaid,
            tuitionPaid: newTuitionPaid,
            additionalPaid: newAdditionalPaid,
            remainingAmount: Math.max(0, rcTotal - rcNewPaid),
            status: rcNewPaid >= rcTotal ? 'PAID' : 'PARTIAL',
            remarks: arrearsRemark ? `${currentRemarks}${arrearsRemark}` : rc.remarks,
          },
        });
        remainingToSettle -= rcApply;
      }
    }
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
}
