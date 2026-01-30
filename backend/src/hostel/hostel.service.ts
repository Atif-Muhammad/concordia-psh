import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRegistrationDto } from './dtos/create-registration.dto';
import { UpdateRegistrationDto } from './dtos/update-registration.dto';

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

    return this.prisma.hostelRegistration.create({
      data: {
        studentId: dto.studentId ? Number(dto.studentId) : undefined,
        externalName: dto.externalName,
        externalInstitute: dto.externalInstitute,
        externalGuardianName: dto.externalGuardianName,
        externalGuardianNumber: dto.externalGuardianNumber,
        hostelName: dto.hostelName,
        registrationDate: new Date(dto.registrationDate),
        status: dto.status || 'active',
      },
      include: {
        student: {
          select: {
            id: true,
            fName: true,
            mName: true,
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
            mName: true,
            lName: true,
            rollNumber: true,
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
            mName: true,
            lName: true,
            rollNumber: true,
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
      },
      include: {
        student: {
          select: {
            id: true,
            fName: true,
            mName: true,
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
}
