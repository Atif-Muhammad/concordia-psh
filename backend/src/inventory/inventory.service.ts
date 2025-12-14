import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ==================== SCHOOL INVENTORY OPERATIONS ====================

  async findAllInventory(params?: {
    category?: string;
    assignedTo?: string;
    condition?: string;
  }) {
    const where: Prisma.SchoolInventoryWhereInput = {};

    if (params?.category) {
      where.category = params.category;
    }
    if (params?.assignedTo) {
      where.assignedTo = params.assignedTo;
    }
    if (params?.condition) {
      where.condition = params.condition;
    }

    return this.prisma.schoolInventory.findMany({
      where,
      include: {
        expenses: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOneInventory(id: string) {
    return this.prisma.schoolInventory.findUnique({
      where: { id },
      include: {
        expenses: {
          orderBy: {
            date: 'desc',
          },
        },
      },
    });
  }

  async createInventory(data: Prisma.SchoolInventoryCreateInput) {
    return this.prisma.schoolInventory.create({
      data,
      include: {
        expenses: true,
      },
    });
  }

  async updateInventory(id: string, data: Prisma.SchoolInventoryUpdateInput) {
    return this.prisma.schoolInventory.update({
      where: { id },
      data,
      include: {
        expenses: true,
      },
    });
  }

  async deleteInventory(id: string) {
    return this.prisma.schoolInventory.delete({
      where: { id },
    });
  }

  // ==================== INVENTORY EXPENSE OPERATIONS ====================

  async findAllExpenses() {
    return this.prisma.inventoryExpense.findMany({
      include: {
        inventoryItem: {
          select: {
            itemName: true,
            category: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findExpensesByInventoryId(inventoryItemId: string) {
    return this.prisma.inventoryExpense.findMany({
      where: { inventoryItemId },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async createExpense(data: Prisma.InventoryExpenseCreateInput) {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Create the expense
      const expense = await prisma.inventoryExpense.create({
        data,
        include: {
          inventoryItem: {
            select: {
              itemName: true,
            },
          },
        },
      });

      // 2. Update the inventory item's maintenance cost and date
      if (data.inventoryItem?.connect?.id) {
        const itemId = data.inventoryItem.connect.id;
        const item = await prisma.schoolInventory.findUnique({
          where: { id: itemId },
        });

        if (item) {
          await prisma.schoolInventory.update({
            where: { id: item.id },
            data: {
              maintenanceCost: (item.maintenanceCost || 0) + data.amount,
              lastMaintenanceDate: new Date(data.date),
            },
          });
        }
      }

      return expense;
    });
  }

  async updateExpense(id: string, data: Prisma.InventoryExpenseUpdateInput) {
    return this.prisma.inventoryExpense.update({
      where: { id },
      data,
      include: {
        inventoryItem: {
          select: {
            itemName: true,
          },
        },
      },
    });
  }

  async deleteExpense(id: string) {
    return this.prisma.inventoryExpense.delete({
      where: { id },
    });
  }
}
