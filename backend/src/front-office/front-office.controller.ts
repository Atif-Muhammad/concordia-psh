import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Param,
} from '@nestjs/common';
import { InquiryDto } from './dtos/inquiry.dto';
import { FrontOfficeService } from './front-office.service';
import { VisitorDto } from './dtos/visitor.dto';
import { ComplaintDto } from './dtos/complaint.dto';
import { ContactDto } from './dtos/Contact.dto';
import { Req, UseGuards } from '@nestjs/common';
import { JwtAccGuard } from 'src/common/guards/jwt-access.guard';

@Controller('front-office')
export class FrontOfficeController {
  constructor(private readonly frontOfficeService: FrontOfficeService) {}

  // inquiries
  @Get('get/inquiries')
  async getInquiries(
    @Query('programId') programId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return await this.frontOfficeService.getInquiries(
      programId ? Number(programId) : undefined,
      Number(page),
      Number(limit),
    );
  }
  @Post('create/inquiry')
  async createInquiry(@Body() payload: InquiryDto) {
    return await this.frontOfficeService.createInquiry(payload);
  }
  @Patch('update/inquiry')
  async updateInquiry(
    @Query('id') id: string,
    @Body() payload: Partial<InquiryDto>,
  ) {
    return await this.frontOfficeService.updateInquiry(Number(id), payload);
  }
  @Delete('delete/inquiry')
  async deleteInquiry(@Query('id') id: string) {
    return await this.frontOfficeService.deleteInquiry(Number(id));
  }

  @UseGuards(JwtAccGuard)
  @Post('inquiry/:id/remark')
  async addInquiryRemark(
    @Req() req: any,
    @Param('id') id: string,
    @Body() payload: { remark: string },
  ) {
    const authorName = req.user.name;
    return await this.frontOfficeService.addInquiryRemark(
      Number(id),
      authorName,
      payload.remark,
    );
  }

  // visitors
  @Post('create/visitor')
  async createVisitor(@Body() payload: VisitorDto) {
    return await this.frontOfficeService.createVisitor(payload);
  }
  @Get('get/visitors')
  async getVisitors(@Query('month') month?: string) {
    return await this.frontOfficeService.getVisitors(month);
  }
  @Patch('update/visitor')
  async updateVisitor(@Query('id') id: string, @Body() payload: VisitorDto) {
    return await this.frontOfficeService.updateVisitor(Number(id), payload);
  }
  @Delete('delete/visitor')
  async deleteVisitor(@Query('id') id: string) {
    return await this.frontOfficeService.deleteVisitor(Number(id));
  }

  // complaints
  @Post('create/complaint')
  async createcomplaint(@Body() payload: ComplaintDto) {
    return await this.frontOfficeService.createComplaint(payload);
  }
  @Get('get/complaints')
  async getComplaints(
    @Query('date') date?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.frontOfficeService.getComplaints(
      date,
      start,
      end,
      assignedToId ? Number(assignedToId) : undefined,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @UseGuards(JwtAccGuard)
  @Get('get/my-complaints')
  async getMyComplaints(
    @Req() req: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const staffId = req.user?.isStaff ? Number(req.user.id) : null;
    if (!staffId) return [];
    return this.frontOfficeService.getComplaints(
      undefined,
      undefined,
      undefined,
      staffId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @UseGuards(JwtAccGuard)
  @Post('complaint/:id/remark')
  async addRemark(
    @Req() req: any,
    @Param('id') id: string,
    @Body() payload: { remark: string },
  ) {
    const authorId = Number(req.user.id);
    return await this.frontOfficeService.addComplaintRemark(
      Number(id),
      authorId,
      payload.remark,
    );
  }
  @Patch('update/complaint')
  async updateComplaint(
    @Query('id') id: string,
    @Body() payload: Partial<ComplaintDto>,
  ) {
    return await this.frontOfficeService.updateComplaint(Number(id), payload);
  }
  @Delete('delete/complaint')
  async deleteComplaint(@Query('id') id: string) {
    return await this.frontOfficeService.deleteComplaint(Number(id));
  }

  // contacts
  @Post('create/contact')
  create(@Body() dto: ContactDto) {
    return this.frontOfficeService.createContact(dto);
  }

  @Patch('update/contact')
  update(@Query('id') id: string, @Body() dto: Partial<ContactDto>) {
    return this.frontOfficeService.updateContact(Number(id), dto);
  }

  @Delete('delete/contact')
  delete(@Query('id') id: string) {
    return this.frontOfficeService.deleteContact(Number(id));
  }

  @Get('get/contacts')
  findAll() {
    return this.frontOfficeService.findAllContacts();
  }
}
