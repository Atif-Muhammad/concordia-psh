import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
import { CreateFeePaymentDto } from './dtos/create-fee-payment.dto';
import { CreateHostelChallanDto } from './dtos/create-hostel-challan.dto';
import { UpdateHostelChallanDto } from './dtos/update-hostel-challan.dto';

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

  @Get('registrations/by-student/:studentId')
  findRegistrationByStudentId(@Param('studentId') studentId: string) {
    return this.hostelService.findRegistrationByStudentId(Number(studentId));
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

  @Post('registrations/:id/payments')
  createFeePayment(
    @Param('id') id: string,
    @Body() dto: CreateFeePaymentDto,
  ) {
    return this.hostelService.createFeePayment(id, dto);
  }

  @Get('registrations/:id/payments')
  getFeePayments(@Param('id') id: string) {
    return this.hostelService.getFeePayments(id);
  }

  @Delete('registrations/:id/payments/:paymentId')
  deleteFeePayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.hostelService.deleteFeePayment(id, +paymentId);
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STUDENT HOSTEL LOOKUP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  @Get('room/by-student/:studentId')
  findRoomByStudentId(@Param('studentId') studentId: string) {
    return this.hostelService.findRoomByStudentId(Number(studentId));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EXTERNAL CHALLAN ENDPOINTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  @Post('external-challans')
  createExternalChallan(@Body() data: any) {
    return this.hostelService.createExternalChallan(data);
  }

  @Get('external-challans')
  findAllExternalChallans() {
    return this.hostelService.findAllExternalChallans();
  }

  @Get('external-challans/by-registration/:registrationId')
  findExternalChallansByRegistration(@Param('registrationId') registrationId: string) {
    return this.hostelService.findExternalChallansByRegistration(registrationId);
  }

  @Patch('external-challans/:id')
  updateExternalChallan(@Param('id') id: string, @Body() data: any) {
    return this.hostelService.updateExternalChallan(Number(id), data);
  }

  @Delete('external-challans/:id')
  deleteExternalChallan(@Param('id') id: string) {
    return this.hostelService.deleteExternalChallan(Number(id));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HOSTEL CHALLAN ENDPOINTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  @Post('challans')
  createHostelChallan(@Body() dto: CreateHostelChallanDto) {
    return this.hostelService.createHostelChallan(dto);
  }

  @Get('challans/by-registration/:registrationId')
  getHostelChallans(@Param('registrationId') registrationId: string) {
    return this.hostelService.getHostelChallans(registrationId);
  }

  @Patch('challans/:id')
  updateHostelChallan(@Param('id') id: string, @Body() dto: UpdateHostelChallanDto) {
    return this.hostelService.updateHostelChallan(Number(id), dto);
  }

  @Delete('challans/:id')
  deleteHostelChallan(@Param('id') id: string) {
    return this.hostelService.deleteHostelChallan(Number(id));
  }

  @Get('registrations/search')
  searchRegistrations(@Query('q') q: string) {
    return this.hostelService.searchRegistrations(q || '');
  }
}

