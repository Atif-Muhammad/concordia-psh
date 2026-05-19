import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateFeeHeadDto } from './dtos/create-fee-head.dto';
import { UpdateFeeHeadDto } from './dtos/update-fee-head.dto';
import { ChallanService } from './challan.service';
import { CreateFeeStructureDto } from './dtos/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dtos/update-fee-structure.dto';

@Injectable()
export class FeeManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly challanService: ChallanService,
  ) { }

  // ─────────────────────────────────────────────────────────────────────────────
  // Fee Heads
  // ─────────────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────────────
  // Fee Structures
  // ─────────────────────────────────────────────────────────────────────────────

  async createFeeStructure(payload: CreateFeeStructureDto) {
    const { feeHeads, ...rest } = payload;

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
          feeHeads: { include: { feeHead: true } },
          program: true,
          class: true,
        },
      });
    }

    return await this.prisma.feeStructure.create({
      data: rest,
      include: {
        feeHeads: { include: { feeHead: true } },
        program: true,
        class: true,
      },
    });
  }

  async getFeeStructures() {
    return await this.prisma.feeStructure.findMany({
      include: {
        feeHeads: { include: { feeHead: true } },
        program: true,
        class: true,
      },
    });
  }

  async updateFeeStructure(id: number, payload: UpdateFeeStructureDto) {
    const { feeHeads, ...rest } = payload;

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
          feeHeads: { include: { feeHead: true } },
          program: true,
          class: true,
        },
      });
    }

    return await this.prisma.feeStructure.update({
      where: { id },
      data: rest,
      include: {
        feeHeads: { include: { feeHead: true } },
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Arrears (computed from FeeInstallment.pendingAmount)
  // ─────────────────────────────────────────────────────────────────────────────

  async getStudentArrears(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, program: true },
    });

    if (!student) throw new NotFoundException('Student not found');

    // Arrears are now computed from FeeInstallment.pendingAmount
    const pendingInstallments = await this.prisma.feeInstallment.findMany({
      where: {
        studentId,
        pendingAmount: { gt: 0 },
      },
      orderBy: [{ sessionId: 'asc' }, { installmentNumber: 'asc' }],
      include: { class: true },
    });

    const totalArrears = pendingInstallments.reduce(
      (sum, inst) => sum + Number(inst.pendingAmount),
      0,
    );

    return {
      studentId,
      studentName: `${student.fName} ${student.lName || ''}`.trim(),
      rollNumber: student.rollNumber,
      currentClass: student.class?.name,
      currentProgram: student.program?.name,
      totalArrears,
      arrearsCount: pendingInstallments.length,
      pendingInstallments: pendingInstallments.map((inst) => ({
        id: inst.id,
        installmentNumber: inst.installmentNumber,
        month: inst.month,
        basePayable: Number(inst.basePayable),
        pendingAmount: Number(inst.pendingAmount),
        paidAmount: Number(inst.paidAmount),
        dueDate: inst.dueDate,
        className: inst.class?.name,
        classId: inst.classId,
        sessionId: inst.sessionId,
      })),
      calculatedAt: new Date(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Challans (new feeChallanV2 model)
  // ─────────────────────────────────────────────────────────────────────────────

  async getFeeChallans(query: any) {
    const {
      studentId,
      search,
      status,
      sessionId,
      type,
    } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const where: any = {};


    if (studentId) {
      where.installment = { studentId: Number(studentId) };
    }

    if (status && status !== 'all') {
      const s = status.toUpperCase();
      if (s === 'OVERDUE') {
        where.status = 'OVERDUE';
      } else {
        where.status = s;
      }
    }

    if (sessionId) {
      where.installment = {
        ...(where.installment || {}),
        sessionId: Number(sessionId),
      };
    }

    if (query.month) {
      where.installment = {
        ...(where.installment || {}),
        month: query.month,
      };
    }

    if (query.year) {
      const yr = Number(query.year);
      where.installment = {
        ...(where.installment || {}),
        dueDate: {
          gte: new Date(yr, 0, 1),
          lt: new Date(yr + 1, 0, 1),
        },
      };
    }

    if (query.startDate || query.endDate) {
      where.generatedDate = {};
      if (query.startDate) where.generatedDate.gte = new Date(query.startDate);
      if (query.endDate) where.generatedDate.lte = new Date(query.endDate);
    }

    if (search) {
      const trimmed = search.trim();
      where.OR = [
        { challanNumber: { contains: trimmed } },
        { installment: { student: { fName: { contains: trimmed } } } },
        { installment: { student: { lName: { contains: trimmed } } } },
        { installment: { student: { rollNumber: { contains: trimmed } } } },
      ];
    }

    const total = await this.prisma.feeChallanV2.count({ where });
    const lastPage = Math.ceil(total / limit);

    const data = await this.prisma.feeChallanV2.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        installment: {
          include: {
            student: {
              select: {
                id: true,
                fName: true,
                lName: true,
                rollNumber: true,
                classId: true,
                programId: true,
                sectionId: true,
                fatherOrguardian: true,
                class: { select: { id: true, name: true } },
                program: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
                feeInstallments: {
                  include: {
                    session: { select: { id: true, name: true } },
                    challans: {
                      select: {
                        id: true,
                        challanNumber: true,
                        status: true,
                        amountReceived: true,
                        advanceAmount: true,
                        advanceFromChallanNo: true,
                      },
                    },
                  },
                  orderBy: [
                    { sessionId: 'asc' },
                    { installmentNumber: 'asc' },
                  ],
                },
              },
            },
            class: { select: { id: true, name: true } },
            session: { select: { id: true, name: true } },
            heads: true,
            
          },
        },
        payments: { orderBy: { paymentDate: 'desc' } },
        challanHeads: {
          include: { feeHead: true }
        }
      } as any,
      orderBy: { generatedDate: 'desc' },
    });

    // Sync late fees for all fetched challans' installments
    await Promise.all(
      data.map(async (c) => {
        if (c.installmentId) {
          await this.challanService.syncLateFee(c.installmentId);
        }
      })
    );

    // Re-fetch data after sync to ensure we return the latest stored state
    const refreshedData = await this.prisma.feeChallanV2.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        installment: {
          include: {
            student: {
              select: {
                id: true,
                fName: true,
                lName: true,
                rollNumber: true,
                classId: true,
                programId: true,
                sectionId: true,
                fatherOrguardian: true,
                feeInstallments: {
                  include: {
                    session: { select: { id: true, name: true } },
                    challans: {
                      select: {
                        id: true,
                        challanNumber: true,
                        status: true,
                        amountReceived: true,
                        advanceAmount: true,
                        advanceFromChallanNo: true,
                      },
                    },
                  },
                  orderBy: [
                    { sessionId: 'asc' },
                    { installmentNumber: 'asc' },
                  ],
                },
              },
            },
            class: { select: { id: true, name: true } },
            session: { select: { id: true, name: true } },
            heads: true,
          },
        },
        payments: { orderBy: { paymentDate: 'desc' } },
        challanHeads: {
          include: { feeHead: true }
        }
      } as any,
      orderBy: { generatedDate: 'desc' },
    });

    return {
      data: refreshedData,
      meta: { total, page, lastPage, limit },
    };
  }

  async getBulkChallans(query: any) {
    const { programId, classId, sectionId, sessionId, startDate, endDate } = query;
    const where: any = {};

    if (classId || sectionId || programId || sessionId) {
      where.installment = {};
      if (classId) where.installment.classId = Number(classId);
      if (sessionId) where.installment.sessionId = Number(sessionId);
      if (sectionId || programId) {
        where.installment.student = {};
        if (sectionId) where.installment.student.sectionId = Number(sectionId);
        if (programId) where.installment.student.programId = Number(programId);
      }
    }

    if (query.month) {
      where.installment = {
        ...(where.installment || {}),
        month: query.month,
      };
    }

    if (query.year) {
      const yr = Number(query.year);
      where.installment = {
        ...(where.installment || {}),
        dueDate: {
          gte: new Date(yr, 0, 1),
          lt: new Date(yr + 1, 0, 1),
        },
      };
    }

    if (startDate || endDate) {
      where.generatedDate = {};
      if (startDate) where.generatedDate.gte = new Date(startDate);
      if (endDate) where.generatedDate.lte = new Date(endDate);
    }

    return await this.prisma.feeChallanV2.findMany({
      where,
      include: {
        installment: {
          include: {
            student: {
              select: {
                id: true,
                fName: true,
                lName: true,
                rollNumber: true,
                classId: true,
                programId: true,
                sectionId: true,
                fatherOrguardian: true,
                class: { select: { id: true, name: true } },
                program: { select: { id: true, name: true } },
                section: { select: { id: true, name: true } },
              },
            },
            class: { select: { id: true, name: true } },
          },
        },
        payments: { orderBy: { paymentDate: 'desc' } },
        challanHeads: {
          include: { feeHead: true }
        }
      } as any,
      orderBy: [{ generatedDate: 'asc' }],
    });
  }

  async getInstallmentPlans(query: {
    studentId?: string;
    classId?: string;
    sectionId?: string;
    sessionId?: string;
    programId?: string;
  }) {
    const { studentId, classId, sectionId, sessionId, programId } = query;

    // Base filter: non-passed-out students
    const where: any = { passedOut: false };

    if (studentId) where.id = Number(studentId);

    // When classId or sessionId is provided, we must find students who have
    // fee_installment records for that class/session — NOT just students whose
    // current classId matches. This handles promoted students who still have
    // ungenerated installments from a previous class/session.
    if (classId || sessionId) {
      const instFilter: any = {};
      if (classId) instFilter.classId = Number(classId);
      if (sessionId) instFilter.sessionId = Number(sessionId);
      where.feeInstallments = { some: instFilter };

      // Still filter by program if provided (program is stable across classes)
      if (programId) where.programId = Number(programId);
    } else {
      // No class/session filter — use current student attributes
      if (programId) where.programId = Number(programId);
      if (sectionId) where.sectionId = Number(sectionId);
    }

    const students = await this.prisma.student.findMany({
      where,
      select: {
        id: true,
        fName: true,
        lName: true,
        rollNumber: true,
        classId: true,
        programId: true,
        fatherOrguardian: true,
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        feeInstallments: {
          select: {
            id: true,
            installmentNumber: true,
            basePayable: true,
            paidAmount: true,
            pendingAmount: true,
            totalAmount: true,
            arrears: true,
            lateFeeFine: true,
            absentiesFine: true,
            totalAbsenties: true,
            totalLeaves: true,
            status: true,
            dueDate: true,
            month: true,
            classId: true,
            sessionId: true,
            challanGenerated: true,
            class: { select: { id: true, name: true, year: true, semester: true } },
            challans: {
              select: {
                id: true,
                challanNumber: true,
                status: true,
                snapshotTotalDue: true,
                amountReceived: true,
                generatedDate: true,
              },
            },
          },
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    // Sync late fees for all fetched installments
    const allInstIds = students.flatMap(s => s.feeInstallments.map(i => i.id));
    if (allInstIds.length > 0) {
      await Promise.all(allInstIds.map(id => this.challanService.syncLateFee(id)));
    }

    // Re-fetch to return latest state
    const refreshedStudents = await this.prisma.student.findMany({
      where,
      select: {
        id: true,
        fName: true,
        lName: true,
        rollNumber: true,
        classId: true,
        programId: true,
        fatherOrguardian: true,
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        feeInstallments: {
          select: {
            id: true,
            installmentNumber: true,
            basePayable: true,
            paidAmount: true,
            pendingAmount: true,
            totalAmount: true,
            arrears: true,
            lateFeeFine: true,
            absentiesFine: true,
            totalAbsenties: true,
            totalLeaves: true,
            status: true,
            dueDate: true,
            month: true,
            classId: true,
            sessionId: true,
            challanGenerated: true,
            class: { select: { id: true, name: true, year: true, semester: true } },
            challans: {
              select: {
                id: true,
                challanNumber: true,
                status: true,
                snapshotTotalDue: true,
                amountReceived: true,
                generatedDate: true,
              },
            },
          },
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    // Enrich with FeeStructure context and calculate on-the-fly arrears
    const studentsWithStructure = await Promise.all(
      refreshedStudents.map(async (student) => {
        let feeStructure: any = null;
        if (student.programId && student.classId) {
          feeStructure = await this.prisma.feeStructure.findUnique({
            where: {
              programId_classId: {
                programId: student.programId,
                classId: student.classId,
              },
            },
            include: {
              feeHeads: { include: { feeHead: true } },
            },
          });
        }

        // Step 3: Calculate on-the-fly arrears for each installment based on predecessors
        // This ensures the UI displays the arrears that WILL be applied during generation.
        const insts = student.feeInstallments.sort((a, b) => a.installmentNumber - b.installmentNumber);
        const processedInstallments = insts.map((inst, idx) => {
          const prior = insts.slice(0, idx);
          // Arrears = sum of pendingAmount of all prior active/overdue installments
          const computedArrears = prior
            .filter(p => !['SUPERSEDED', 'VOID', 'SETTLED'].includes(p.status as string) && Number(p.pendingAmount) > 0)
            .reduce((sum, p) => sum + Number(p.pendingAmount), 0);

          return {
            ...inst,
            // Prioritize already persisted arrears (if any), otherwise use computed
            arrears: (inst.arrears != null && Number(inst.arrears) > 0) ? inst.arrears : computedArrears
          };
        });

        return { ...student, feeInstallments: processedInstallments, feeStructure };
      }),
    );

    return studentsWithStructure;
  }

  async deleteFeeChallan(id: number) {
    return await this.challanService.deleteChallan(id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Student Fee History & Summary (using new models)
  // ─────────────────────────────────────────────────────────────────────────────

  async getStudentFeeHistory(studentId: number, type?: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });

    if (!student) throw new NotFoundException('Student not found');

    if (type === 'EXTRA') {
      return await this.prisma.extraChallan.findMany({
        where: { studentId },
        include: {
          heads: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
        orderBy: { generatedAt: 'desc' },
      });
    }

    if (type === 'HOSTEL') {
      return await this.prisma.hostelChallan.findMany({
        where: { studentId },
        include: {
          heads: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
        orderBy: { generatedAt: 'desc' },
      });
    }

    // Default: INSTALLMENT type (from main history)
    const where: any = {
      installment: { studentId },
    };

    const challans = await this.prisma.feeChallanV2.findMany({
      where,
      include: {
        installment: {
          select: {
            id: true,
            installmentNumber: true,
            month: true,
            dueDate: true,
            basePayable: true,
            totalAmount: true,
            paidAmount: true,
            pendingAmount: true,
            arrears: true,
            arrearsMonths: true,
            arrearsInstallments: true,
            lateFeeFine: true,
            extraFine: true,
            discount: true,
            absentiesFine: true,
            totalAbsenties: true,
            totalLeaves: true,
            advancePaid: true,
            status: true,
            sessionId: true,
            classId: true,
            session: {
              select: {
                id: true,
                name: true,
              },
            },
            heads: {
              select: {
                id: true,
                feeHeadId: true,
                headName: true,
                amount: true,
                discountAmount: true,
              },
            },
            class: {
              include: {
                program: true,
              },
            },
            student: {
              select: {
                id: true,
                feeInstallments: {
                  orderBy: [{ sessionId: 'asc' }, { installmentNumber: 'asc' }],
                  select: {
                    id: true,
                    installmentNumber: true,
                    month: true,
                    sessionId: true,
                    dueDate: true,
                    totalAmount: true,
                    paidAmount: true,
                    pendingAmount: true,
                    arrears: true,
                    lateFeeFine: true,
                    extraFine: true,
                    discount: true,
                    absentiesFine: true,
                    totalAbsenties: true,
                    totalLeaves: true,
                    advancePaid: true,
                    challans: {
                      orderBy: { generatedDate: 'desc' },
                      select: {
                        id: true,
                        challanNumber: true,
                        status: true,
                        amountReceived: true,
                        paidAt: true,
                        generatedDate: true,
                        snapshotTotalDue: true,
                        advanceAmount: true,
                        advanceFromChallanNo: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        challanHeads: {
          select: {
            id: true,
            feeHeadId: true,
            headName: true,
            amount: true,
          },
        },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { generatedDate: 'desc' },
    });

    return challans;
  }

  async getStudentFeeSummary(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, program: true },
    });

    if (!student) throw new NotFoundException('Student not found');

    const installments = await this.prisma.feeInstallment.findMany({
      where: { studentId },
      orderBy: [{ sessionId: 'asc' }, { installmentNumber: 'asc' }],
    });

    // Sync late fees for all installments
    await Promise.all(
      installments.map(async (inst) => {
        await this.challanService.syncLateFee(inst.id);
      })
    );

    // Re-fetch installments after sync
    const refreshedInstallments = await this.prisma.feeInstallment.findMany({
      where: { studentId },
      orderBy: [{ sessionId: 'asc' }, { installmentNumber: 'asc' }],
      include: {
        challans: {
          select: {
            id: true,
            challanNumber: true,
            status: true,
            snapshotTotalDue: true,
            snapshotBaseAmount: true,
            amountReceived: true,
            generatedDate: true,
            paidAt: true,
          },
        },
      },
    });

    const totalPaid = refreshedInstallments.reduce(
      (sum, inst) => {
        // Use the latest non-void challan's amountReceived if it exists, else installment's paidAmount
        const latestChallan = inst.challans.filter(c => c.status !== 'VOID').sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime())[0];
        return sum + Number(latestChallan?.amountReceived ?? inst.paidAmount);
      },
      0,
    );
    const totalPending = refreshedInstallments.reduce(
      (sum, inst) => {
        const latestChallan = inst.challans.filter(c => c.status !== 'VOID').sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime())[0];
        return sum + Number(latestChallan?.snapshotTotalDue ?? inst.pendingAmount);
      },
      0,
    );
    const totalBase = refreshedInstallments.reduce(
      (sum, inst) => {
        const latestChallan = inst.challans.filter(c => c.status !== 'VOID').sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime())[0];
        return sum + Number(latestChallan?.snapshotBaseAmount ?? inst.basePayable);
      },
      0,
    );

    const paidInstallments = refreshedInstallments.filter(
      (inst) => inst.status === 'PAID',
    ).length;

    return {
      student,
      installments: refreshedInstallments,
      summary: {
        totalAmount: totalBase,
        totalPaid,
        totalPending,
        paidInstallments,
        totalInstallments: refreshedInstallments.length,
        pendingInstallments: refreshedInstallments.length - paidInstallments,
        overall: {
          totalPaid,
          totalPending,
        },
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Reports (using new FeeInstallment + ChallanPayment models)
  // ─────────────────────────────────────────────────────────────────────────────

  async getRevenueOverTime(
    period: 'daily' | 'weekly' | 'month' | 'year' | 'overall',
  ) {
    const startDate = this.getDateRange(period);

    const payments = await this.prisma.challanPayment.findMany({
      where: {
        paymentDate: { gte: startDate },
      },
      select: { amount: true, paymentDate: true },
      orderBy: { paymentDate: 'asc' },
    });

    const groupedData: Record<string, number> = {};

    payments.forEach((p) => {
      const date = new Date(p.paymentDate);
      let key = '';

      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil(
          ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
        );
        key = `Week ${weekNo}, ${date.getFullYear()}`;
      } else if (period === 'month') {
        key = date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
      } else if (period === 'year') {
        key = date.getFullYear().toString();
      } else {
        key = date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
      }

      groupedData[key] = (groupedData[key] || 0) + Number(p.amount);
    });

    const chartData = Object.entries(groupedData).map(([name, value]) => ({
      name,
      value,
    }));

    if (period === 'daily') {
      chartData.sort(
        (a, b) => new Date(a.name).getTime() - new Date(b.name).getTime(),
      );
    } else if (period === 'month') {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
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

  private getDateRange(period: string): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    if (period === 'daily') {
      date.setDate(date.getDate() - 30);
    } else if (period === 'weekly') {
      date.setDate(date.getDate() - 12 * 7);
    } else if (period === 'month') {
      date.setMonth(date.getMonth() - 12);
    } else if (period === 'year') {
      date.setFullYear(date.getFullYear() - 5);
    } else {
      date.setFullYear(2000);
    }

    return date;
  }

  async getFeeCollectionSummary(
    period: 'daily' | 'weekly' | 'month' | 'year' | 'overall' = 'month',
    sessionId?: number,
  ) {
    const startDate = this.getDateRange(period);

    const sessionFilter: any = sessionId ? { sessionId } : {};

    const regularRevenueAggr = await this.prisma.feeInstallment.aggregate({
      where: {
        ...sessionFilter,
        settled: null, // Only directly-paid installments — SETTLED ones are already counted in the leading installment
      },
      _sum: { paidAmount: true },
    });

    // Extra: sum of paidAmount from ExtraChallan
    const extraRevenueAggr = await this.prisma.extraChallan.aggregate({
      where: {
        paidAmount: { gt: 0 }
      },
      _sum: { paidAmount: true }
    });

    // Hostel: sum of paidAmount from HostelChallan
    const hostelRevenueAggr = await this.prisma.hostelChallan.aggregate({
      where: {
        paidAmount: { gt: 0 }
      },
      _sum: { paidAmount: true }
    });

    // Outstanding: sum of pendingAmount only for installments that have a challan generated,
    // are still pending, and are NOT superseded or settled
    const outstandingAggr = await this.prisma.feeInstallment.aggregate({
      where: {
        ...sessionFilter,
        challanGenerated: true,
        pendingAmount: { gt: 0 },
        status: { notIn: ['SUPERSEDED', 'VOID', 'SETTLED'] },
      },
      _sum: { pendingAmount: true },
    });

    // Recent payments in period
    const recentPayments = await this.prisma.challanPayment.aggregate({
      where: {
        paymentDate: { gte: startDate },
        ...(sessionId
          ? { challan: { installment: { sessionId } } }
          : {}),
      },
      _sum: { amount: true },
    });

    const regularRevenue = Number(regularRevenueAggr._sum?.paidAmount ?? 0);
    const extraRevenue = Number(extraRevenueAggr._sum?.paidAmount ?? 0);
    const hostelRevenue = Number(hostelRevenueAggr._sum?.paidAmount ?? 0);

    return {
      totalRevenue: regularRevenue + extraRevenue + hostelRevenue,
      regularRevenue,
      extraRevenue,
      hostelRevenue,
      totalOutstanding: Number(outstandingAggr._sum?.pendingAmount ?? 0),
      recentRevenue: Number(recentPayments._sum?.amount ?? 0),
    };
  }

  async getClassCollectionStats(
    period: 'daily' | 'weekly' | 'month' | 'year' | 'overall' = 'month',
  ) {
    // Paid: only directly-paid installments (settled=null) to avoid double-counting SETTLED ones
    const paidInstallments = await this.prisma.feeInstallment.findMany({
      where: {
        settled: null,
      },
      select: {
        classId: true,
        paidAmount: true,
        class: { select: { id: true, name: true } },
      },
    });

    // Outstanding: only installments with challan generated, still pending, and not superseded or settled
    const outstandingInstallments = await this.prisma.feeInstallment.findMany({
      where: {
        challanGenerated: true,
        pendingAmount: { gt: 0 },
        status: { notIn: ['SUPERSEDED', 'VOID', 'SETTLED'] },
      },
      select: {
        classId: true,
        pendingAmount: true,
      },
    });

    const stats: Record<
      number,
      { classId: number; className: string; collected: number; outstanding: number }
    > = {};

    for (const inst of paidInstallments) {
      const cid = inst.classId;
      if (!stats[cid]) {
        stats[cid] = {
          classId: cid,
          className: inst.class?.name ?? `Class ${cid}`,
          collected: 0,
          outstanding: 0,
        };
      }
      stats[cid].collected += Number(inst.paidAmount);
    }

    for (const inst of outstandingInstallments) {
      const cid = inst.classId;
      if (!stats[cid]) {
        stats[cid] = { classId: cid, className: `Class ${cid}`, collected: 0, outstanding: 0 };
      }
      stats[cid].outstanding += Number(inst.pendingAmount);
    }

    return Object.values(stats);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Demotion helper
  // ─────────────────────────────────────────────────────────────────────────────

  async removeChallansForDemotion(studentId: number, classId: number) {
    if (!studentId || !classId) return;

    // Delete feeChallanV2 records for the class being left
    await this.prisma.feeChallanV2.deleteMany({
      where: {
        installment: {
          studentId,
          classId,
        },
        status: { not: 'PAID' },
      },
    });

    // Reset challanGenerated flag on affected installments
    await this.prisma.feeInstallment.updateMany({
      where: {
        studentId,
        classId,
        challanGenerated: true,
        status: { not: 'PAID' },
      },
      data: { challanGenerated: false },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Fee Challan Templates
  // ─────────────────────────────────────────────────────────────────────────────

  async createFeeChallanTemplate(payload: any) {
    const { name, htmlContent, isDefault, type } = payload;
    const hasTypeColumn = await this.hasFeeTemplateTypeColumn();

    if (isDefault) {
      await this.prisma.feeChallanTemplate.updateMany({
        where: hasTypeColumn
          ? { isDefault: true, type: type || 'INSTALLMENT' }
          : { isDefault: true },
        data: { isDefault: false },
      });
    }

    const createData: any = {
      name,
      htmlContent,
      isDefault: isDefault || false,
    };
    if (hasTypeColumn) {
      createData.type = type || 'INSTALLMENT';
    }

    return await this.prisma.feeChallanTemplate.create({
      data: createData,
    });
  }

  async getFeeChallanTemplates() {
    const hasTypeColumn = await this.hasFeeTemplateTypeColumn();
    return await this.prisma.feeChallanTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      select: hasTypeColumn
        ? {
          id: true,
          name: true,
          htmlContent: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
          type: true,
        }
        : {
          id: true,
          name: true,
          htmlContent: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
    });
  }

  async getFeeChallanTemplateById(id: number) {
    const hasTypeColumn = await this.hasFeeTemplateTypeColumn();
    const template = await this.prisma.feeChallanTemplate.findFirst({
      where: { id },
      select: hasTypeColumn
        ? {
          id: true,
          name: true,
          htmlContent: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
          type: true,
        }
        : {
          id: true,
          name: true,
          htmlContent: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
    });

    if (!template) {
      throw new NotFoundException(`FeeChallanTemplate with id ${id} not found`);
    }

    return hasTypeColumn ? template : { ...template, type: 'INSTALLMENT' };
  }

  async updateFeeChallanTemplate(id: number, payload: any) {
    const hasTypeColumn = await this.hasFeeTemplateTypeColumn();
    const template = await this.getFeeChallanTemplateById(id);

    if (!template) {
      throw new NotFoundException(`FeeChallanTemplate with id ${id} not found`);
    }

    const { name, htmlContent, isDefault, type } = payload;
    const currentType =
      typeof (template as any).type === 'string'
        ? (template as any).type
        : 'INSTALLMENT';
    const effectiveType = type || currentType;

    if (isDefault && (!template.isDefault || (type && type !== currentType))) {
      await this.prisma.feeChallanTemplate.updateMany({
        where: hasTypeColumn
          ? { isDefault: true, type: effectiveType }
          : { isDefault: true },
        data: { isDefault: false },
      });
    }

    const updateData: any = {
      name: name !== undefined ? name : template.name,
      htmlContent: htmlContent !== undefined ? htmlContent : template.htmlContent,
      isDefault: isDefault !== undefined ? isDefault : template.isDefault,
    };
    if (hasTypeColumn) {
      updateData.type = effectiveType;
    }

    return await this.prisma.feeChallanTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteFeeChallanTemplate(id: number) {
    const template = await this.prisma.feeChallanTemplate.findFirst({
      where: { id },
      select: { id: true },
    });

    if (!template) {
      throw new NotFoundException(`FeeChallanTemplate with id ${id} not found`);
    }

    return await this.prisma.feeChallanTemplate.delete({ where: { id } });
  }

  async getDefaultTemplate() {
    const hasTypeColumn = await this.hasFeeTemplateTypeColumn();
    const template = await this.prisma.feeChallanTemplate.findFirst({
      where: { isDefault: true },
      select: hasTypeColumn
        ? {
          id: true,
          name: true,
          htmlContent: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
          type: true,
        }
        : {
          id: true,
          name: true,
          htmlContent: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
    });
    if (!template) return null;
    return hasTypeColumn ? template : { ...template, type: 'INSTALLMENT' };
  }

  private async hasFeeTemplateTypeColumn(): Promise<boolean> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ COLUMN_NAME: string }>>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'feechallantemplate'
         AND COLUMN_NAME = 'type'`,
    );
    return rows.length > 0;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utility method to fix duplicate challans (cleanup existing inconsistent data)
  // ─────────────────────────────────────────────────────────────────────────────

  async findDuplicateChallans() {
    // Find installments that have multiple active challans
    const duplicates = await this.prisma.$queryRaw`
      SELECT 
        installmentId,
        COUNT(*) as challanCount,
        GROUP_CONCAT(id) as challanIds,
        GROUP_CONCAT(challanNumber) as challanNumbers,
        GROUP_CONCAT(status) as statuses
      FROM fee_challan_v2 
      WHERE installmentId IS NOT NULL 
        AND status NOT IN ('VOID')
      GROUP BY installmentId 
      HAVING COUNT(*) > 1
    `;

    return duplicates;
  }

  async fixDuplicateChallans(installmentId: number, keepChallanId: number) {
    return await this.prisma.$transaction(async (tx) => {
      // Get all challans for this installment
      const challans = await tx.feeChallanV2.findMany({
        where: {
          installmentId,
          status: { notIn: ['VOID'] },
        },
        orderBy: { generatedDate: 'asc' },
      });

      if (challans.length <= 1) {
        return { message: 'No duplicates found for this installment' };
      }

      // Void all challans except the one to keep
      const challansToVoid = challans.filter(c => c.id !== keepChallanId);

      for (const challan of challansToVoid) {
        await tx.feeChallanV2.update({
          where: { id: challan.id },
          data: { status: 'VOID' },
        });
      }

      // Ensure the installment's challanGenerated flag is consistent
      const keepChallan = challans.find(c => c.id === keepChallanId);
      if (keepChallan) {
        await tx.feeInstallment.update({
          where: { id: installmentId },
          data: { challanGenerated: true },
        });
      }

      return {
        message: `Fixed duplicates for installment ${installmentId}`,
        voidedChallans: challansToVoid.map(c => c.challanNumber),
        keptChallan: keepChallan?.challanNumber,
      };
    });
  }

  async updateFeeChallan(id: number, payload: any) {
    return await this.challanService.updateChallan(id, payload);
  }
}
