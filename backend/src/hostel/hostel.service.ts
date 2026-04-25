import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRegistrationDto } from './dtos/create-registration.dto';
import { UpdateRegistrationDto } from './dtos/update-registration.dto';
import { CreateFeePaymentDto } from './dtos/create-fee-payment.dto';
import { CreateHostelChallanDto } from './dtos/create-hostel-challan.dto';
import { UpdateHostelChallanDto } from './dtos/update-hostel-challan.dto';

@Injectable()
export class HostelService {
  constructor(private prisma: PrismaService) {}

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // REGISTRATION CRUD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async createRegistration(dto: CreateRegistrationDto) {
    if (dto.studentId) {
      const existing = await this.prisma.hostelRegistration.findFirst({
        where: { studentId: Number(dto.studentId) },
      });

      if (existing) {
        throw new BadRequestException(
          'Student is already registered in hostel',
        );
      }
    }

    // Generate ID: HSTL + 2-digit year + 3-digit sequence (e.g. HSTL26001)
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `HSTL${year}`;
    const countThisYear = await this.prisma.hostelRegistration.count({
      where: { id: { startsWith: prefix } },
    });
    const id = `${prefix}${String(countThisYear + 1).padStart(3, '0')}`;

    return this.prisma.hostelRegistration.create({
      data: {
        id,
        studentId: dto.studentId ? Number(dto.studentId) : undefined,
        externalName: dto.externalName,
        externalInstitute: dto.externalInstitute,
        externalGuardianName: dto.externalGuardianName,
        externalGuardianNumber: dto.externalGuardianNumber,
        hostelName: dto.hostelName,
        registrationDate: new Date(dto.registrationDate),
        status: dto.status || 'active',
        guardianCnic: dto.guardianCnic,
        studentCnic: dto.studentCnic,
        address: dto.address,
        decidedFeePerMonth: dto.decidedFeePerMonth,
      },
      include: {
        student: {
          select: {
            id: true,
            fName: true,
            lName: true,
            rollNumber: true,
            class: { select: { name: true } },
            program: { select: { name: true } },
          },
        },
      },
    });
  }

  async findAllRegistrations() {
    return this.prisma.hostelRegistration.findMany({
      include: {
        student: {
          select: {
            id: true,
            fName: true,
            lName: true,
            rollNumber: true,
            fatherOrguardian: true,
            parentOrGuardianPhone: true,
            parentCNIC: true,
            studentCnic: true,
            address: true,
            class: { select: { name: true } },
            program: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneRegistration(id: string) {
    const registration = await this.prisma.hostelRegistration.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fName: true,
            lName: true,
            rollNumber: true,
            fatherOrguardian: true,
            parentOrGuardianPhone: true,
            parentCNIC: true,
            studentCnic: true,
            address: true,
            class: { select: { name: true } },
            program: { select: { name: true } },
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }

    return registration;
  }

  async updateRegistration(id: string, dto: UpdateRegistrationDto) {
    const exists = await this.prisma.hostelRegistration.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }

    return this.prisma.hostelRegistration.update({
      where: { id },
      data: {
        ...(dto.hostelName && { hostelName: dto.hostelName }),
        ...(dto.registrationDate && {
          registrationDate: new Date(dto.registrationDate),
        }),
        ...(dto.status && { status: dto.status }),
        studentId: dto.studentId ? Number(dto.studentId) : null,
        ...(dto.externalName && { externalName: dto.externalName }),
        ...(dto.externalInstitute && {
          externalInstitute: dto.externalInstitute,
        }),
        ...(dto.externalGuardianName && {
          externalGuardianName: dto.externalGuardianName,
        }),
        ...(dto.externalGuardianNumber && {
          externalGuardianNumber: dto.externalGuardianNumber,
        }),
        ...(dto.guardianCnic !== undefined && { guardianCnic: dto.guardianCnic }),
        ...(dto.studentCnic !== undefined && { studentCnic: dto.studentCnic }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.decidedFeePerMonth !== undefined && { decidedFeePerMonth: dto.decidedFeePerMonth }),
      },
      include: {
        student: {
          select: {
            id: true,
            fName: true,
            lName: true,
            rollNumber: true,
            class: { select: { name: true } },
            program: { select: { name: true } },
          },
        },
      },
    });
  }

  async deleteRegistration(id: string) {
    const exists = await this.prisma.hostelRegistration.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }

    return this.prisma.hostelRegistration.delete({ where: { id } });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ROOMS & ALLOCATION CRUD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async createRoom(data: any) {
    return this.prisma.room.create({
      data: {
        roomNumber: data.roomNumber,
        roomType: data.roomType,
        capacity: Number(data.capacity),
        hostelName: data.hostelName,
        status: data.status || 'vacant',
      },
    });
  }

  async findAllRooms() {
    return this.prisma.room.findMany({
      include: { allocations: { include: { student: true } } },
      orderBy: { roomNumber: 'asc' },
    });
  }

  async findOneRoom(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { allocations: { include: { student: true } } },
    });
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  async updateRoom(id: string, data: any) {
    const exists = await this.prisma.room.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return this.prisma.room.update({
      where: { id },
      data: {
        ...(data.roomNumber && { roomNumber: data.roomNumber }),
        ...(data.roomType && { roomType: data.roomType }),
        ...(data.capacity && { capacity: Number(data.capacity) }),
        ...(data.hostelName && { hostelName: data.hostelName }),
        ...(data.status && { status: data.status }),
      },
    });
  }

  async deleteRoom(id: string) {
    const exists = await this.prisma.room.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return this.prisma.room.delete({ where: { id } });
  }

  async allocateRoom(data: any) {
    const room = await this.prisma.room.findUnique({
      where: { id: data.roomId },
      include: { allocations: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.currentOccupancy >= room.capacity) {
      throw new BadRequestException('Room is at full capacity');
    }

    if (data.studentId) {
      // Check if student is already allocated
      const existingAllocation = await this.prisma.roomAllocation.findFirst({
        where: { studentId: Number(data.studentId) },
      });

      if (existingAllocation) {
        throw new BadRequestException('Student is already allocated to a room');
      }
    }

    // Create allocation and update room
    const allocation = await this.prisma.roomAllocation.create({
      data: {
        roomId: data.roomId,
        studentId: data.studentId ? Number(data.studentId) : undefined,
        externalName: data.externalName,
        allocationDate: new Date(data.allocationDate),
      },
      include: { student: true, room: true },
    });

    await this.prisma.room.update({
      where: { id: data.roomId },
      data: {
        currentOccupancy: { increment: 1 },
        status:
          room.currentOccupancy + 1 >= room.capacity ? 'occupied' : room.status,
      },
    });

    return allocation;
  }

  async deallocateStudent(allocationId: string) {
    const allocation = await this.prisma.roomAllocation.findUnique({
      where: { id: allocationId },
    });

    if (!allocation) {
      throw new NotFoundException('Allocation not found');
    }

    await this.prisma.roomAllocation.delete({ where: { id: allocationId } });

    await this.prisma.room.update({
      where: { id: allocation.roomId },
      data: {
        currentOccupancy: { decrement: 1 },
        status: 'vacant',
      },
    });

    return { success: true };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EXPENSES CRUD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async createExpense(data: any) {
    return this.prisma.hostelExpense.create({
      data: {
        expenseTitle: data.expenseTitle,
        amount: Number(data.amount),
        date: new Date(data.date),
        remarks: data.remarks,
      },
    });
  }

  async findAllExpenses() {
    return this.prisma.hostelExpense.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async findOneExpense(id: string) {
    const expense = await this.prisma.hostelExpense.findUnique({
      where: { id },
    });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async updateExpense(id: string, data: any) {
    const exists = await this.prisma.hostelExpense.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return this.prisma.hostelExpense.update({
      where: { id },
      data: {
        ...(data.expenseTitle && { expenseTitle: data.expenseTitle }),
        ...(data.amount && { amount: Number(data.amount) }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
      },
    });
  }

  async deleteExpense(id: string) {
    const exists = await this.prisma.hostelExpense.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return this.prisma.hostelExpense.delete({ where: { id } });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INVENTORY CRUD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async createInventory(data: any) {
    return this.prisma.hostelInventory.create({
      data: {
        itemName: data.itemName,
        category: data.category,
        quantity: Number(data.quantity),
        condition: data.condition,
        allocatedToRoom: data.allocatedToRoom,
      },
    });
  }

  async findAllInventory() {
    return this.prisma.hostelInventory.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInventory(id: string) {
    const item = await this.prisma.hostelInventory.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return item;
  }

  async updateInventory(id: string, data: any) {
    const exists = await this.prisma.hostelInventory.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return this.prisma.hostelInventory.update({
      where: { id },
      data: {
        ...(data.itemName && { itemName: data.itemName }),
        ...(data.category && { category: data.category }),
        ...(data.quantity && { quantity: Number(data.quantity) }),
        ...(data.condition && { condition: data.condition }),
        ...(data.allocatedToRoom !== undefined && {
          allocatedToRoom: data.allocatedToRoom,
        }),
      },
    });
  }

  async deleteInventory(id: string) {
    const exists = await this.prisma.hostelInventory.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return this.prisma.hostelInventory.delete({ where: { id } });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STUDENT HOSTEL LOOKUP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async findRegistrationByStudentId(studentId: number) {
    return this.prisma.hostelRegistration.findFirst({
      where: { studentId },
      include: {
        student: {
          select: { id: true, fName: true, lName: true, rollNumber: true }
        }
      }
    });
  }

  async findRoomByStudentId(studentId: number) {
    return this.prisma.roomAllocation.findFirst({
      where: { studentId },
      include: { room: true }
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EXTERNAL CHALLAN CRUD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async createExternalChallan(data: any) {
    const count = await this.prisma.hostelExternalChallan.count();
    const challanNumber = `HEC-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.hostelExternalChallan.create({
      data: {
        registrationId: data.registrationId,
        challanNumber,
        amount: Number(data.amount),
        paidAmount: 0,
        discount: Number(data.discount || 0),
        fineAmount: Number(data.fineAmount || 0),
        dueDate: new Date(data.dueDate),
        status: 'PENDING',
        month: data.month,
        selectedHeads: data.selectedHeads ? JSON.stringify(data.selectedHeads) : null,
        remarks: data.remarks,
      },
      include: { registration: true }
    });
  }

  async findExternalChallansByRegistration(registrationId: string) {
    return this.prisma.hostelExternalChallan.findMany({
      where: { registrationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateExternalChallan(id: number, data: any) {
    return this.prisma.hostelExternalChallan.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.paidAmount !== undefined && { paidAmount: Number(data.paidAmount) }),
        ...(data.paidDate && { paidDate: new Date(data.paidDate) }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
        ...(data.discount !== undefined && { discount: Number(data.discount) }),
        ...(data.fineAmount !== undefined && { fineAmount: Number(data.fineAmount) }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.selectedHeads && { selectedHeads: JSON.stringify(data.selectedHeads) }),
      }
    });
  }

  async deleteExternalChallan(id: number) {
    return this.prisma.hostelExternalChallan.delete({ where: { id } });
  }

  async findAllExternalChallans() {
    return this.prisma.hostelExternalChallan.findMany({
      include: { registration: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FEE PAYMENTS CRUD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async createFeePayment(registrationId: string, dto: CreateFeePaymentDto) {
    const registration = await this.prisma.hostelRegistration.findUnique({
      where: { id: registrationId },
    });
    if (!registration) {
      throw new NotFoundException(`Registration with ID ${registrationId} not found`);
    }
    return this.prisma.hostelFeePayment.create({
      data: {
        registrationId,
        month: dto.month,
        paidDate: new Date(dto.paidDate),
        amount: dto.amount,
      },
    });
  }

  async getFeePayments(registrationId: string) {
    return this.prisma.hostelFeePayment.findMany({
      where: { registrationId },
      orderBy: { paidDate: 'desc' },
    });
  }

  async deleteFeePayment(registrationId: string, paymentId: number) {
    const payment = await this.prisma.hostelFeePayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.registrationId !== registrationId) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found for this registration`);
    }
    return this.prisma.hostelFeePayment.delete({ where: { id: paymentId } });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HOSTEL CHALLAN CRUD (with supersede / arrears support)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private async generateHostelChallanNumber(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `HC${year}`;

    // Find the highest existing sequence number for this prefix to avoid collisions
    const last = await this.prisma.hostelChallan.findFirst({
      where: { challanNumber: { startsWith: prefix } },
      orderBy: { challanNumber: 'desc' },
      select: { challanNumber: true },
    });

    let next = 1;
    if (last) {
      const seq = parseInt(last.challanNumber.slice(prefix.length), 10);
      if (!isNaN(seq)) next = seq + 1;
    }

    // Verify the candidate doesn't already exist (handles gaps from deletions)
    let candidate = `${prefix}${String(next).padStart(3, '0')}`;
    while (await this.prisma.hostelChallan.findUnique({ where: { challanNumber: candidate } })) {
      next++;
      candidate = `${prefix}${String(next).padStart(3, '0')}`;
    }

    return candidate;
  }

  private calculateLateFee(dueDate: Date, ratePerDay: number): number {
    if (!ratePerDay || ratePerDay <= 0) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    if (now <= due) return 0;
    const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays * ratePerDay;
  }

  async createHostelChallan(dto: CreateHostelChallanDto) {
    const registration = await this.prisma.hostelRegistration.findUnique({
      where: { id: dto.registrationId },
    });
    if (!registration) {
      throw new NotFoundException(`Registration ${dto.registrationId} not found`);
    }

    // Validate: challan month must not be before the registration month
    // dto.month is like "March 2026" — parse it to a Date for comparison
    const challanMonthDate = new Date(dto.month);
    if (!isNaN(challanMonthDate.getTime())) {
      const regDate = new Date(registration.registrationDate);
      // Normalize both to first of month
      const challanYM = new Date(challanMonthDate.getFullYear(), challanMonthDate.getMonth(), 1);
      const regYM = new Date(regDate.getFullYear(), regDate.getMonth(), 1);
      if (challanYM < regYM) {
        throw new BadRequestException(
          `Cannot generate challan for ${dto.month}: student was registered in ${regDate.toLocaleString('default', { month: 'long', year: 'numeric' })}. Challans can only be generated from the registration month onwards.`,
        );
      }
    }

    // Get hostel late fee rate from settings
    const settings = await this.prisma.instituteSettings.findFirst();
    const lateFeeRate = settings?.hostelLateFee ?? 0;

    // Check for existing unpaid challan for the same month — supersede it
    const existingUnpaid = await this.prisma.hostelChallan.findFirst({
      where: {
        registrationId: dto.registrationId,
        month: dto.month,
        status: { not: 'PAID' },
      },
    });

    // Find ALL unpaid previous-month challans to roll into arrears chain
    // These are PENDING/PARTIAL/OVERDUE challans for OTHER months (not the current month)
    const unpaidPrevChallans = await this.prisma.hostelChallan.findMany({
      where: {
        registrationId: dto.registrationId,
        month: { not: dto.month },
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Compute total arrears from unpaid previous challans
    const arrearsAmount = unpaidPrevChallans.reduce((sum, c) => {
      const due = c.hostelFee + c.fineAmount + c.lateFeeFine + c.arrearsAmount - c.discount;
      return sum + Math.max(0, due - c.paidAmount);
    }, 0);

    const dueDate = new Date(dto.dueDate);
    const lateFeeFine = this.calculateLateFee(dueDate, lateFeeRate);
    const challanNumber = await this.generateHostelChallanNumber();

    // Void the existing unpaid challan for this same month if any (supersede)
    if (existingUnpaid) {
      const settledAmount = existingUnpaid.paidAmount;
      await this.prisma.hostelChallan.update({
        where: { id: existingUnpaid.id },
        data: { status: 'VOID', settledAmount },
      });
    }

    // Void all unpaid previous-month challans (their balance is now in arrearsAmount)
    if (unpaidPrevChallans.length > 0) {
      await this.prisma.hostelChallan.updateMany({
        where: { id: { in: unpaidPrevChallans.map(c => c.id) } },
        data: { status: 'VOID' },
      });
    }

    // Link to the most recent previous unpaid challan for the arrears chain
    const previousChallanId = unpaidPrevChallans.length > 0
      ? unpaidPrevChallans[unpaidPrevChallans.length - 1].id
      : null;

    const challan = await this.prisma.hostelChallan.create({
      data: {
        challanNumber,
        registrationId: dto.registrationId,
        month: dto.month,
        dueDate,
        hostelFee: registration.decidedFeePerMonth ?? 0,
        fineAmount: dto.fineAmount ?? 0,
        lateFeeFine,
        arrearsAmount,
        discount: dto.discount ?? 0,
        remarks: dto.remarks,
        status: 'PENDING',
        ...(existingUnpaid ? { supersededById: existingUnpaid.id } : {}),
        ...(previousChallanId ? { previousChallanId } : {}),
      },
      include: {
        registration: { include: { student: { select: { id: true, fName: true, lName: true, rollNumber: true } } } },
        supersededBy: true,
        previousChallan: true,
      },
    });

    return challan;
  }

  async getHostelChallans(registrationId: string) {
    // Fetch with nested previousChallan chain (up to 5 levels deep) for payment history
    return this.prisma.hostelChallan.findMany({
      where: { registrationId },
      include: {
        supersededBy: true,
        supersedes: true,
        previousChallan: {
          include: {
            previousChallan: {
              include: {
                previousChallan: {
                  include: {
                    previousChallan: {
                      include: {
                        previousChallan: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateHostelChallan(id: number, dto: UpdateHostelChallanDto) {
    const challan = await this.prisma.hostelChallan.findUnique({
      where: { id },
      include: { supersedes: true },
    });
    if (!challan) throw new NotFoundException(`Hostel challan ${id} not found`);

    // Lock PAID challans — no edits allowed
    if (challan.status === 'PAID') {
      throw new Error('This challan is fully paid and cannot be modified.');
    }

    const data: any = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.fineAmount !== undefined) data.fineAmount = dto.fineAmount;
    if (dto.discount !== undefined) data.discount = dto.discount;
    if (dto.remarks !== undefined) data.remarks = dto.remarks;
    if (dto.paidDate !== undefined) data.paidDate = new Date(dto.paidDate);

    // When dueDate changes, recompute late fee automatically
    if (dto.dueDate !== undefined) {
      data.dueDate = new Date(dto.dueDate);
      const settings = await this.prisma.instituteSettings.findFirst();
      const lateFeeRate = settings?.hostelLateFee ?? 0;
      // Only recompute if caller didn't explicitly supply lateFeeFine
      if (dto.lateFeeFine === undefined) {
        data.lateFeeFine = this.calculateLateFee(data.dueDate, lateFeeRate);
      }
    }
    if (dto.lateFeeFine !== undefined) data.lateFeeFine = dto.lateFeeFine;

    if (dto.paidAmount !== undefined) {
      const newPaid = (challan.paidAmount || 0) + dto.paidAmount;
      data.paidAmount = newPaid;
      const effectiveDiscount = dto.discount ?? challan.discount;
      const effectiveLateFee = data.lateFeeFine ?? challan.lateFeeFine;
      const totalDue = challan.hostelFee + challan.fineAmount + effectiveLateFee + challan.arrearsAmount - effectiveDiscount;
      const newStatus = newPaid >= totalDue ? 'PAID' : newPaid > 0 ? 'PARTIAL' : challan.status;
      data.status = newStatus;
      if (!data.paidDate) data.paidDate = new Date();

      // When fully paid, lock all VOID predecessors in the supersede chain
      if (newStatus === 'PAID') {
        await this.lockSupersededChain(id);
      }
    }

    const updated = await this.prisma.hostelChallan.update({
      where: { id },
      data,
      include: { supersededBy: true, supersedes: true },
    });

    // If this is a VOID challan and its amounts changed, recalculate arrearsAmount
    // on the active challan that superseded it (linked via previousChallanId chain)
    if (challan.status === 'VOID' && (
      dto.fineAmount !== undefined || dto.lateFeeFine !== undefined ||
      dto.discount !== undefined || dto.dueDate !== undefined
    )) {
      await this.recalculateArrearsForSuccessor(challan.registrationId);
    }

    return updated;
  }

  /** Recursively lock all VOID challans superseded by the given challan (and its ancestors). */
  private async lockSupersededChain(challanId: number): Promise<void> {
    const challan = await this.prisma.hostelChallan.findUnique({
      where: { id: challanId },
      include: { supersedes: true },
    });
    if (!challan) return;

    for (const voided of challan.supersedes) {
      if (voided.status === 'VOID') {
        const totalDue = voided.hostelFee + voided.fineAmount + voided.lateFeeFine + voided.arrearsAmount - voided.discount;
        await this.prisma.hostelChallan.update({
          where: { id: voided.id },
          data: { settledAmount: totalDue },
        });
        // Recurse into deeper chain
        await this.lockSupersededChain(voided.id);
      }
    }
  }

  /** When a VOID challan's amounts change, recompute arrearsAmount on the active successor. */
  private async recalculateArrearsForSuccessor(registrationId: string): Promise<void> {
    // Find the active (non-VOID, non-PAID) challan for this registration
    const activeChallan = await this.prisma.hostelChallan.findFirst({
      where: {
        registrationId,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      },
    });
    if (!activeChallan) return;

    // Recompute arrears: sum of all VOID challans' remaining balances
    const voidChallans = await this.prisma.hostelChallan.findMany({
      where: {
        registrationId,
        status: 'VOID',
      },
    });

    const newArrears = voidChallans.reduce((sum, c) => {
      const due = c.hostelFee + c.fineAmount + c.lateFeeFine + c.arrearsAmount - c.discount;
      return sum + Math.max(0, due - c.paidAmount);
    }, 0);

    await this.prisma.hostelChallan.update({
      where: { id: activeChallan.id },
      data: { arrearsAmount: newArrears },
    });
  }

  async deleteHostelChallan(id: number) {
    const challan = await this.prisma.hostelChallan.findUnique({ where: { id } });
    if (!challan) throw new NotFoundException(`Hostel challan ${id} not found`);
    return this.prisma.hostelChallan.delete({ where: { id } });
  }

  async searchRegistrations(query: string) {
    return this.prisma.hostelRegistration.findMany({
      where: {
        OR: [
          { externalName: { contains: query } },
          { id: { contains: query } },
          { student: { OR: [
            { fName: { contains: query } },
            { lName: { contains: query } },
            { rollNumber: { contains: query } },
          ]}},
        ],
      },
      include: {
        student: { select: { id: true, fName: true, lName: true, rollNumber: true, program: { select: { name: true } } } },
      },
      take: 10,
    });
  }
}

