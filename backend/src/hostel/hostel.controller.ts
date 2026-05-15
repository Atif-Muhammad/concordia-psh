import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Header,
  HttpCode,
  HttpStatus,
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
import { RecordHostelPaymentDto } from './dtos/record-hostel-payment.dto';

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
  findAllRegistrations(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: 'internal' | 'external' | 'all',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hostelService.findAllRegistrations({
      search,
      status,
      type,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
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

  @Patch('registrations/:id/terminate')
  terminateRegistration(@Param('id') id: string, @Body('reason') reason: string) {
    return this.hostelService.terminateRegistration(id, reason);
  }

  @Patch('registrations/:id/withdraw')
  withdrawRegistration(@Param('id') id: string) {
    return this.hostelService.withdrawRegistration(id);
  }

  @Patch('registrations/:id/readmit')
  readmitRegistration(@Param('id') id: string) {
    return this.hostelService.readmitRegistration(id);
  }

  @Get('registrations/:id/history')
  getRegistrationHistory(@Param('id') id: string) {
    return this.hostelService.getRegistrationHistory(id);
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
  findAllExpenses(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.hostelService.findAllExpenses(startDate, endDate);
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
  // HOSTEL CHALLAN ENDPOINTS (Modular)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  @Post('challans')
  createHostelChallan(@Body() dto: CreateHostelChallanDto) {
    return this.hostelService.createHostelChallan(dto);
  }

  @Get('challans')
  getHostelChallans(
    @Query('registrationId') registrationId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hostelService.getHostelChallans({
      registrationId,
      status,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
  }

  @Patch('challans/:id')
  updateHostelChallan(@Param('id') id: string, @Body() dto: UpdateHostelChallanDto) {
    return this.hostelService.updateHostelChallan(Number(id), dto);
  }

  @Delete('challans/:id')
  deleteHostelChallan(@Param('id') id: string) {
    return this.hostelService.deleteHostelChallan(Number(id));
  }

  @Get('registrations-search')
  searchRegistrations(@Query('q') q: string) {
    return this.hostelService.searchRegistrations(q || '');
  }

  @Get('registrations/:id/payments')
  getPaymentsByRegistration(@Param('id') id: string) {
    return this.hostelService.getPaymentsByRegistration(id);
  }

  @Get('challans/:id/print')
  @Header('Content-Type', 'text/html')
  async printHostelChallan(@Param('id') id: string) {
    return this.hostelService.getHostelChallanHtml(Number(id));
  }

  // ── Payment recording ─────────────────────────────────────────────────────

  @Post('challans/:id/payment')
  recordHostelPayment(
    @Param('id') id: string,
    @Body() dto: RecordHostelPaymentDto,
  ) {
    return this.hostelService.recordHostelPayment(
      Number(id),
      dto.amount,
      dto.paymentMode,
      new Date(dto.paidDate),
      dto.remarks,
    );
  }

  // ── Revenue ───────────────────────────────────────────────────────────────

  @Get('revenue')
  getHostelRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.hostelService.getHostelRevenue(startDate, endDate);
  }

  @Get('reports/analytics')
  getHostelReportsAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: 'month' | 'week',
  ) {
    return this.hostelService.getHostelReportsAnalytics(startDate, endDate, groupBy || 'month');
  }

  // ── Deprecated: legacy simple payment route — returns 410 Gone ───────────

  @Post('registrations/:id/payments')
  @HttpCode(HttpStatus.GONE)
  deprecatedCreateFeePayment() {
    return {
      message: 'This endpoint is deprecated. Use POST /hostel/challans/:id/payment instead.',
      statusCode: 410,
    };
  }
}

