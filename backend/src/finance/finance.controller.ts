import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateClosingDto } from './dto/create-closing.dto';
import { JwtAccGuard } from '../common/guards/jwt-access.guard';

@Controller('finance')
@UseGuards(JwtAccGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ==================== INCOME ====================
  @Post('income')
  createIncome(@Body() createIncomeDto: CreateIncomeDto) {
    return this.financeService.createIncome(createIncomeDto);
  }

  @Get('income')
  getIncomes(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('category') category?: string,
  ) {
    return this.financeService.getIncomes({ dateFrom, dateTo, category });
  }

  @Patch('income/:id')
  updateIncome(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIncomeDto: UpdateIncomeDto,
  ) {
    return this.financeService.updateIncome(id, updateIncomeDto);
  }

  @Delete('income/:id')
  deleteIncome(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.deleteIncome(id);
  }

  // ==================== EXPENSE ====================
  @Post('expense')
  createExpense(@Body() createExpenseDto: CreateExpenseDto, @Req() req: any) {
    return this.financeService.createExpense(createExpenseDto, req.user);
  }

  @Get('expense')
  getExpenses(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('category') category?: string,
    @Query('subCategory') subCategory?: string,
    @Query('status') status?: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED',
  ) {
    return this.financeService.getExpenses({ dateFrom, dateTo, category, subCategory, status });
  }

  @Patch('expense/:id')
  updateExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.financeService.updateExpense(id, updateExpenseDto);
  }

  @Delete('expense/:id')
  deleteExpense(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.deleteExpense(id);
  }

  @Patch('expense/:id/approve')
  approveExpense(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.financeService.approveExpense(id, req.user);
  }

  @Patch('expense/:id/reject')
  rejectExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body('rejectionReason') rejectionReason: string | undefined,
    @Req() req: any,
  ) {
    return this.financeService.rejectExpense(id, req.user, rejectionReason);
  }

  // ==================== CLOSING ====================
  @Post('closing')
  createClosing(@Body() createClosingDto: CreateClosingDto) {
    return this.financeService.createClosing(createClosingDto);
  }

  @Get('closing')
  getClosings(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('type') type?: string,
  ) {
    return this.financeService.getClosings({ dateFrom, dateTo, type });
  }

  @Patch('closing/:id')
  updateClosing(@Param('id', ParseIntPipe) id: number, @Body() updateDto: any) {
    return this.financeService.updateClosing(id, updateDto);
  }

  @Delete('closing/:id')
  deleteClosing(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.deleteClosing(id);
  }

  // ==================== DASHBOARD STATS ====================
  @Get('dashboard-stats')
  getDashboardStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeService.getDashboardStats(dateFrom, dateTo);
  }

  @Get('reports/analytics')
  getReportsAnalytics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.financeService.getReportsAnalytics({ dateFrom, dateTo, groupBy });
  }
}
