import { Injectable } from '@nestjs/common';
import { InquiryDto } from './dtos/inquiry.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ComplaintStatus, ComplaintType, InquiryStatus } from '@prisma/client';
import { VisitorDto } from './dtos/visitor.dto';
import { ComplaintDto } from './dtos/complaint.dto';
import { ContactDto } from './dtos/Contact.dto';

@Injectable()
export class FrontOfficeService {
  constructor(private prismaService: PrismaService) {}

  // inquiries
  async createInquiry(payload: InquiryDto) {
    return await this.prismaService.inquiry.create({
      data: {
        ...payload,
        programInterest: Number(payload.programInterest),
        sessionId: payload.sessionId ? Number(payload.sessionId) : undefined,
        status: payload.status as unknown as InquiryStatus,
        remarks: payload.remarks || [],
        followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : undefined,
      },
    });
  }
  async getInquiries(programId?: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const where =
      programId && !isNaN(programId) ? { programInterest: programId } : {};

    const [inquiries, total] = await Promise.all([
      this.prismaService.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          program: { select: { name: true } },
          session: { select: { id: true, name: true } },
        },
      }),
      this.prismaService.inquiry.count({ where }),
    ]);

    return {
      data: inquiries,
      total,
      page,
      limit,
      hasMore: skip + inquiries.length < total,
    };
  }
  async updateInquiry(id: number, payload: Partial<InquiryDto>) {
    const { status, remarks, ...rest } = payload;
    const updateData: any = { ...rest };
    if (status !== undefined) {
      updateData.status = status as unknown as InquiryStatus;
    }
    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }
    if (payload.programInterest) {
      updateData.programInterest = Number(payload.programInterest);
    }
    if (payload.sessionId !== undefined) {
      updateData.sessionId = payload.sessionId ? Number(payload.sessionId) : null;
    }
    if (payload.followUpDate !== undefined) {
      updateData.followUpDate = payload.followUpDate ? new Date(payload.followUpDate) : null;
    }

    return await this.prismaService.inquiry.update({
      where: { id },
      data: updateData,
    });
  }
  async addInquiryRemark(id: number, authorName: string, remarkText: string) {
    const inquiry = await this.prismaService.inquiry.findUnique({
      where: { id },
    });
    if (!inquiry) throw new Error('Inquiry not found');

    let currentRemarks: any[] = [];
    if (inquiry.remarks) {
      if (Array.isArray(inquiry.remarks)) {
        currentRemarks = inquiry.remarks;
      } else if (typeof inquiry.remarks === 'string') {
        try {
          const parsed = JSON.parse(inquiry.remarks);
          currentRemarks = Array.isArray(parsed) ? parsed : [{ text: inquiry.remarks, author: 'Legacy', date: inquiry.createdAt }];
        } catch (e) {
          // If not JSON, it's a legacy plain string
          currentRemarks = [{ text: inquiry.remarks, author: 'Legacy', date: inquiry.createdAt }];
        }
      }
    }
    const newRemark = {
      text: remarkText,
      author: authorName,
      date: new Date(),
    };

    return await this.prismaService.inquiry.update({
      where: { id },
      data: {
        remarks: [...currentRemarks, newRemark] as any,
      },
    });
  }
  async deleteInquiry(id: number) {
    return await this.prismaService.inquiry.delete({
      where: { id },
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
        assignedTo: {
          connect: payload.assignedToIds?.map((id) => ({ id: Number(id) })) || [],
        },
      },
    });
  }

  async getComplaints(
    date?: string,
    start?: string,
    end?: string,
    assignedToId?: number,
    month?: number,
    year?: number,
  ) {
    const where: any = {};
    if (year && month) {
      const s = new Date(year, month - 1, 1);
      const e = new Date(year, month, 0, 23, 59, 59);
      where.createdAt = {
        gte: s,
        lte: e,
      };
    } else if (year) {
      const s = new Date(year, 0, 1);
      const e = new Date(year, 11, 31, 23, 59, 59);
      where.createdAt = {
        gte: s,
        lte: e,
      };
    } else if (start && end) {
      where.createdAt = {
        gte: new Date(start),
        lte: new Date(end),
      };
    } else if (date) {
      const s = new Date(date);
      const e = new Date(date);
      e.setHours(23, 59, 59);
      where.createdAt = {
        gte: s,
        lte: e,
      };
    }

    if (assignedToId) {
      where.assignedTo = {
        some: { id: assignedToId },
      };
    }

    return await this.prismaService.complaint.findMany({
      where,
      include: {
        assignedTo: true,
        remarks: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateComplaint(id: number, payload: Partial<ComplaintDto>) {
    const updateData: any = {
      complainantName: payload.complainantName,
      contact: payload.contact,
      subject: payload.subject,
      description: payload.details,
      status: payload.status as ComplaintStatus,
      type: payload.type as ComplaintType,
    };

    if (payload.assignedToIds) {
      updateData.assignedTo = {
        set: payload.assignedToIds.map((id) => ({ id: Number(id) })),
      };
    }

    return await this.prismaService.complaint.update({
      where: { id },
      data: updateData,
    });
  }

  async addComplaintRemark(
    complaintId: number,
    authorId: number,
    remark: string,
  ) {
    return await this.prismaService.complaintRemark.create({
      data: {
        complaintId,
        authorId,
        remark,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
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
      orderBy: { id: 'desc' },
    });
  }
}
