import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRegistrationDto } from './dtos/create-registration.dto';
import { UpdateRegistrationDto } from './dtos/update-registration.dto';
import { CreateFeePaymentDto } from './dtos/create-fee-payment.dto';
import { CreateHostelChallanDto } from './dtos/create-hostel-challan.dto';
import { UpdateHostelChallanDto } from './dtos/update-hostel-challan.dto';

@Injectable()
export class HostelService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Add statusHistory column if it doesn't exist yet (idempotent)
    await this.prisma.$executeRawUnsafe(
      `ALTER TABLE hostelregistration ADD COLUMN IF NOT EXISTS statusHistory JSON NULL`
    ).catch(() => {/* already exists — ignore */});
  }

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

  async findAllRegistrations(filters?: {
    search?: string;
    status?: string;
    type?: 'internal' | 'external' | 'all';
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters?.type === 'internal') {
      where.studentId = { not: null };
    } else if (filters?.type === 'external') {
      where.studentId = null;
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      where.OR = [
        { externalName: { contains: q } },
        { student: { fName: { contains: q } } },
        { student: { lName: { contains: q } } },
        { student: { rollNumber: { contains: q } } },
        { id: { contains: q } },
      ];
    }

    const include = {
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
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.hostelRegistration.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.hostelRegistration.count({ where }),
    ]);

    return { data, total, page, limit, hasMore: skip + data.length < total };
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

  async terminateRegistration(id: string, reason: string) {
    const exists = await this.prisma.hostelRegistration.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Registration ${id} not found`);
    if (!reason?.trim()) throw new BadRequestException('Termination reason is required');

    const history = this.appendHistory(this.parseHistory(exists.terminationReason), {
      action: 'terminated',
      previousStatus: exists.status,
      reason: reason.trim(),
    });

    return this.prisma.hostelRegistration.update({
      where: { id },
      data: { status: 'terminated', terminationReason: JSON.stringify(history) },
    });
  }

  async withdrawRegistration(id: string) {
    const exists = await this.prisma.hostelRegistration.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Registration ${id} not found`);

    const history = this.appendHistory(this.parseHistory(exists.terminationReason), {
      action: 'withdrawn',
      previousStatus: exists.status,
    });

    return this.prisma.hostelRegistration.update({
      where: { id },
      data: { status: 'withdrawn', terminationReason: JSON.stringify(history) },
    });
  }

  async readmitRegistration(id: string) {
    const exists = await this.prisma.hostelRegistration.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Registration ${id} not found`);
    if (exists.status === 'active') throw new BadRequestException('Registration is already active');

    const history = this.appendHistory(this.parseHistory(exists.terminationReason), {
      action: 'readmitted',
      previousStatus: exists.status,
    });

    return this.prisma.hostelRegistration.update({
      where: { id },
      // Keep history in terminationReason; clear display reason since now active
      data: { status: 'active', terminationReason: JSON.stringify(history) },
    });
  }

  async getRegistrationHistory(id: string) {
    const reg = await this.prisma.hostelRegistration.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException(`Registration ${id} not found`);

    const storedHistory = this.parseHistory(reg.terminationReason);

    return [
      { action: 'registered', previousStatus: null, timestamp: reg.createdAt, reason: null },
      ...storedHistory,
    ];
  }

  /** Parse history array from terminationReason field (JSON array or plain string) */
  private parseHistory(raw: string | null): any[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Legacy plain-text reason — not a JSON array, ignore
      return [];
    }
  }

  private appendHistory(existing: any[], entry: { action: string; previousStatus: string; reason?: string }): any[] {
    return [...existing, { ...entry, timestamp: new Date().toISOString() }];
  }

  /** @deprecated — no longer needed, kept for safety */
  private async readStatusHistory(id: string): Promise<any[]> {
    return [];
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

  async findAllExpenses(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }
    return this.prisma.hostelExpense.findMany({
      where,
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



  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HOSTEL CHALLAN CRUD (Modular Architecture)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Generate a globally unique 8-digit challan number.
   */
  private async generateUniqueHostelChallanNumber(): Promise<string> {
    let challanNumber = '';
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const num = Math.floor(10000000 + Math.random() * 90000000);
      challanNumber = num.toString();
      
      const [existsInExtra, existsInFee, existsInHostel] = await Promise.all([
        this.prisma.extraChallan.findUnique({ where: { challanNumber } }),
        this.prisma.feeChallanV2.findUnique({ where: { challanNumber } }),
        this.prisma.hostelChallan.findUnique({ where: { challanNumber } }),
      ]);

      if (!existsInExtra && !existsInFee && !existsInHostel) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) throw new BadRequestException('Could not generate unique challan number');
    return challanNumber;
  }

  async createHostelChallan(dto: CreateHostelChallanDto) {
    const { hostelRegNumber, month, feeHeadIds, heads, dueDate, remarks } = dto;

    // 1. Verify registration
    const reg = await this.prisma.hostelRegistration.findUnique({
      where: { id: hostelRegNumber },
      include: { student: true },
    });
    if (!reg) throw new NotFoundException(`Hostel Registration #${hostelRegNumber} not found`);

    // 2. Aggregate fee heads (base hostel fee + predefined heads + custom heads)
    let feeHeadsList: { headName: string; amount: number }[] = [];

    if (reg.decidedFeePerMonth && Number(reg.decidedFeePerMonth) > 0) {
      feeHeadsList.push({ headName: 'Hostel Fee', amount: Number(reg.decidedFeePerMonth) });
    }
    if (feeHeadIds && feeHeadIds.length > 0) {
      const predefined = await this.prisma.feeHead.findMany({ where: { id: { in: feeHeadIds } } });
      feeHeadsList = [...feeHeadsList, ...predefined.map(h => ({ headName: h.name, amount: Number(h.amount) }))];
    }
    if (heads && heads.length > 0) {
      feeHeadsList = [...feeHeadsList, ...heads];
    }
    const baseFeeTotal = feeHeadsList.reduce((sum, h) => sum + h.amount, 0);

    // 3. Compute arrears from ALL PENDING or PARTIAL challans for this registration
    const unpaidChallans = await this.prisma.hostelChallan.findMany({
      where: {
        hostelRegNumber,
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      orderBy: { generatedAt: 'asc' },
    });

    const arrearsAmount = unpaidChallans.reduce(
      (sum, c) => sum + Math.max(0, Number(c.totalAmount) - Number(c.paidAmount)),
      0,
    );

    // 4. Build final heads list — append Arrears head if needed
    const finalHeads = [...feeHeadsList];
    if (arrearsAmount > 0) {
      finalHeads.push({ headName: 'Arrears', amount: arrearsAmount });
    }
    const totalAmount = baseFeeTotal + arrearsAmount;

    const challanNumber = await this.generateUniqueHostelChallanNumber();

    return await this.prisma.$transaction(async (tx) => {
      // 5. Create the new challan (paidAmount = 0, fresh start)
      const newChallan = await tx.hostelChallan.create({
        data: {
          challanNumber,
          hostelRegNumber,
          studentId: reg.studentId ?? undefined,
          month,
          dueDate: new Date(dueDate),
          totalAmount,
          paidAmount: 0,
          arrearsAmount,
          status: 'PENDING',
          remarks,
        } as any,
      });

      // 6. Create challan heads
      if (finalHeads.length > 0) {
        await tx.hostelChallanHead.createMany({
          data: finalHeads.map(h => ({
            hostelChallanId: newChallan.id,
            headName: h.headName,
            amount: h.amount,
          })),
        });
      }

      // 7. Mark all absorbed ancestors as SUPERSEDED, pointing to the new leading challan
      if (unpaidChallans.length > 0) {
        await tx.hostelChallan.updateMany({
          where: { id: { in: unpaidChallans.map(c => c.id) } },
          data: {
            status: 'SUPERSEDED',
            settledByChallanNumber: challanNumber,
          } as any,
        });
      }

      return { ...newChallan, heads: finalHeads };
    });
  }

  async getHostelChallans(query: any) {
    const { registrationId, status, search } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const where: any = {};
    if (registrationId) where.hostelRegNumber = registrationId;
    if (status && status !== 'all') where.status = status.toUpperCase();

    if (search) {
      const q = search.trim();
      where.OR = [
        { challanNumber: { contains: q } },
        { hostelRegNumber: { contains: q } },
        { student: { fName: { contains: q } } },
        { student: { rollNumber: { contains: q } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.hostelChallan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          student: { select: { fName: true, lName: true, rollNumber: true } },
          hostelRegistration: { select: { externalName: true, decidedFeePerMonth: true } },
          heads: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
        orderBy: { generatedAt: 'desc' },
      }),
      this.prisma.hostelChallan.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit), limit },
    };
  }

  async updateHostelChallan(id: number, dto: UpdateHostelChallanDto) {
    const { heads, dueDate, remarks, status, discount, lateFeeFine } = dto;

    const challan = await this.prisma.hostelChallan.findUnique({
      where: { id },
      include: { heads: true },
    });
    if (!challan) throw new NotFoundException('Hostel challan not found');
    if (challan.status === 'PAID') throw new BadRequestException('Cannot edit a paid challan');

    return await this.prisma.$transaction(async (tx) => {
      const data: any = {};
      if (dueDate) data.dueDate = new Date(dueDate);
      if (remarks !== undefined) data.remarks = remarks;
      if (status) data.status = status;
      if (discount !== undefined) (data as any).discount = discount;
      if (lateFeeFine !== undefined) (data as any).lateFeeFine = lateFeeFine;

      const systemHeadNames = ['Hostel Fee', 'Arrears'];

      if (heads !== undefined) {
        // Preserve system heads (Hostel Fee, Arrears) — only replace custom/additional heads
        const systemHeads = challan.heads.filter(h => systemHeadNames.includes(h.headName));

        // Delete only non-system heads
        await tx.hostelChallanHead.deleteMany({
          where: {
            hostelChallanId: id,
            headName: { notIn: systemHeadNames },
          },
        });

        // Create the new custom heads
        if (heads.length > 0) {
          await tx.hostelChallanHead.createMany({
            data: heads.map(h => ({
              hostelChallanId: id,
              headName: h.headName,
              amount: h.amount,
            })),
          });
        }

        // Recalculate totalAmount = system heads + new custom heads - discount
        const systemTotal = systemHeads.reduce((sum, h) => sum + Number(h.amount), 0);
        const customTotal = heads.reduce((sum, h) => sum + Number(h.amount), 0);
        const effectiveDiscount = discount !== undefined ? discount : Number((challan as any).discount ?? 0);
        const effectiveLateFee = lateFeeFine !== undefined ? lateFeeFine : Number((challan as any).lateFeeFine ?? 0);
        data.totalAmount = Math.max(0, systemTotal + customTotal + effectiveLateFee - effectiveDiscount);
      } else if (discount !== undefined || lateFeeFine !== undefined) {
        // Only discount/lateFee changed — recalculate from existing heads
        const systemTotal = challan.heads
          .filter(h => systemHeadNames.includes(h.headName))
          .reduce((sum, h) => sum + Number(h.amount), 0);
        const customTotal = challan.heads
          .filter(h => !systemHeadNames.includes(h.headName))
          .reduce((sum, h) => sum + Number(h.amount), 0);
        const effectiveDiscount = discount !== undefined ? discount : Number((challan as any).discount ?? 0);
        const effectiveLateFee = lateFeeFine !== undefined ? lateFeeFine : Number((challan as any).lateFeeFine ?? 0);
        data.totalAmount = Math.max(0, systemTotal + customTotal + effectiveLateFee - effectiveDiscount);
      }

      // Update pendingAmount to reflect new totalAmount
      if (data.totalAmount !== undefined) {
        const currentPaid = Number(challan.paidAmount ?? 0);
        data.pendingAmount = Math.max(0, data.totalAmount - currentPaid);
      }

      return await tx.hostelChallan.update({
        where: { id },
        data,
        include: { heads: true, student: true },
      });
    });
  }

  async deleteHostelChallan(id: number) {
    const challan = await this.prisma.hostelChallan.findUnique({
      where: { id },
      include: { heads: true },
    });
    if (!challan) throw new NotFoundException('Hostel challan not found');
    if (challan.status === 'PAID') throw new BadRequestException('Cannot delete a paid challan');
    if (challan.status === 'SETTLED') throw new BadRequestException('Cannot delete a settled challan. Delete the leading challan instead.');

    await this.prisma.$transaction(async (tx) => {
      // Step 1: Find all SUPERSEDED ancestors that point to this challan
      const ancestors = await tx.hostelChallan.findMany({
        where: {
          settledByChallanNumber: challan.challanNumber,
        } as any,
        orderBy: { generatedAt: 'desc' }, // newest first → highest installmentNo = direct predecessor
      });

      if (ancestors.length > 0) {
        // The direct predecessor is the ancestor with the highest generatedAt (newest)
        const newLeader = ancestors[0];
        const deeperAncestors = ancestors.slice(1);

        // Restore the direct predecessor to PENDING/PARTIAL/OVERDUE
        const leaderStatus = Number((newLeader as any).paidAmount ?? 0) > 0
          ? 'PARTIAL'
          : (newLeader.dueDate && new Date() > new Date(newLeader.dueDate) ? 'OVERDUE' : 'PENDING');

        await tx.hostelChallan.update({
          where: { id: newLeader.id },
          data: {
            status: leaderStatus,
            settledByChallanNumber: null,
            settledAmount: 0,
            settledAt: null,
            paidAt: null,
          } as any,
        });

        // Re-point all deeper ancestors to the new leader
        if (deeperAncestors.length > 0) {
          await tx.hostelChallan.updateMany({
            where: { id: { in: deeperAncestors.map(a => a.id) } },
            data: {
              settledByChallanNumber: (newLeader as any).challanNumber,
            } as any,
          });
        }
      }

      // Step 2: Delete payment audit records
      await tx.hostelChallanPayment.deleteMany({ where: { hostelChallanId: id } });

      // Step 3: Delete the challan itself
      await tx.hostelChallan.delete({ where: { id } });
    });

    return { success: true };
  }

  // ── Payment recording with settlement propagation ─────────────────────────

  async recordHostelPayment(
    challanId: number,
    amount: number,
    paymentMode: string,
    paidDate: Date,
    remarks?: string,
  ) {
    const challan = await this.prisma.hostelChallan.findUnique({ where: { id: challanId } });
    if (!challan) throw new NotFoundException(`Hostel challan ${challanId} not found`);

    if (['PAID', 'VOID', 'SUPERSEDED', 'SETTLED'].includes(challan.status)) {
      throw new BadRequestException(
        `Cannot record payment on challan ${challan.challanNumber}: status is ${challan.status}.`,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      const currentPaid = Number(challan.paidAmount);
      const newPaidAmount = currentPaid + amount;
      const totalAmount = Number(challan.totalAmount);
      const isFullyPaid = newPaidAmount >= totalAmount;

      // 1. Update the leading challan
      const updatedChallan = await tx.hostelChallan.update({
        where: { id: challanId },
        data: {
          paidAmount: newPaidAmount,
          status: isFullyPaid ? 'PAID' : 'PARTIAL',
          ...(isFullyPaid ? { paidAt: paidDate } : {}),
        },
      });

      // 2. Create payment audit record
      await tx.hostelChallanPayment.create({
        data: {
          hostelChallanId: challanId,
          amount,
          paymentDate: paidDate,
          paymentMode,
          remarks: remarks ?? null,
        },
      });

      // 3. Settlement propagation — find all SUPERSEDED ancestors pointing to this challan
      const ancestors = await tx.hostelChallan.findMany({
        where: {
          settledByChallanNumber: challan.challanNumber,
          status: 'SUPERSEDED',
        } as any,
        orderBy: { generatedAt: 'asc' },
      });

      if (isFullyPaid) {
        // Full payment — unconditionally settle ALL ancestors
        for (const sc of ancestors) {
          await tx.hostelChallan.update({
            where: { id: sc.id },
            data: {
              status: 'SETTLED',
              settledAmount: (sc as any).totalAmount,
              settledAt: paidDate,
              paidAt: paidDate,
            } as any,
          });
        }
      } else {
        // Partial payment — distribute incrementally oldest-first
        let remaining = amount;
        for (const sc of ancestors) {
          if (remaining <= 0) break;
          const scTotal = Number(sc.totalAmount);
          const scPaid = Number(sc.paidAmount);
          const scSettled = Number((sc as any).settledAmount ?? 0);
          const needed = Math.max(0, scTotal - scPaid - scSettled);
          if (needed <= 0) continue;

          const apply = Math.min(remaining, needed);
          const newSettled = scSettled + apply;
          const isNowFullySettled = (scPaid + newSettled) >= scTotal;

          await tx.hostelChallan.update({
            where: { id: sc.id },
            data: {
              settledAmount: newSettled,
              settledAt: paidDate,
              ...(isNowFullySettled ? { status: 'SETTLED', paidAt: paidDate } : {}),
            } as any,
          });
          remaining -= apply;
        }
      }

      return updatedChallan;
    });
  }

  // ── Revenue aggregation ───────────────────────────────────────────────────

  async getHostelRevenue(startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const where: any = Object.keys(dateFilter).length > 0 ? { generatedAt: dateFilter } : {};

    // Total collected (PAID + PARTIAL only)
    const collectedAggr = await this.prisma.hostelChallan.aggregate({
      where: { ...where, status: { in: ['PAID', 'PARTIAL'] } },
      _sum: { paidAmount: true },
    });

    // Total outstanding (PENDING + PARTIAL only)
    const outstandingChallans = await this.prisma.hostelChallan.findMany({
      where: { ...where, status: { in: ['PENDING', 'PARTIAL'] } },
      select: { totalAmount: true, paidAmount: true },
    });
    const totalOutstanding = outstandingChallans.reduce(
      (sum, c) => sum + Math.max(0, Number(c.totalAmount) - Number(c.paidAmount)),
      0,
    );

    // Monthly breakdown — group by calendar month of generatedAt
    const paidChallans = await this.prisma.hostelChallan.findMany({
      where: { ...where, status: { in: ['PAID', 'PARTIAL'] } },
      select: { generatedAt: true, paidAmount: true },
      orderBy: { generatedAt: 'asc' },
    });

    const monthMap: Record<string, number> = {};
    for (const c of paidChallans) {
      const d = new Date(c.generatedAt);
      const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
      monthMap[key] = (monthMap[key] ?? 0) + Number(c.paidAmount);
    }
    const monthlyBreakdown = Object.entries(monthMap).map(([month, collected]) => ({ month, collected }));

    // Per-student breakdown — query registrations and their challans separately
    const registrations = await this.prisma.hostelRegistration.findMany({
      select: {
        id: true,
        studentId: true,
        externalName: true,
      },
    });

    // Fetch all non-VOID, non-SUPERSEDED challans grouped by registration
    const allChallans = await this.prisma.hostelChallan.findMany({
      where: { ...where, status: { notIn: ['VOID', 'SUPERSEDED'] } },
      select: { hostelRegNumber: true, totalAmount: true, paidAmount: true, status: true },
    });

    // Fetch student names for internal registrations
    const studentIds = registrations.map(r => r.studentId).filter((id): id is number => id !== null);
    const students = studentIds.length > 0
      ? await this.prisma.student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, fName: true, lName: true },
        })
      : [];
    const studentMap = new Map(students.map(s => [s.id, s]));

    const challansByReg = new Map<string, typeof allChallans>();
    for (const c of allChallans) {
      const arr = challansByReg.get(c.hostelRegNumber) ?? [];
      arr.push(c);
      challansByReg.set(c.hostelRegNumber, arr);
    }

    const perStudent = registrations.map(reg => {
      const student = reg.studentId ? studentMap.get(reg.studentId) : null;
      const name = student
        ? `${student.fName} ${student.lName || ''}`.trim()
        : reg.externalName || reg.id;
      const regChallans = challansByReg.get(reg.id) ?? [];
      const totalBilled = regChallans.reduce((s, c) => s + Number(c.totalAmount), 0);
      const totalPaid = regChallans
        .filter(c => ['PAID', 'PARTIAL'].includes(c.status))
        .reduce((s, c) => s + Number(c.paidAmount), 0);
      return {
        registrationId: reg.id,
        name,
        totalBilled,
        totalPaid,
        outstanding: Math.max(0, totalBilled - totalPaid),
      };
    });

    return {
      totalCollected: Number(collectedAggr._sum.paidAmount ?? 0),
      totalOutstanding,
      monthlyBreakdown,
      perStudent,
    };
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

  async getPaymentsByRegistration(registrationId: string) {
    return this.prisma.hostelChallanPayment.findMany({
      where: { 
        hostelChallan: { 
          hostelRegNumber: registrationId 
        } 
      },
      include: { 
        hostelChallan: {
          select: { challanNumber: true, month: true }
        } 
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async getHostelChallanHtml(id: number) {
    const challan = await this.prisma.hostelChallan.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: { include: { program: true } },
            section: true,
            program: true,
          },
        },
        hostelRegistration: true,
        heads: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!challan) throw new NotFoundException(`HostelChallan #${id} not found`);

    // Fetch HOSTEL type template, or fall back to default
    let template = await this.prisma.feeChallanTemplate.findFirst({
      where: { type: 'HOSTEL', isDefault: true },
    });
    
    if (!template) {
      template = await this.prisma.feeChallanTemplate.findFirst({
        where: { isDefault: true },
      });
    }

    if (!template) throw new BadRequestException('No suitable fee challan template found. Please configure a HOSTEL or default template.');

    const s = challan.student;
    const programName = s?.class?.program?.name || s?.program?.name || '';
    const className = s?.class?.name || '';
    const sectionName = s?.section?.name || '';
    const fullClassPath = s ? [programName, className, sectionName].filter(Boolean).join(' / ') : 'External Student';
    
    const name = s ? `${s.fName} ${s.lName || ''}`.trim() : (challan.hostelRegistration?.externalName || challan.hostelRegNumber || 'N/A');
    const guardian = s?.fatherOrguardian || challan.hostelRegistration?.externalGuardianName || '-';
    const studentOrRegNo = s?.rollNumber || challan.hostelRegNumber || '';

    let html = template.htmlContent;

    // Inject print styles
    html = html.replace('</head>', '<style>body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }</style></head>');

    // Basic replacements
    html = html.replace(/\{\{challanNumber\}\}/g, challan.challanNumber);
    html = html.replace(/\{\{issueDate\}\}/g, this.formatDate(challan.generatedAt));
    html = html.replace(/\{\{dueDate\}\}/g, this.formatDate(challan.dueDate));
    html = html.replace(/\{\{studentName\}\}/g, name);
    html = html.replace(/\{\{fatherName\}\}/g, guardian);
    html = html.replace(/\{\{class\}\}/g, fullClassPath);
    html = html.replace(/\{\{rollNo\}\}/g, studentOrRegNo);
    html = html.replace(/Student Id/g, 'Student Id / Registration Number');
    
    // Settings for late fee
    const settings = await this.prisma.instituteSettings.findFirst({ 
      select: { extraChallanLateFee: true } 
    });
    const lateFeeRate = Number(settings?.extraChallanLateFee ?? 0);

    // Remove Month / Installment row (optional for hostel, but usually cleaner)
    html = html.replace(/<tr[^>]*>\s*<td[^>]*>Month \/ Installment<\/td>[\s\S]*?<\/tr>/gi, '');
    html = html.replace(/Month \/ Installment/g, ''); 
    html = html.replace(/\{\{month\}\}/g, challan.month || '');
    html = html.replace(/\{\{installmentNo\}\}/g, '');

    // Replace hardcoded 150 with dynamic late fee rate
    html = html.replace(/Rs\.\s*150\s*Per\s*Day/gi, `Rs. ${lateFeeRate} Per Day`);
    html = html.replace(/150\s*Per\s*Day/gi, `${lateFeeRate} Per Day`);

    // Fee table
    const headsTotal = challan.heads.reduce((sum, h) => sum + Number(h.amount || 0), 0);
    const totalDue = headsTotal > 0 ? headsTotal : Number(challan.totalAmount || 0);
    const paidAmount = Number(challan.paidAmount || 0);
    const remainingBalance = Math.max(0, totalDue - paidAmount);
    const feeHeadsRows = challan.heads.map(h =>
      `<tr><td>${h.headName}</td><td>${Number(h.amount).toLocaleString()}</td></tr>`
    ).join('\n');

    html = html.replace(/\{\{Tuition Fee\}\}/g, '0');
    html = html.replace(/\{\{feeHeadsRows\}\}/g, feeHeadsRows);
    html = html.replace(/\{\{arrearsRows\}\}/g, '');
    html = html.replace(/\{\{arrears\}\}/g, '0');
    html = html.replace(/\{\{discount\}\}/g, '0');
    html = html.replace(/\{\{lateFee\}\}/g, '0');
    html = html.replace(/\{\{totalPayable\}\}/g, remainingBalance.toLocaleString());
    html = html.replace(/\{\{totalInWords\}\}/g, `<strong>${remainingBalance.toLocaleString()} Rupees Only</strong>`);

    const paidDisplay = paidAmount > 0 ? `- ${paidAmount.toLocaleString()}` : '0';
    const paidRowHtml = `
      <tr style="color: #166534; background-color: #f0fdf4; font-weight: 600; font-size: 11px;">
        <td>Paid Amount / Advance Credits</td>
        <td>${paidDisplay}</td>
      </tr>
      <tr style="font-weight: 700; border-top: 1px solid #e2e8f0;">
        <td>Remaining Balance</td>
        <td>${remainingBalance.toLocaleString()}</td>
      </tr>
    `;
    html = html.replace(/\{\{paidRow\}\}/g, paidRowHtml);

    const isFullyPaid = challan.status === 'PAID' || challan.status === 'SETTLED' || remainingBalance <= 0;
    if (isFullyPaid) {
      const latestPayment = challan.payments?.[0];
      const paidRemarksStyle = 'background-color: #dcfce7; color: #14532d; font-weight: bold;';
      const remarks = latestPayment?.remarks || challan.remarks || 'FULLY PAID / SETTLED';
      const paidAt = latestPayment?.paymentDate ? this.formatDate(latestPayment.paymentDate) : this.formatDate(challan.paidAt || challan.generatedAt);
      const paidRowsHtml = `
        <tr class="paid-at-row"><td style="${paidRemarksStyle}">Paid At</td><td style="${paidRemarksStyle}">${paidAt}</td></tr>
        <tr class="paid-remarks-row">
          <td style="${paidRemarksStyle}; vertical-align: top;">Remarks</td>
          <td style="${paidRemarksStyle}; white-space: normal; text-align: left; line-height: 1.35;">${remarks}</td>
        </tr>
      `;
      const hideTotalRowStyle = '<style>.total-row { display: none !important; }</style>';
      html = html.includes('</head>') ? html.replace('</head>', `${hideTotalRowStyle}</head>`) : hideTotalRowStyle + html;
      html = html.replace(/<tr class="late-fee-row">[\s\S]*?<\/tr>/gi, paidRowsHtml);
      html = html.replace(
        /<tr[^>]*>\s*<td[^>]*>\s*Late Fee Fine after due date\s*<\/td>\s*<td[^>]*>\s*Rs\.?\s*\d+[\s\S]*?Per\s+Day\s*<\/td>\s*<\/tr>/gi,
        paidRowsHtml,
      );
      html = html.replace(
        /<div class="signatures">[\s\S]*?<div class="sig-label">Depositor Signature<\/div>\s*<\/div>\s*<\/div>/gi,
        `<div class="paid-system-note" style="padding: 8px 10px 5px 10px; margin-top: 4px; font-size: 8px; line-height: 1.35; color: #475569; font-style: italic;">* This paid challan is system generated and does not require bank/account officer or depositor signatures.</div>`
      );
    }

    // History (Empty for hostel challans)
    html = html.replace(/\{\{paymentHistoryMonths\}\}/g, '');
    html = html.replace(/\{\{paymentHistoryTotals\}\}/g, '');
    html = html.replace(/\{\{paymentHistoryPaid\}\}/g, '');
    html = html.replace(/\{\{paymentDetailsRow\}\}/g, '');

    return html;
  }

  private formatDate(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
}
