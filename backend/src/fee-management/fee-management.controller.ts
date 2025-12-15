import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FeeManagementService } from './fee-management.service';
import { CreateFeeHeadDto } from './dtos/create-fee-head.dto';
import { UpdateFeeHeadDto } from './dtos/update-fee-head.dto';
import { CreateFeeStructureDto } from './dtos/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dtos/update-fee-structure.dto';
import { CreateFeeChallanDto } from './dtos/create-fee-challan.dto';
import { UpdateFeeChallanDto } from './dtos/update-fee-challan.dto';
import { FeeReportQueryDto } from './dtos/fee-report-query.dto';

@Controller('fee-management')
export class FeeManagementController {
  constructor(private readonly feeService: FeeManagementService) { }

  // Fee Heads
  @Post('head/create')
  async createFeeHead(@Body() payload: CreateFeeHeadDto) {
    return await this.feeService.createFeeHead(payload);
  }

  @Get('head/get/all')
  async getFeeHeads() {
    return await this.feeService.getFeeHeads();
  }

  @Patch('head/update')
  async updateFeeHead(
    @Query('id') id: string,
    @Body() payload: UpdateFeeHeadDto,
  ) {
    return await this.feeService.updateFeeHead(Number(id), payload);
  }

  @Delete('head/delete')
  async deleteFeeHead(@Query('id') id: string) {
    return await this.feeService.deleteFeeHead(Number(id));
  }

  // Fee Structures
  @Post('structure/create')
  async createFeeStructure(@Body() payload: CreateFeeStructureDto) {
    return await this.feeService.createFeeStructure(payload);
  }

  @Get('structure/get/all')
  async getFeeStructures() {
    return await this.feeService.getFeeStructures();
  }

  @Patch('structure/update')
  async updateFeeStructure(
    @Query('id') id: string,
    @Body() payload: UpdateFeeStructureDto,
  ) {
    return await this.feeService.updateFeeStructure(Number(id), payload);
  }

  @Delete('structure/delete')
  async deleteFeeStructure(@Query('id') id: string) {
    return await this.feeService.deleteFeeStructure(Number(id));
  }

  // Reports

  @Get('reports/revenue-over-time')
  async getRevenueOverTime(@Query() query: FeeReportQueryDto) {
    return await this.feeService.getRevenueOverTime(query.period as any);
  }

  @Get('reports/class-collection')
  async getClassCollectionStats(@Query() query: FeeReportQueryDto) {
    return await this.feeService.getClassCollectionStats(query.period as any);
  }

  @Get('reports/collection-summary')
  async getFeeCollectionSummary(@Query() query: FeeReportQueryDto) {
    return await this.feeService.getFeeCollectionSummary(query.period as any);
  }

  // Fee Challans
  @Post('challan/create')
  async createFeeChallan(@Body() payload: CreateFeeChallanDto) {
    return await this.feeService.createFeeChallan(payload);
  }

  @Get('challan/get/all')
  async getFeeChallans(
    @Query('studentId') studentId?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return await this.feeService.getFeeChallans(
      studentId ? Number(studentId) : undefined,
      search,
      Number(page),
      Number(limit),
    );
  }

  @Patch('challan/update')
  async updateFeeChallan(
    @Query('id') id: string,
    @Body() payload: UpdateFeeChallanDto,
  ) {
    return await this.feeService.updateFeeChallan(Number(id), payload);
  }

  @Delete('challan/delete')
  async deleteFeeChallan(@Query('id') id: string) {
    return await this.feeService.deleteFeeChallan(Number(id));
  }

  @Get('challan/history')
  async getStudentFeeHistory(@Query('studentId') studentId: string) {
    return await this.feeService.getStudentFeeHistory(Number(studentId));
  }

  @Get('student/summary')
  async getStudentFeeSummary(@Query('studentId') studentId: string) {
    return await this.feeService.getStudentFeeSummary(Number(studentId));
  }

  @Get('student/arrears')
  async getStudentArrears(@Query('studentId') studentId: string) {
    return await this.feeService.getStudentArrears(Number(studentId));
  }

  // Fee Challan Templates
  @Post('template/create')
  async createFeeChallanTemplate(@Body() payload: any) {
    return await this.feeService.createFeeChallanTemplate(payload);
  }

  @Get('template/get/all')
  async getFeeChallanTemplates() {
    return await this.feeService.getFeeChallanTemplates();
  }

  @Get('template/get/by-id')
  async getFeeChallanTemplateById(@Query('id') id: string) {
    return await this.feeService.getFeeChallanTemplateById(Number(id));
  }

  @Patch('template/update')
  async updateFeeChallanTemplate(
    @Query('id') id: string,
    @Body() payload: any,
  ) {
    return await this.feeService.updateFeeChallanTemplate(Number(id), payload);
  }

  @Delete('template/delete')
  async deleteFeeChallanTemplate(@Query('id') id: string) {
    return await this.feeService.deleteFeeChallanTemplate(Number(id));
  }
}
