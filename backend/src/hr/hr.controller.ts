import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { EmployeeDto } from './dtos/employee.dot';
import { JwtAccGuard } from 'src/common/guards/jwt-access.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('get/employees')
  async getEmployees(@Query('dept') dept: string) {
    return await this.hrService.fetchEmpls(dept);
  }
  @Post('create/employee')
  async createEmpl(@Body() payload: EmployeeDto) {
    return await this.hrService.createEmp(payload);
  }

  @Patch('update/employee')
  async updateEmpl(@Query('id') id: string, @Body() payload: EmployeeDto) {
    return await this.hrService.updateEmp(Number(id), payload);
  }

  @Get('get/employees-by-dept')
  async getEmployeesByDept() {
    return await this.hrService.getEmployeesByDept();
  }

  @Get('payroll-settings')
  async getPayrollSettings() {
    return await this.hrService.getPayrollSettings();
  }

  @Patch('payroll-settings')
  async updatePayrollSettings(@Body() payload: any) {
    return await this.hrService.updatePayrollSettings(payload);
  }

  @Get('payroll-sheet')
  async getPayrollSheet(
    @Query('month') month: string,
    @Query('type') type: 'teacher' | 'employee',
  ) {
    return await this.hrService.getPayrollSheet(month, type);
  }

  @Get('payroll-history')
  async getPayrollHistory(
    @Query('staffId') staffId: string,
    @Query('type') type: 'teacher' | 'employee',
  ) {
    return await this.hrService.getPayrollHistory(Number(staffId), type);
  }

  @Post('payroll')
  async upsertPayroll(@Body() payload: any) {
    return await this.hrService.upsertPayroll(payload);
  }

  @Get('leave-sheet')
  async getLeaveSheet(
    @Query('month') month: string,
    @Query('type') type: 'teacher' | 'employee',
  ) {
    return await this.hrService.getLeaveSheet(month, type);
  }

  @Post('leave')
  async upsertLeave(@Body() payload: any) {
    return await this.hrService.upsertLeave(payload);
  }

  @Get('employee-attendance')
  async getEmployeeAttendance(@Query('date') date: string) {
    return await this.hrService.getEmployeeAttendance(new Date(date));
  }

  @UseGuards(JwtAccGuard)
  @Post('employee-attendance')
  async markEmployeeAttendance(
    @Req() req: { user: { id: string } },
    @Body()
    payload: {
      employeeId: number;
      date: string;
      status: string;
      notes?: string;
    },
  ) {
    const adminId = req.user?.id ? Number(req.user.id) : null;
    return await this.hrService.markEmployeeAttendance({
      ...payload,
      markedBy: adminId,
    });
  }

  @Post('holidays')
  async createHoliday(@Body() payload: any) {
    return await this.hrService.createHoliday(payload);
  }

  @Get('holidays')
  async getHolidays() {
    return await this.hrService.getHolidays();
  }

  @Delete('holidays')
  async deleteHoliday(@Query('id') id: string) {
    return await this.hrService.deleteHoliday(Number(id));
  }

  @Post('advance-salary')
  async createAdvanceSalary(@Body() payload: any) {
    return await this.hrService.createAdvanceSalary(payload);
  }

  @Get('advance-salary')
  async getAdvanceSalaries(
    @Query('month') month?: string,
    @Query('type') type?: 'teacher' | 'employee',
  ) {
    return await this.hrService.getAdvanceSalaries(month, type);
  }

  @Patch('advance-salary')
  async updateAdvanceSalary(@Query('id') id: string, @Body() payload: any) {
    return await this.hrService.updateAdvanceSalary(Number(id), payload);
  }

  @Delete('advance-salary')
  async deleteAdvanceSalary(@Query('id') id: string) {
    return await this.hrService.deleteAdvanceSalary(Number(id));
  }

  // summary
  @Get('attendance-summary')
  async getAttendanceSummary(
    @Query('month') month: string,
    @Query('staffId') staffId: number,
    @Query('type') type: string,
  ) {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of the month
    if (type === 'TEACHER') {
      return await this.hrService.getTeacherAttendanceSummary(
        staffId,
        startDate,
        endDate,
      );
    }
  }

  // Payroll Templates
  @Post('payroll-template')
  async createPayrollTemplate(@Body() payload: any) {
    return await this.hrService.createPayrollTemplate(payload);
  }

  @Get('payroll-template')
  async getPayrollTemplates() {
    return await this.hrService.getPayrollTemplates();
  }

  @Patch('payroll-template')
  async updatePayrollTemplate(@Query('id') id: string, @Body() payload: any) {
    return await this.hrService.updatePayrollTemplate(Number(id), payload);
  }

  @Delete('payroll-template')
  async deletePayrollTemplate(@Query('id') id: string) {
    return await this.hrService.deletePayrollTemplate(Number(id));
  }
}
