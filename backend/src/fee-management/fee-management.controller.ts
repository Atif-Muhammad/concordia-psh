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
import { ExtraChallanService } from './extra-challan.service';
import { CreateFeeHeadDto } from './dtos/create-fee-head.dto';
import { UpdateFeeHeadDto } from './dtos/update-fee-head.dto';
import { CreateFeeStructureDto } from './dtos/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dtos/update-fee-structure.dto';
import { FeeReportQueryDto } from './dtos/fee-report-query.dto';

@Controller('fee-management')
export class FeeManagementController {
  constructor(
    private readonly feeService: FeeManagementService,
    private readonly extraChallanService: ExtraChallanService,
  ) {}

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
    return await this.feeService.getFeeCollectionSummary(
      query.period as any,
      query.sessionId ? Number(query.sessionId) : undefined,
    );
  }

  // Fee Challans (new model)
  @Get('challan/get/all')
  async getFeeChallans(@Query() query: any) {
    return await this.feeService.getFeeChallans(query);
  }

  @Get('challan/bulk')
  async getBulkChallans(@Query() query: any) {
    return await this.feeService.getBulkChallans(query);
  }

  @Delete('challan/delete')
  async deleteFeeChallan(@Query('id') id: string) {
    return await this.feeService.deleteFeeChallan(Number(id));
  }

  @Patch('challan/update')
  async updateFeeChallan(
    @Query('id') id: string,
    @Body() payload: any,
  ) {
    return await this.feeService.updateFeeChallan(Number(id), payload);
  }

  @Get('challan/history')
  async getStudentFeeHistory(
    @Query('studentId') studentId: string,
    @Query('type') type?: string,
  ) {
    return await this.feeService.getStudentFeeHistory(Number(studentId), type);
  }

  @Get('student/summary')
  async getStudentFeeSummary(@Query('studentId') studentId: string) {
    return await this.feeService.getStudentFeeSummary(Number(studentId));
  }

  @Get('student/arrears')
  async getStudentArrears(@Query('studentId') studentId: string) {
    return await this.feeService.getStudentArrears(Number(studentId));
  }

  @Get('installment-plans')
  async getInstallmentPlans(@Query() query: any) {
    return await this.feeService.getInstallmentPlans(query);
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

  @Get('template/get/default')
  async getFeeChallanTemplateDefault() {
    return await this.feeService.getDefaultTemplate();
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

  // Extra Challans (dedicated table)
  @Post('extra-challan/create')
  async createExtraChallan(@Body() payload: any) {
    return await this.extraChallanService.createExtraChallan(payload);
  }

  @Get('extra-challan/get/all')
  async getExtraChallans(@Query() query: any) {
    return await this.extraChallanService.getExtraChallans(query);
  }

  @Delete('extra-challan/delete')
  async deleteExtraChallan(@Query('id') id: string) {
    return await this.extraChallanService.deleteExtraChallan(Number(id));
  }

  @Patch('extra-challan/update')
  async updateExtraChallan(@Query('id') id: string, @Body() payload: any) {
    return await this.extraChallanService.updateExtraChallan(Number(id), payload);
  }
}
