import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { InquiryDto } from './dtos/inquiry.dto';
import { FrontOfficeService } from './front-office.service';
import { VisitorDto } from './dtos/visitor.dto';
import { ComplaintDto } from './dtos/complaint.dto';
import { ContactDto } from './dtos/Contact.dto';

@Controller('front-office')
export class FrontOfficeController {
    constructor(private readonly frontOfficeService: FrontOfficeService) { }

    // inquiries
    @Get('get/inquiries')
    async getInquiries(@Query('programId') programId: string) {
        return await this.frontOfficeService.getInquiries(Number(programId));
    }
    @Post('create/inquiry')
    async createInquiry(@Body() payload: InquiryDto) {
        return await this.frontOfficeService.createInquiry(payload);
    }
    @Patch('update/inquiry')
    async updateInquiry(@Query('id') id: string, @Body() payload: Partial<InquiryDto>) {
        return await this.frontOfficeService.updateInquiry(Number(id), payload);
    }
    @Delete('delete/inquiry')
    async deleteInquiry(@Query('id') id: string) {
        return await this.frontOfficeService.deleteInquiry(Number(id));
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
    async getComplaints(@Query('date') date?: string) {
        return this.frontOfficeService.getComplaints(date);
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
