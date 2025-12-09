import { Injectable, NotFoundException } from '@nestjs/common';
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
            create: heads.map(head => ({
              feeHeadId: head.id,
              amount: head.amount,
            })),
          },
        },
        include: {
          feeHeads: {
            include: {
              feeHead: true
            }
          },
          program: true,
          class: true
        }
      });
    }

    // Create structure without feeHeads
    return await this.prisma.feeStructure.create({
      data: rest,
      include: {
        feeHeads: {
          include: {
            feeHead: true
          }
        },
        program: true,
        class: true
      }
    });
  }

  async getFeeStructures() {
    return await this.prisma.feeStructure.findMany({
      include: {
        feeHeads: {
          include: {
            feeHead: true
          }
        },
        program: true,
        class: true
      }
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
            create: heads.map(head => ({
              feeHeadId: head.id,
              amount: head.amount,
            })),
          },
        },
        include: {
          feeHeads: {
            include: {
              feeHead: true
            }
          },
          program: true,
          class: true
        }
      });
    }

    // If no feeHeads provided, just update other fields
    return await this.prisma.feeStructure.update({
      where: { id },
      data: rest,
      include: {
        feeHeads: {
          include: {
            feeHead: true
          }
        },
        program: true,
        class: true
      }
    });
  }

  async deleteFeeStructure(id: number) {
    return await this.prisma.feeStructure.delete({
      where: { id },
    });
  }

  // Fee Challans
  async createFeeChallan(payload: CreateFeeChallanDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: payload.studentId },
      include: { class: true, program: true }
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    let feeStructureId = payload.feeStructureId;
    let amount = payload.amount;
    let installmentNumber = payload.installmentNumber || 1;
    let includesArrears = payload['includesArrears'] || false;
    let arrearsAmount = 0;
    let challanType: any = 'INSTALLMENT'; // Default
    let sessionClassId = student.classId; // Default to current class
    let sessionProgramId = student.programId; // Default to current program

    // If arrears should be included, calculate it
    if (includesArrears) {
      const arrearsData = await this.calculateStudentArrears(student.id);
      arrearsAmount = arrearsData.totalArrears;
    }

    // Auto-fetch fee structure if not provided
    if (!feeStructureId && student.programId && student.classId) {
      const structure = await this.prisma.feeStructure.findUnique({
        where: {
          programId_classId: {
            programId: student.programId,
            classId: student.classId
          }
        }
      });

      if (structure) {
        feeStructureId = structure.id;
        // If amount is not manually overridden, calculate based on installments
        if (amount === undefined || amount === null) {
          amount = structure.totalAmount / structure.installments;
        }

        // Calculate installment number only if tuition is being paid
        if (amount > 0) {
          const prevChallans = await this.prisma.feeChallan.count({
            where: {
              studentId: student.id,
              feeStructureId: structure.id,
              amount: { gt: 0 } // Only count challans that had tuition
            }
          });
          installmentNumber = prevChallans + 1;
        } else {
          installmentNumber = 0;
        }
      }
    }

    // Determine challan type
    const hasInstallmentAmount = amount && amount > 0;
    const hasFeeHeads = payload.selectedHeads && payload.selectedHeads.length > 0;
    const hasArrears = includesArrears && arrearsAmount > 0;

    if (hasArrears && !hasInstallmentAmount && !hasFeeHeads) {
      challanType = 'ARREARS_ONLY';

      // CRITICAL: For arrears-only payments, use the session from the OLDEST unpaid challan
      // This ensures arrears are stored against the original class/program
      const oldestUnpaidChallan = await this.prisma.feeChallan.findFirst({
        where: {
          studentId: student.id,
          status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] }
        },
        orderBy: { dueDate: 'asc' },
        select: { studentClassId: true, studentProgramId: true, feeStructureId: true }
      });

      if (oldestUnpaidChallan) {
        sessionClassId = oldestUnpaidChallan.studentClassId;
        sessionProgramId = oldestUnpaidChallan.studentProgramId;
        // Use the fee structure from the original session if not overridden
        if (!payload.feeStructureId) {
          feeStructureId = oldestUnpaidChallan.feeStructureId;
        }
      }
    } else if (!hasInstallmentAmount && hasFeeHeads) {
      challanType = 'FEE_HEADS_ONLY';
    } else if ((hasArrears && hasInstallmentAmount) || (hasArrears && hasFeeHeads) || (hasInstallmentAmount && hasFeeHeads)) {
      challanType = 'MIXED';
    } else if (hasInstallmentAmount) {
      challanType = 'INSTALLMENT';
    }

    return await this.prisma.feeChallan.create({
      data: {
        ...payload,
        selectedHeads: payload.selectedHeads ? JSON.stringify(payload.selectedHeads) : null,
        dueDate: new Date(payload.dueDate),
        amount, // Ensure amount is set
        feeStructureId,
        installmentNumber,
        fineAmount: payload.fineAmount || 0,
        challanNumber: `CH-${Date.now()}-${Math.floor(Math.random() * 10)}`,
        status: 'PENDING',
        // Arrears fields
        challanType,
        includesArrears,
        arrearsAmount,
        // Session Tracking: Use original session for arrears, current session otherwise
        studentClassId: sessionClassId,
        studentProgramId: sessionProgramId
      },
      include: {
        student: true,
        feeStructure: true,
        studentClass: true,
        studentProgram: true
      }
    });
  }

  async getFeeChallans(studentId?: number, search?: string) {
    const where: any = studentId ? { studentId } : {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        { student: { fName: { contains: search } } },
        { student: { mName: { contains: search } } },
        { student: { lName: { contains: search } } },
        { student: { rollNumber: { contains: search } } }
      ];
    }

    const take = search ? undefined : 10;

    return await this.prisma.feeChallan.findMany({
      where,
      take,
      include: {
        student: true,
        feeStructure: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async updateFeeChallan(id: number, payload: UpdateFeeChallanDto) {
    // Handle status change logic if needed (e.g. updating paidAmount)
    const data: any = { ...payload };

    // Convert selectedHeads to JSON string if present
    if (payload.selectedHeads) {
      data.selectedHeads = JSON.stringify(payload.selectedHeads);
    }

    // Convert dueDate if provided
    if (payload.dueDate) {
      data.dueDate = new Date(payload.dueDate);
    }

    // Convert paidDate if provided
    if (payload.paidDate) {
      data.paidDate = new Date(payload.paidDate);
    }

    if (payload.status === 'PAID' && !data.paidDate) {
      data.paidDate = new Date();
    }

    return await this.prisma.feeChallan.update({
      where: { id },
      data,
      include: {
        student: true,
        feeStructure: true
      }
    });
  }

  async deleteFeeChallan(id: number) {
    return await this.prisma.feeChallan.delete({
      where: { id },
    });
  }

  async getStudentFeeHistory(studentId: number) {
    return await this.prisma.feeChallan.findMany({
      where: { studentId },
      include: {
        feeStructure: {
          include: {
            program: true,
            class: true
          }
        },
        studentClass: true,    // Session snapshot
        studentProgram: true   // Session snapshot
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getStudentFeeSummary(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, program: true }
    });

    if (!student) throw new NotFoundException('Student not found');

    let feeStructure: any = null;
    if (student.programId && student.classId) {
      feeStructure = await this.prisma.feeStructure.findUnique({
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
    }

    const challans = feeStructure ? await this.prisma.feeChallan.findMany({
      where: {
        studentId,
        feeStructureId: feeStructure.id
      }
    }) : [];


    // Calculate tuition-only amount from fee structure
    let tuitionOnlyAmount = 0;
    if (feeStructure) {
      const tuitionHeads = feeStructure.feeHeads.filter(fh => fh.feeHead.isTuition);
      tuitionOnlyAmount = tuitionHeads.reduce((sum, fh) => sum + fh.amount, 0);
    }

    const totalPaid = challans.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalDiscount = challans.reduce((sum, c) => sum + c.discount, 0);

    // Calculate installments based on coveredInstallments ranges
    let paidInstallments = 0;
    challans.filter(c => c.status === 'PAID').forEach(c => {
      if (c.coveredInstallments) {
        // Parse range like "1-5" or single "3"
        const parts = c.coveredInstallments.split('-');
        if (parts.length === 2) {
          const start = parseInt(parts[0]);
          const end = parseInt(parts[1]);
          paidInstallments = Math.max(paidInstallments, end);
        } else {
          const installment = parseInt(parts[0]);
          paidInstallments = Math.max(paidInstallments, installment);
        }
      }
    });

    // Calculate additional charges paid with details
    const additionalChargesMap = new Map();

    for (const challan of challans.filter(c => c.status === 'PAID' && c.selectedHeads)) {
      try {
        const selectedHeadIds = JSON.parse(challan.selectedHeads!) || [];
        if (Array.isArray(selectedHeadIds) && selectedHeadIds.length > 0) {
          // Fetch the fee heads for this challan
          const heads = await this.prisma.feeHead.findMany({
            where: {
              id: { in: selectedHeadIds },
              isDiscount: false,
              isTuition: false
            }
          });

          heads.forEach(head => {
            const current = additionalChargesMap.get(head.name) || 0;
            additionalChargesMap.set(head.name, current + head.amount);
          });
        }
      } catch (e) {
        // Skip if JSON parse fails
      }
    }

    const additionalChargesPaid = Object.fromEntries(additionalChargesMap);

    // Calculate total additional charges paid (sum of fineAmount from all paid challans)
    const totalAdditionalChargesPaid = challans
      .filter(c => c.status === 'PAID')
      .reduce((sum, c) => sum + (c.fineAmount || 0), 0);

    // Calculate actual tuition paid: Total Paid - Additional Charges + Discounts
    // (Since Paid = Tuition + Additional - Discount  =>  Tuition = Paid - Additional + Discount)
    const tuitionPaid = totalPaid - totalAdditionalChargesPaid + totalDiscount;

    return {
      student,
      feeStructure,
      summary: {
        totalPaid, // Raw total cash paid
        tuitionPaid, // Actual tuition portion paid
        totalDiscount,
        paidInstallments,
        totalInstallments: feeStructure?.installments || 0,
        totalAmount: tuitionOnlyAmount || feeStructure?.totalAmount || 0,
        tuitionOnlyAmount,
        additionalChargesPaid, // Breakdown object
        totalAdditionalChargesPaid // Total sum
      }
    };
  }

  // Reports
  async getRevenueOverTime(period: 'month' | 'year' | 'overall') {
    const paidChallans = await this.prisma.feeChallan.findMany({
      where: { status: 'PAID' },
      select: { paidAmount: true, paidDate: true }
    });

    const groupedData = {};

    paidChallans.forEach(challan => {
      if (!challan.paidDate) return;

      const date = new Date(challan.paidDate);
      let key = '';

      if (period === 'month') {
        // Group by Month (e.g., "Jan 2024")
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else if (period === 'year') {
        // Group by Year (e.g., "2024")
        key = date.getFullYear().toString();
      } else {
        // Overall - maybe group by month for the last 12 months or just return total?
        // Let's default to monthly for overall trend
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }

      groupedData[key] = (groupedData[key] || 0) + (challan.paidAmount || 0);
    });

    // Convert to array format for Recharts
    return Object.entries(groupedData).map(([name, value]) => ({ name, value }));
  }

  async getClassCollectionStats() {
    // Get all classes
    const classes = await this.prisma.class.findMany({
      include: {
        students: {
          select: { id: true }
        }
      }
    });

    const stats: any = [];

    for (const cls of classes) {
      const studentIds = cls.students.map(s => s.id);

      // Get total expected revenue for this class (sum of fee structures)
      // This is complex because fee structures are per program/class.
      // Simpler approach: Sum of all challans for students in this class

      const challans = await this.prisma.feeChallan.findMany({
        where: { studentId: { in: studentIds } }
      });

      let collected = 0;
      let outstanding = 0;

      challans.forEach(c => {
        if (c.status === 'PAID') {
          collected += c.paidAmount || 0;
        } else {
          outstanding += c.amount + (c.fineAmount || 0) - (c.discount || 0);
        }
      });

      stats.push({
        name: cls.name,
        collected,
        outstanding
      });
    }

    return stats;
  }

  // Arrears Management
  async calculateStudentArrears(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, program: true }
    });

    if (!student) throw new NotFoundException('Student not found');

    // Get ALL challans (paid and unpaid) to analyze by session
    const allChallans = await this.prisma.feeChallan.findMany({
      where: { studentId },
      include: {
        feeStructure: true,
        studentClass: true,
        studentProgram: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group challans by session (class/program combination)
    const sessionMap = new Map<string, any>();

    for (const challan of allChallans) {
      const sessionKey = `${challan.studentProgramId || 'N/A'}-${challan.studentClassId || 'N/A'}`;

      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, {
          sessionKey,
          classId: challan.studentClassId,
          programId: challan.studentProgramId,
          className: challan.studentClass?.name || 'Unknown',
          programName: challan.studentProgram?.name || 'Unknown',
          feeStructure: challan.feeStructure,
          expectedTotal: challan.feeStructure?.totalAmount || 0,
          totalPaid: 0,
          challans: []
        });
      }

      const session = sessionMap.get(sessionKey);

      // Sum up all PAID amounts for this session
      if (challan.status === 'PAID') {
        session.totalPaid += (challan.paidAmount || 0);
      }

      // Track all challans for reference
      session.challans.push({
        id: challan.id,
        challanNumber: challan.challanNumber,
        amount: challan.amount,
        paidAmount: challan.paidAmount || 0,
        status: challan.status,
        dueDate: challan.dueDate,
        createdAt: challan.createdAt
      });
    }

    // Calculate arrears for each session
    const arrearsBySession: any[] = [];
    let totalArrears = 0;
    let totalArrearsCount = 0;

    for (const [sessionKey, session] of sessionMap.entries()) {
      // Skip current session (student's current class)
      const isCurrentSession = session.classId === student.classId && session.programId === student.programId;

      if (isCurrentSession) continue; // Don't count current session as arrears

      // Calculate shortfall: Expected - Paid
      const shortfall = session.expectedTotal - session.totalPaid;

      if (shortfall > 0) {
        totalArrears += shortfall;
        totalArrearsCount++;

        // Find oldest unpaid/pending challan for days overdue calculation
        const oldestPending = session.challans
          .filter(c => c.status !== 'PAID')
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

        const daysOverdue = oldestPending
          ? Math.max(0, Math.floor((new Date().getTime() - new Date(oldestPending.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
          : 0;

        arrearsBySession.push({
          sessionKey,
          className: session.className,
          programName: session.programName,
          expectedTotal: session.expectedTotal,
          totalPaid: session.totalPaid,
          totalArrears: shortfall,
          challans: session.challans.map(c => ({
            ...c,
            amountDue: c.amount - c.paidAmount,
            daysOverdue: Math.max(0, Math.floor((new Date().getTime() - new Date(c.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
          })),
          oldestDaysOverdue: daysOverdue
        });
      }
    }

    return {
      studentId,
      studentName: `${student.fName} ${student.mName || ''} ${student.lName || ''}`.trim(),
      rollNumber: student.rollNumber,
      currentClass: student.class?.name,
      currentProgram: student.program?.name,
      totalArrears,
      arrearsCount: totalArrearsCount,
      arrearsBySession: arrearsBySession.sort((a, b) => b.totalArrears - a.totalArrears), // Sort by highest arrears first
      calculatedAt: new Date()
    };
  }

  async getStudentArrears(studentId: number) {
    return await this.calculateStudentArrears(studentId);
  }
}
