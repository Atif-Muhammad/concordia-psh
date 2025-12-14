import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAccGuard } from '../common/guards/jwt-access.guard';

@Controller('dashboard')
@UseGuards(JwtAccGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }
}
