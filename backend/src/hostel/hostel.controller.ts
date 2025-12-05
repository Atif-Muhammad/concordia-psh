import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { HostelService } from './hostel.service';
import { CreateRegistrationDto } from './dtos/create-registration.dto';
import { UpdateRegistrationDto } from './dtos/update-registration.dto';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { AllocateRoomDto } from './dtos/allocate-room.dto';
import { CreateExpenseDto } from './dtos/create-expense.dto';
import { UpdateExpenseDto } from './dtos/update-expense.dto';
import { CreateInventoryDto } from './dtos/create-inventory.dto';
import { UpdateInventoryDto } from './dtos/update-inventory.dto';

@Controller('hostel')
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // REGISTRATION ENDPOINTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  @Post('registrations')
  createRegistration(@Body() dto: CreateRegistrationDto) {
    return this.hostelService.createRegistration(dto);
  }

  @Get('registrations')
  findAllRegistrations() {
    return this.hostelService.findAllRegistrations();
  }

  @Get('registrations/:id')
  findOneRegistration(@Param('id') id: string) {
    return this.hostelService.findOneRegistration(id);
  }

  @Patch('registrations/:id')
  updateRegistration(
    @Param('id') id: string,
    @Body() dto: UpdateRegistrationDto,
  ) {
    return this.hostelService.updateRegistration(id, dto);
  }

  @Delete('registrations/:id')
  deleteRegistration(@Param('id') id: string) {
    return this.hostelService.deleteRegistration(id);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ROOMS & ALLOCATION ENDPOINTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  @Post('rooms')
  createRoom(@Body() dto: CreateRoomDto) {
    return this.hostelService.createRoom(dto);
  }

  @Get('rooms')
  findAllRooms() {
    return this.hostelService.findAllRooms();
  }

  @Get('rooms/:id')
  findOneRoom(@Param('id') id: string) {
    return this.hostelService.findOneRoom(id);
  }

  @Patch('rooms/:id')
  updateRoom(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.hostelService.updateRoom(id, dto);
  }

  @Delete('rooms/:id')
  deleteRoom(@Param('id') id: string) {
    return this.hostelService.deleteRoom(id);
  }

  @Post('allocations')
  allocateRoom(@Body() dto: AllocateRoomDto) {
    return this.hostelService.allocateRoom(dto);
  }

  @Delete('allocations/:id')
  deallocateStudent(@Param('id') id: string) {
    return this.hostelService.deallocateStudent(id);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EXPENSES ENDPOINTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  @Post('expenses')
  createExpense(@Body() dto: CreateExpenseDto) {
    return this.hostelService.createExpense(dto);
  }

  @Get('expenses')
  findAllExpenses() {
    return this.hostelService.findAllExpenses();
  }

  @Get('expenses/:id')
  findOneExpense(@Param('id') id: string) {
    return this.hostelService.findOneExpense(id);
  }

  @Patch('expenses/:id')
  updateExpense(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.hostelService.updateExpense(id, dto);
  }

  @Delete('expenses/:id')
  deleteExpense(@Param('id') id: string) {
    return this.hostelService.deleteExpense(id);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INVENTORY ENDPOINTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  @Post('inventory')
  createInventory(@Body() dto: CreateInventoryDto) {
    return this.hostelService.createInventory(dto);
  }

  @Get('inventory')
  findAllInventory() {
    return this.hostelService.findAllInventory();
  }

  @Get('inventory/:id')
  findOneInventory(@Param('id') id: string) {
    return this.hostelService.findOneInventory(id);
  }

  @Patch('inventory/:id')
  updateInventory(@Param('id') id: string, @Body() dto: UpdateInventoryDto) {
    return this.hostelService.updateInventory(id, dto);
  }

  @Delete('inventory/:id')
  deleteInventory(@Param('id') id: string) {
    return this.hostelService.deleteInventory(id);
  }
}
