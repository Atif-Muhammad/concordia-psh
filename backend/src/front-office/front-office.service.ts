import { Injectable } from '@nestjs/common';
import { InquiryDto } from './dtos/inquiry.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ComplaintStatus, ComplaintType, InquiryStatus } from '@prisma/client';
import { VisitorDto } from './dtos/visitor.dto';
import { ComplaintDto } from './dtos/complaint.dto';
import { ContactDto } from './dtos/Contact.dto';

@Injectable()
export class FrontOfficeService {
    constructor(private prismaService: PrismaService) { }

    // inquiries
    async createInquiry(payload: InquiryDto) {
        return await this.prismaService.inquiry.create({
            data: {
                ...payload,
                programInterest: Number(payload.programInterest),
                status: payload.status as unknown as InquiryStatus,
            },
        });
    }
    async getInquiries(programId: number) {
        return await this.prismaService.inquiry.findMany({
            where: { programInterest: programId },
            include: {
                program: {
                    select: {
                        name: true,
                    },
                },
            },
        });
    }
    async updateInquiry(id: number, payload: Partial<InquiryDto>) {
        return await this.prismaService.inquiry.update({
            where: { id },
            data: {
                status: payload.status as unknown as InquiryStatus,
            },
        });
    }
    async deleteInquiry(id: number) {
        return await this.prismaService.inquiry.delete({
            where: { id },
        });
    }
    async rollbackInquiry(id: number) {
        // Find the inquiry first to ensure it exists
        const inquiry = await this.prismaService.inquiry.findUnique({
            where: { id },
        });

        if (!inquiry) {
            throw new Error('Inquiry not found');
        }

        // Try to find and delete the student created from this inquiry
        // Note: Students should have inquiryId field for this to work
        const student = await this.prismaService.student.findFirst({
            where: { inquiryId: id },
        });

        if (student) {
            await this.prismaService.student.delete({
                where: { id: student.id },
            });
        }

        // Revert inquiry status to NEW
        return await this.prismaService.inquiry.update({
            where: { id },
            data: {
                status: 'NEW' as any,
            },
        });
    }

    // visitors

    async getVisitors(month?: string) {
        if (month) {
            // month format: YYYY-MM
            const [year, monthNum] = month.split('-');
            const start = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
            const end = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);

            return await this.prismaService.visitor.findMany({
                where: {
                    date: {
                        gte: start,
                        lte: end,
                    },
                },
                orderBy: { date: 'desc' },
            });
        }

        return await this.prismaService.visitor.findMany({
            orderBy: { date: 'desc' },
        });
    }
    async createVisitor(payload: VisitorDto) {
        const inTime = new Date(
            `${new Date().toISOString().split('T')[0]}T${payload.inTime}:00`,
        );
        const outTime = payload.outTime
            ? new Date(
                `${new Date().toISOString().split('T')[0]}T${payload.outTime}:00`,
            )
            : null;
        return await this.prismaService.visitor.create({
            data: {
                visitorName: payload.visitorName,
                phone: BigInt(payload.phoneNumber),
                IDCard: BigInt(payload.ID),
                date: new Date(payload.visitDate),
                persons: Number(payload.persons),
                inTime,
                outTime,
                purpose: payload.purpose,
                remarks: payload.remarks ? payload.remarks : null,
            },
        });
    }
    async updateVisitor(id: number, payload: VisitorDto) {
        const inTime = new Date(
            `${new Date().toISOString().split('T')[0]}T${payload.inTime}:00`,
        );
        const outTime = payload.outTime
            ? new Date(
                `${new Date().toISOString().split('T')[0]}T${payload.outTime}:00`,
            )
            : null;
        return await this.prismaService.visitor.update({
            where: { id },
            data: {
                visitorName: payload.visitorName,
                phone: Number(payload.phoneNumber),
                IDCard: Number(payload.ID),
                date: new Date(payload.visitDate),
                persons: Number(payload.persons),
                inTime,
                outTime,
                purpose: payload.purpose,
                remarks: payload.remarks ? payload.remarks : null,
            },
        });
    }
    async deleteVisitor(id: number) {
        return await this.prismaService.visitor.delete({ where: { id } });
    }

    // complaints

    async createComplaint(payload: ComplaintDto) {
        return await this.prismaService.complaint.create({
            data: {
                type: payload.type as ComplaintType,
                complainantName: payload.complainantName,
                contact: payload.contact,
                subject: payload.subject,
                description: payload.details,
            },
        });
    }

    async getComplaints(date?: string) {
        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setHours(23, 59, 59);

            return await this.prismaService.complaint.findMany({
                where: {
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }

        return await this.prismaService.complaint.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateComplaint(id: number, payload: Partial<ComplaintDto>) {
        return await this.prismaService.complaint.update({
            where: { id },
            data: {
                ...payload,
                description: payload.details,
                status: payload.status as ComplaintStatus,
                type: payload.type as ComplaintType,
            },
        });
    }

    async deleteComplaint(id: number) {
        return await this.prismaService.complaint.delete({
            where: { id },
        });
    }

    // contacts
    async createContact(dto: ContactDto) {
        return this.prismaService.contact.create({
            data: dto,
        });
    }
    async updateContact(id: number, dto: Partial<ContactDto>) {
        return this.prismaService.contact.update({
            where: { id },
            data: dto,
        });
    }
    async deleteContact(id: number) {
        return this.prismaService.contact.delete({
            where: { id },
        });
    }
    async findAllContacts() {
        return this.prismaService.contact.findMany({
            orderBy: { id: "desc" },
        });
    }
}
