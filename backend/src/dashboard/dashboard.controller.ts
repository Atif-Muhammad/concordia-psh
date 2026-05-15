import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAccGuard } from '../common/guards/jwt-access.guard';

@Controller('dashboard')
@UseGuards(JwtAccGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** Full stats (legacy — kept for backward compat) */
  @Get('stats')
  getDashboardStats(@Query() filters: { month?: string; year?: string; sessionId?: string }) {
    return this.dashboardService.getDashboardStats(filters);
  }

  /** Students section */
  @Get('students')
  getStudents(@Query() filters: { sessionId?: string }) {
    return this.dashboardService.getStudentsSection(filters);
  }

  /** Fees section */
  @Get('fees')
  getFees(@Query() filters: { sessionId?: string }) {
    return this.dashboardService.getFeesSection(filters);
  }

  /** Attendance section */
  @Get('attendance')
  getAttendance(@Query() filters: { sessionId?: string }) {
    return this.dashboardService.getAttendanceSection(filters);
  }

  /** Staff section */
  @Get('staff')
  getStaff() {
    return this.dashboardService.getStaffSection();
  }

  /** Finance section */
  @Get('finance')
  getFinance(@Query() filters: { sessionId?: string }) {
    return this.dashboardService.getFinanceSection(filters);
  }

  /** Charts section */
  @Get('charts')
  getCharts(@Query() filters: { sessionId?: string }) {
    return this.dashboardService.getChartsSection(filters);
  }
}
