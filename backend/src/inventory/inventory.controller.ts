import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';

import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

// DTOs
class CreateInventoryDto {
  @IsString()
  itemName: string;

  @IsString()
  category: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  totalValue: number;

  @IsString()
  purchaseDate: string;

  @IsString()
  supplier: string;

  @IsString()
  condition: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  assignedToName?: string;

  @IsOptional()
  @IsString()
  assignedDate?: string;

  @IsOptional()
  @IsNumber()
  maintenanceCost?: number;

  @IsOptional()
  @IsString()
  lastMaintenanceDate?: string;

  @IsOptional()
  @IsString()
  warrantyExpiry?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  itemName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  totalValue?: number;

  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  assignedToName?: string;

  @IsOptional()
  @IsString()
  assignedDate?: string;

  @IsOptional()
  @IsNumber()
  maintenanceCost?: number;

  @IsOptional()
  @IsString()
  lastMaintenanceDate?: string;

  @IsOptional()
  @IsString()
  warrantyExpiry?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class CreateExpenseDto {
  @IsString()
  inventoryItemId: string;

  @IsString()
  expenseType: string;

  @IsNumber()
  amount: number;

  @IsString()
  date: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  vendor?: string;
}

class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  expenseType?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  vendor?: string;
}

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ==================== SCHOOL INVENTORY ENDPOINTS ====================

  @Get('items')
  async getAllInventory(
    @Query('category') category?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('condition') condition?: string,
  ) {
    return this.inventoryService.findAllInventory({
      category,
      assignedTo,
      condition,
    });
  }

  @Get('items/:id')
  async getInventoryById(@Param('id') id: string) {
    return this.inventoryService.findOneInventory(id);
  }

  @Post('items')
  async createInventory(@Body() dto: CreateInventoryDto) {
    return this.inventoryService.createInventory({
      itemName: dto.itemName,
      category: dto.category,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      totalValue: dto.totalValue,
      purchaseDate: new Date(dto.purchaseDate),
      supplier: dto.supplier,
      condition: dto.condition,
      location: dto.location,
      assignedTo: dto.assignedTo,
      assignedToName: dto.assignedToName,
      assignedDate: dto.assignedDate ? new Date(dto.assignedDate) : undefined,
      maintenanceCost: dto.maintenanceCost,
      lastMaintenanceDate: dto.lastMaintenanceDate
        ? new Date(dto.lastMaintenanceDate)
        : undefined,
      warrantyExpiry: dto.warrantyExpiry
        ? new Date(dto.warrantyExpiry)
        : undefined,
      description: dto.description,
    });
  }

  @Patch('items/:id')
  async updateInventory(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    const updateData: any = {};

    if (dto.itemName !== undefined) updateData.itemName = dto.itemName;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.quantity !== undefined) updateData.quantity = dto.quantity;
    if (dto.unitPrice !== undefined) updateData.unitPrice = dto.unitPrice;
    if (dto.totalValue !== undefined) updateData.totalValue = dto.totalValue;
    if (dto.purchaseDate !== undefined)
      updateData.purchaseDate = new Date(dto.purchaseDate);
    if (dto.supplier !== undefined) updateData.supplier = dto.supplier;
    if (dto.condition !== undefined) updateData.condition = dto.condition;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.assignedTo !== undefined) updateData.assignedTo = dto.assignedTo;
    if (dto.assignedToName !== undefined)
      updateData.assignedToName = dto.assignedToName;
    if (dto.assignedDate !== undefined)
      updateData.assignedDate = dto.assignedDate
        ? new Date(dto.assignedDate)
        : null;
    if (dto.maintenanceCost !== undefined)
      updateData.maintenanceCost = dto.maintenanceCost;
    if (dto.lastMaintenanceDate !== undefined)
      updateData.lastMaintenanceDate = dto.lastMaintenanceDate
        ? new Date(dto.lastMaintenanceDate)
        : null;
    if (dto.warrantyExpiry !== undefined)
      updateData.warrantyExpiry = dto.warrantyExpiry
        ? new Date(dto.warrantyExpiry)
        : null;
    if (dto.description !== undefined) updateData.description = dto.description;

    return this.inventoryService.updateInventory(id, updateData);
  }

  @Delete('items/:id')
  async deleteInventory(@Param('id') id: string) {
    return this.inventoryService.deleteInventory(id);
  }

  // ==================== INVENTORY EXPENSE ENDPOINTS ====================

  @Get('expenses')
  async getAllExpenses() {
    return this.inventoryService.findAllExpenses();
  }

  @Get('expenses/item/:itemId')
  async getExpensesByItemId(@Param('itemId') itemId: string) {
    return this.inventoryService.findExpensesByInventoryId(itemId);
  }

  @Post('expenses')
  async createExpense(@Body() dto: CreateExpenseDto) {
    return this.inventoryService.createExpense({
      inventoryItem: {
        connect: { id: dto.inventoryItemId },
      },
      expenseType: dto.expenseType,
      amount: dto.amount,
      date: new Date(dto.date),
      description: dto.description,
      vendor: dto.vendor,
    });
  }

  @Patch('expenses/:id')
  async updateExpense(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    const updateData: any = {};

    if (dto.expenseType !== undefined) updateData.expenseType = dto.expenseType;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.date !== undefined) updateData.date = new Date(dto.date);
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.vendor !== undefined) updateData.vendor = dto.vendor;

    return this.inventoryService.updateExpense(id, updateData);
  }

  @Delete('expenses/:id')
  async deleteExpense(@Param('id') id: string) {
    return this.inventoryService.deleteExpense(id);
  }
}
