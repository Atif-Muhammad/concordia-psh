import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAccGuard } from '../common/guards/jwt-access.guard';

@Controller('dashboard')
@UseGuards(JwtAccGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('stats')
  getDashboardStats(@Query() filters: { month?: string; year?: string }) {
    return this.dashboardService.getDashboardStats(filters);
  }
}
