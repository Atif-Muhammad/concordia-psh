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

  private generateNumericChallanNumber(): string {
    // Generate a 12-digit numeric string
    // Format: Timestamp (last 10 digits) + 2 random digits
    const timestamp = Date.now().toString();
    const last10 = timestamp.slice(-10);
    const random2 = Math.floor(Math.random() * 90 + 10).toString(); // 10-99
    return last10 + random2;
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
          const agreedTuitionTotal = (student as any).tuitionFee || structure.totalAmount;
          const standardTuitionTotal = structure.totalAmount;
          const standardInstallmentAmount = Math.round(standardTuitionTotal / structure.installments);
          const agreedInstallmentAmount = Math.round(agreedTuitionTotal / structure.installments);

          // If agreed is less than standard, treat standard as base and diff as scholarship
          if (standardInstallmentAmount > agreedInstallmentAmount) {
            amount = standardInstallmentAmount;
            payload.discount = (payload.discount || 0) + (standardInstallmentAmount - agreedInstallmentAmount);
          } else {
            amount = agreedInstallmentAmount;
          }
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
        discount: payload.discount || 0,
        paidAmount: payload.paidAmount || 0,
        remarks: payload.remarks || null,
        coveredInstallments: payload.coveredInstallments || null,
        feeStructureId,
        installmentNumber,
        studentClassId: classId, // Use calculated classId - NOT from payload
        studentProgramId: programId, // Use calculated programId - NOT from payload
        studentSectionId: student.sectionId, // Snapshot current section
        fineAmount: payload.fineAmount || 0,
        challanNumber: this.generateNumericChallanNumber(),
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
    const { studentId, search, status, month, installmentNumber, startDate, endDate } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const where: any = studentId ? { studentId: Number(studentId) } : {};

    if (search) {
      const searchConditions: any[] = [
        { challanNumber: { contains: search } },
        { student: { fName: { contains: search } } },
        { student: { mName: { contains: search } } },
        { student: { lName: { contains: search } } },
        { student: { rollNumber: { contains: search } } },
      ];

      // If search is a number, also check for installmentNumber
      if (!isNaN(Number(search))) {
        searchConditions.push({ installmentNumber: Number(search) });
      }

      where.AND = [
        ...(where.AND || []),
        { OR: searchConditions }
      ];
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
            { studentProgramId: null, student: { programId: Number(query.programId) } }
          ]
        }
      ];
    }

    if (query.classId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { studentClassId: Number(query.classId) },
            { studentClassId: null, student: { classId: Number(query.classId) } }
          ]
        }
      ];
    }

    if (query.sectionId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { studentSectionId: Number(query.sectionId) },
            // Fallback
            { studentSectionId: null, student: { sectionId: Number(query.sectionId) } }
          ]
        }
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
      orderBy: [
        { dueDate: 'asc' },
        { installmentNumber: 'asc' }
      ],
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
        { studentProgramId: null, student: { programId: Number(programId) } }
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
            { studentClassId: null, student: { classId: Number(classId) } }
          ]
        }
      ];
    }

    if (sectionId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { studentSectionId: Number(sectionId) },
            // Fallback only useful if student hasn't moved sections
            { studentSectionId: null, student: { sectionId: Number(sectionId) } }
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
      },
      orderBy: [
        { dueDate: 'asc' },
        { student: { rollNumber: 'asc' } }
      ],
    });

    // Calculate dynamic late fees
    const now = new Date();
    data.forEach((challan: any) => {
      challan.lateFeeFine = 0;
      if (challan.status === 'PENDING' && challan.dueDate && challan.student?.lateFeeFine > 0) {
        const dueDate = new Date(challan.dueDate);
        if (now > dueDate) {
          const diffTime = Math.abs(now.getTime() - dueDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          challan.lateFeeFine = diffDays * challan.student.lateFeeFine;
        }
      }
    });

    return data;
  }


  async updateFeeChallan(id: number, payload: UpdateFeeChallanDto) {
    // Handle status change logic if needed (e.g. updating paidAmount)
    console.log(id);
    const data: any = { ...payload };
    console.log(data);

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

    if (payload.status === 'PAID') {
      if (!data.paidDate) {
        data.paidDate = new Date();
      }

      // Fetch current challan to calculate allocation
      const challan = await this.prisma.feeChallan.findUnique({
        where: { id },
        include: {
          student: true,
          feeStructure: true,
        },
      });

      if (challan) {
        // Calculate dynamic late fee
        let dynamicLateFee = 0;
        if (
          challan.status === 'PENDING' &&
          challan.dueDate &&
          (challan.student as any)?.lateFeeFine > 0
        ) {
          const now = new Date();
          const dueDate = new Date(challan.dueDate);
          if (now > dueDate) {
            const diffTime = Math.abs(now.getTime() - dueDate.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            dynamicLateFee = diffDays * (challan.student as any).lateFeeFine;
          }
        }

        // If paidAmount not provided, default to full amount (including fine and dynamic late fee)
        if (data.paidAmount === undefined || data.paidAmount === null) {
          data.paidAmount =
            challan.amount + challan.fineAmount + dynamicLateFee;
        }

        // Calculate new payment amount
        const paymentIncrease = data.paidAmount - challan.paidAmount;

        if (paymentIncrease > 0) {
          // Calculate dues - MUST respect the persisted discount
          // Net Tuition Due = (Challan Amount - Persisted Discount) - Already Paid toward tuition
          const netTuitionTotal = challan.amount - challan.discount;
          const tuitionDue = Math.max(0, netTuitionTotal - challan.tuitionPaid);
          const additionalDue = Math.max(0, challan.fineAmount - challan.additionalPaid);

          // Allocate payment: Tuition first, then additional charges
          let remainingPayment = paymentIncrease;

          // 1. Allocate to tuition
          const tuitionPayment = Math.min(remainingPayment, tuitionDue);
          remainingPayment -= tuitionPayment;

          // 2. Allocate remaining to additional charges
          const additionalPayment = Math.min(remainingPayment, additionalDue);

          // Update paid amounts
          data.tuitionPaid = challan.tuitionPaid + tuitionPayment;
          data.additionalPaid = challan.additionalPaid + additionalPayment;

          console.log('💳 Payment Allocation:');
          console.log('  New Payment:', paymentIncrease);
          console.log(
            '  → Tuition:',
            tuitionPayment,
            '(Total:',
            data.tuitionPaid,
            '/',
            challan.amount,
            ')',
          );
          console.log(
            '  → Additional:',
            additionalPayment,
            '(Total:',
            data.additionalPaid,
            '/',
            challan.fineAmount,
            ')',
          );

          // Calculate covered installments
          let installmentsCovered = 0;
          if (challan.feeStructure && challan.feeStructure.installments > 0) {
            const structure = challan.feeStructure;
            const installmentAmount =
              structure.totalAmount / structure.installments;

            // Use Math.round with a small epsilon or just Math.round to handle floating point/rounding differences
            // If they pay the expected tuition, they cover the installment
            installmentsCovered = Math.round(tuitionPayment / installmentAmount);
          } else if (challan.installmentNumber > 0 && tuitionPayment > 0) {
            // Fallback: If this is a pre-generated installment challan (number > 0) 
            // and we're paying tuition, it covers (at least) this installment.
            installmentsCovered = 1;
          }

          if (installmentsCovered > 0) {
            // Priority: Use the existing installment number on the challan
            //pre-generated challans (#7, #8, etc.) keep their numbers
            let startInstallment = challan.installmentNumber || 1;

            // If it's zero (Additional Charges) or we need to calculate specifically for arrears
            if (challan.installmentNumber === 0 || (challan.includesArrears && challan.studentArrearId)) {
              if (challan.includesArrears && challan.studentArrearId) {
                const arrear = await this.prisma.studentArrear.findUnique({
                  where: { id: challan.studentArrearId },
                  select: { lastInstallmentNumber: true },
                });

                if (arrear) {
                  startInstallment = arrear.lastInstallmentNumber + 1;
                  console.log(
                    '🔢 Arrears payment - Starting from installment:',
                    startInstallment,
                  );
                }
              } else {
                // For ad-hoc challans without a number, find the next available slot
                const previousChallans = await this.prisma.feeChallan.findMany({
                  where: {
                    feeStructureId: challan.feeStructureId,
                    studentId: challan.studentId,
                    status: 'PAID',
                    id: { not: challan.id },
                  },
                  select: {
                    coveredInstallments: true,
                    installmentNumber: true,
                  },
                });

                let highestInstallment = 0;
                for (const prev of previousChallans) {
                  if (prev.coveredInstallments) {
                    const parts = prev.coveredInstallments.split('-');
                    const highest = parseInt(parts[parts.length - 1]) || 0;
                    highestInstallment = Math.max(highestInstallment, highest);
                  } else if (prev.installmentNumber) {
                    highestInstallment = Math.max(
                      highestInstallment,
                      prev.installmentNumber,
                    );
                  }
                }

                if (highestInstallment > 0) {
                  startInstallment = highestInstallment + 1;
                }
              }
            }

            const endInstallment = startInstallment + installmentsCovered - 1;

            // Store as range: "7-9" or single: "7"
            if (startInstallment === endInstallment) {
              data.coveredInstallments = `${startInstallment}`;
            } else {
              data.coveredInstallments = `${startInstallment}-${endInstallment}`;
            }

            console.log(
              '📋 Installments Covered:',
              data.coveredInstallments,
              '(based on payment of',
              tuitionPayment,
              ')',
            );
          }
        }
      }

      const updatedChallan = await this.prisma.feeChallan.update({
        where: { id },
        data,
        include: {
          student: true,
          feeStructure: true,
        },
      });

      // Check if this was an Arrears Payment and update the Arrears record
      if (updatedChallan.status === 'PAID' && updatedChallan.studentArrearId) {
        const arrear = await this.prisma.studentArrear.findUnique({
          where: { id: updatedChallan.studentArrearId },
        });

        if (arrear) {
          // Use tuitionPaid for arrears reduction (not total paidAmount)
          // Only tuition payments reduce arrears, not additional charges
          const newArrearAmount = Math.max(
            0,
            arrear.arrearAmount - updatedChallan.tuitionPaid,
          );

          // Parse coveredInstallments to get the highest installment paid
          let highestInstallment = arrear.lastInstallmentNumber;
          if (updatedChallan.coveredInstallments) {
            const parts = updatedChallan.coveredInstallments.split('-');
            highestInstallment =
              parseInt(parts[parts.length - 1]) || arrear.lastInstallmentNumber;
          }

          console.log(
            '📝 Updating StudentArrear - lastInstallment:',
            arrear.lastInstallmentNumber,
            '→',
            highestInstallment,
          );

          await this.prisma.studentArrear.update({
            where: { id: arrear.id },
            data: {
              lastInstallmentNumber: highestInstallment,
              arrearAmount: newArrearAmount,
            },
          });

          // If fully paid, delete the record
          if (newArrearAmount === 0) {
            await this.prisma.studentArrear.delete({
              where: { id: arrear.id },
            });
          }
        }
      }

      return updatedChallan;
    } else {
      // For non-payment updates (remarks, dueDate, selectedHeads, etc.)
      // Just update the challan without payment-specific logic
      const updatedChallan = await this.prisma.feeChallan.update({
        where: { id },
        data,
        include: {
          student: true,
          feeStructure: true,
        },
      });

      return updatedChallan;
    }
  }

  async syncStudentChallans(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        feeInstallments: true,
      } as any,
    });

    if (!student) return;

    // Fetch FeeStructure to calculate standard vs agreed discount
    let standardInstallmentAmount = 0;
    let structure: any = null;
    if (student.programId && student.classId) {
      structure = await this.prisma.feeStructure.findUnique({
        where: {
          programId_classId: {
            programId: student.programId,
            classId: student.classId,
          },
        },
      });
      if (structure) {
        standardInstallmentAmount = Math.round(structure.totalAmount / structure.installments);
      }
    }

    // Get all PENDING challans for this student AND CURRENT CLASS
    // This ensures we don't update challans from a previous class/session
    const pendingChallans = await this.prisma.feeChallan.findMany({
      where: {
        studentId,
        status: 'PENDING',
        challanType: 'INSTALLMENT',
        studentClassId: student.classId || undefined, // STRICT SCOPE
      },
      orderBy: { installmentNumber: 'asc' },
    });

    // Match installments to challans
    for (const installment of student.feeInstallments as any[]) {
      const existingChallan = pendingChallans.find(
        (c: any) => c.installmentNumber === installment.installmentNumber,
      );

      // Decided Amount Logic:
      // finalAmount (Standard) = standardInstallmentAmount
      // discount (Scholarship) = Standard - agreedAmount (installment.amount)

      const agreedAmount = installment.amount;
      let finalAmount = agreedAmount;
      let scholarshipDiscount = 0;

      if (standardInstallmentAmount > agreedAmount) {
        finalAmount = standardInstallmentAmount;
        scholarshipDiscount = standardInstallmentAmount - agreedAmount;
      }

      const challanData = {
        amount: finalAmount,
        discount: scholarshipDiscount,
        dueDate: new Date(installment.dueDate),
        studentClassId: student.classId,
        studentProgramId: student.programId,
        feeStructureId: structure?.id || null, // Snapshot the structure
      };

      if (existingChallan) {
        // Update existing pending challan
        await this.prisma.feeChallan.update({
          where: { id: existingChallan.id },
          data: challanData,
        });
      } else {
        // Create new pending challan
        // Check if ANY challan exists for this installment number AND CURRENT CLASS
        const anyChallan = await this.prisma.feeChallan.findFirst({
          where: {
            studentId,
            installmentNumber: installment.installmentNumber,
            challanType: 'INSTALLMENT',
            studentClassId: student.classId || undefined,
          } as any,
        });

        if (!anyChallan) {
          await this.prisma.feeChallan.create({
            data: {
              ...challanData,
              studentId,
              challanNumber: this.generateNumericChallanNumber(),
              status: 'PENDING',
              installmentNumber: installment.installmentNumber,
              challanType: 'INSTALLMENT',
            } as any,
          });
        }
      }
    }

    // Cleanup: Remove pending challans for installments that no longer exist
    const currentInstallmentNumbers = (student.feeInstallments as any[]).map(
      (i) => i.installmentNumber,
    );
    const challansToRemove = pendingChallans.filter(
      (c: any) => !currentInstallmentNumbers.includes(c.installmentNumber),
    );

    for (const challan of challansToRemove) {
      // Only remove if it's truly pending (no partial payments etc)
      if (challan.paidAmount === 0 && challan.status === 'PENDING') {
        await this.prisma.feeChallan.delete({
          where: { id: challan.id },
        });
      }
    }
  }

  async deleteFeeChallan(id: number) {
    return await this.prisma.feeChallan.delete({
      where: { id },
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
    const now = new Date();
    history.forEach((challan: any) => {
      challan.lateFeeFine = 0;
      if (challan.status === 'PENDING' && challan.dueDate && challan.student?.lateFeeFine > 0) {
        const dueDate = new Date(challan.dueDate);
        if (now > dueDate) {
          const diffTime = Math.abs(now.getTime() - dueDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          challan.lateFeeFine = diffDays * challan.student.lateFeeFine;
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
      totalAllSessionsDiscount += c.discount;
      totalAllSessionsAdditional += c.fineAmount;

      const sessionKey = c.feeStructureId
        ? `structure-${c.feeStructureId}`
        : c.studentClassId && c.studentProgramId
          ? `snapshot-${c.studentProgramId}-${c.studentClassId}`
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

      const totalPaid = challans.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
      const totalDiscount = challans.reduce(
        (sum, c) => sum + (c.discount || 0),
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
      const tuitionBaseInStructure = tuitionOnlyAmount > 0 ? tuitionOnlyAmount : (feeStructure?.totalAmount || 0);
      const otherChargesAmount = Math.max(0, (feeStructure?.totalAmount || 0) - tuitionBaseInStructure);

      const effectiveTuition = (session.isCurrentSession && student.tuitionFee && student.tuitionFee > 0)
        ? student.tuitionFee
        : tuitionBaseInStructure;

      const sessionTotalAmount = effectiveTuition + otherChargesAmount;
      const tuitionPaid = totalPaid - totalAdditional + totalDiscount;

      // New: Calculate breakdown of additional charges paid from selectedHeads JSON
      const additionalChargesMap = new Map();
      challans.filter(c => c.status === 'PAID' && c.selectedHeads).forEach(c => {
        try {
          const parsedHeads = JSON.parse(c.selectedHeads) || [];
          if (Array.isArray(parsedHeads)) {
            parsedHeads.forEach(head => {
              // Only count if it's an additional charge (not tuition, not discount)
              const isAdditional = head.type === 'additional' || (!head.type && !head.isTuition && !head.isDiscount);
              if (isAdditional && head.amount > 0) {
                const current = additionalChargesMap.get(head.name) || 0;
                additionalChargesMap.set(head.name, current + head.amount);
              }
            });
          }
        } catch (e) { /* ignore parse errors */ }
      });
      const additionalChargesPaid = Object.fromEntries(additionalChargesMap);

      return {
        ...session,
        sessionLabel:
          session.class && session.program
            ? `${session.class.name} - ${session.program.name}`
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
          pendingInstallments: Math.max(0, totalInstallments - paidInstallments),
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
          totalDiscount: totalAllSessionsDiscount,
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
        key = `Week ${weekNo}, ${date.getFullYear()}`;
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
        discount: true,
      },
    });

    const totalRevenue = revenueAggr._sum.paidAmount || 0;
    const totalDiscounts = revenueAggr._sum.discount || 0;

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
        discount: true,
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
    const totalOutstanding = outstandingAggr.reduce((sum, c: any) => {
      let dynamicLateFee = 0;
      if (c.dueDate && c.student?.lateFeeFine > 0) {
        const dueDate = new Date(c.dueDate);
        if (now > dueDate) {
          const diffTime = Math.abs(now.getTime() - dueDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          dynamicLateFee = diffDays * c.student.lateFeeFine;
        }
      }

      const netAmount =
        (c.amount || 0) +
        (c.fineAmount || 0) +
        dynamicLateFee -
        (c.discount || 0);
      const remaining = netAmount - (c.paidAmount || 0);
      return sum + Math.max(0, remaining);
    }, 0);

    return {
      totalRevenue,
      totalOutstanding,
      totalDiscounts,
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
      // Determine class name from history (studentClassId) or nothing
      let className = 'Unknown Class';
      let dynamicLateFee = 0;

      // Calculate dynamic late fee for pending/overdue
      if (c.status === 'PENDING' && c.dueDate && c.student?.lateFeeFine > 0) {
        const dueDate = new Date(c.dueDate);
        if (now > dueDate) {
          const diffTime = Math.abs(now.getTime() - dueDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          dynamicLateFee = diffDays * c.student.lateFeeFine;
        }
      }

      if (c.studentClass) {
        className = `${c.studentClass.name} - ${c.studentClass.program?.name || '-'}`;
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
          dynamicLateFee -
          (c.discount || 0);

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
        isDefault
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

    console.log(`🧹 Cleaning up challans for student ${studentId} in class ${classId} (Demotion)`);

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
                studentClassId: null,      // Legacy fallback
                feeStructure: { classId: classId }
              },
              // FALLBACK: If no snapshot and no fee structure link (orphaned?), 
              // we might want to check against the student's *current* class (which is still 'classId' coming in)
              // But 'classId' arg IS the current class.
            ]
          }
        ]
      }
    });

    console.log(`✅ Deleted ${result.count} challans.`);
  }

  async getFeeChallanTemplateById(id: number) {
    const template = await this.prisma.feeChallanTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Fee challan template with ID ${id} not found`);
    }

    return template;
  }

  async updateFeeChallanTemplate(id: number, payload: any) {
    const template = await this.prisma.feeChallanTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Fee challan template with ID ${id} not found`);
    }

    // If setting as default, unset other defaults
    if (payload.isDefault) {
      await this.prisma.feeChallanTemplate.updateMany({
        where: {
          id: { not: id },
          isDefault: true
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
      throw new NotFoundException(`Fee challan template with ID ${id} not found`);
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
