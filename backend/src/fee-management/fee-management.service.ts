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
  constructor(private readonly prisma: PrismaService) {}

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
          amount = structure.totalAmount / structure.installments;
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
        fineAmount: payload.fineAmount || 0,
        challanNumber: `CH-${Date.now()}-${Math.floor(Math.random() * 10)}`,
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

  async getFeeChallans(
    studentId?: number,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const where: any = studentId ? { studentId } : {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        { student: { fName: { contains: search } } },
        { student: { mName: { contains: search } } },
        { student: { lName: { contains: search } } },
        { student: { rollNumber: { contains: search } } },
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
      },
      orderBy: {
        createdAt: 'desc',
      },
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

    if (payload.status === 'PAID') {
      if (!data.paidDate) {
        data.paidDate = new Date();
      }

      // Fetch current challan to calculate allocation
      const challan = await this.prisma.feeChallan.findUnique({
        where: { id },
        include: {
          feeStructure: true,
        },
      });

      if (challan) {
        // If paidAmount not provided, default to full amount
        if (data.paidAmount === undefined || data.paidAmount === null) {
          data.paidAmount = challan.amount + challan.fineAmount;
        }

        // Calculate new payment amount
        const paymentIncrease = data.paidAmount - challan.paidAmount;

        if (paymentIncrease > 0) {
          // Calculate dues
          const tuitionDue = challan.amount - challan.tuitionPaid;
          const additionalDue = challan.fineAmount - challan.additionalPaid;

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

          // Calculate covered installments if fee structure exists
          if (challan.feeStructure && challan.feeStructure.installments > 0) {
            const structure = challan.feeStructure;
            const installmentAmount =
              structure.totalAmount / structure.installments;

            // CRITICAL: Calculate based on NEW tuition payment, not cumulative total
            const installmentsCovered = Math.floor(
              tuitionPayment / installmentAmount,
            );

            if (installmentsCovered > 0) {
              let startInstallment = 1;

              // Check if this is an arrears payment
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
                // For normal payments, check previous paid challans for this fee structure
                const previousChallans = await this.prisma.feeChallan.findMany({
                  where: {
                    feeStructureId: challan.feeStructureId,
                    studentId: challan.studentId,
                    status: 'PAID',
                    id: { not: challan.id }, // Exclude current challan
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
                  console.log(
                    '🔢 Normal payment - Continuing from installment:',
                    startInstallment,
                  );
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
  }

  async getStudentFeeSummary(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, program: true },
    });

    if (!student) throw new NotFoundException('Student not found');

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
          feeHeads: {
            include: {
              feeHead: true,
            },
          },
        },
      });
    }

    const challans = feeStructure
      ? await this.prisma.feeChallan.findMany({
          where: {
            studentId,
            feeStructureId: feeStructure.id,
          },
        })
      : [];

    // Calculate tuition-only amount from fee structure
    let tuitionOnlyAmount = 0;
    if (feeStructure) {
      const tuitionHeads = feeStructure.feeHeads.filter(
        (fh) => fh.feeHead.isTuition,
      );
      tuitionOnlyAmount = tuitionHeads.reduce((sum, fh) => sum + fh.amount, 0);
    }

    const totalPaid = challans.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalDiscount = challans.reduce((sum, c) => sum + c.discount, 0);

    // Calculate installments based on coveredInstallments ranges
    let paidInstallments = 0;
    challans
      .filter((c) => c.status === 'PAID')
      .forEach((c) => {
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

    for (const challan of challans.filter(
      (c) => c.status === 'PAID' && c.selectedHeads,
    )) {
      try {
        const parsedHeads = JSON.parse(challan.selectedHeads!) || [];

        if (Array.isArray(parsedHeads) && parsedHeads.length > 0) {
          // Check if it's the new format (Array of objects with 'type' or 'amount')
          const isNewFormat =
            typeof parsedHeads[0] === 'object' && parsedHeads[0] !== null;

          if (isNewFormat) {
            // New Format: Extract directly from the stored JSON
            // [{ id, name, amount, type, ... }]
            parsedHeads.forEach((head: any) => {
              // Check if it is an additional charge (not tuition, not discount)
              // The new format uses 'type', but let's be robust
              const isAdditional =
                head.type === 'additional' ||
                (!head.type && !head.isTuition && !head.isDiscount); // fallback

              // Only count if amount > 0
              if (isAdditional && head.amount > 0) {
                const current = additionalChargesMap.get(head.name) || 0;
                additionalChargesMap.set(head.name, current + head.amount);
              }
            });
          } else {
            // Old Format: Array of IDs [1, 2, 3]
            // Fetch the fee heads for this challan
            const heads = await this.prisma.feeHead.findMany({
              where: {
                id: { in: parsedHeads },
                isDiscount: false,
                isTuition: false,
              },
            });

            heads.forEach((head) => {
              const current = additionalChargesMap.get(head.name) || 0;
              additionalChargesMap.set(head.name, current + head.amount);
            });
          }
        }
      } catch (e) {
        // Skip if JSON parse fails
      }
    }

    const additionalChargesPaid = Object.fromEntries(additionalChargesMap);

    // Calculate total additional charges paid (sum of fineAmount from all paid challans)
    const totalAdditionalChargesPaid = challans
      .filter((c) => c.status === 'PAID')
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
        totalAdditionalChargesPaid, // Total sum
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
      },
    });

    const totalOutstanding = outstandingAggr.reduce((sum, c) => {
      const netAmount =
        (c.amount || 0) + (c.fineAmount || 0) - (c.discount || 0);
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
        studentClass: {
          include: { program: true },
        },
      },
    });

    challans.forEach((c) => {
      // Determine class name from history (studentClassId) or nothing
      let className = 'Unknown Class';
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
        stats[className].outstanding +=
          c.amount +
          (c.fineAmount || 0) -
          (c.discount || 0) -
          (c.paidAmount || 0);
      }
    });

    // Convert to array
    return Object.values(stats);
  }
}
