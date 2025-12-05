import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdminDto } from './dtos/create-admin.dto';
import * as bcrypt from "bcrypt"

@Injectable()
export class AdminService {
  constructor(private prismaService: PrismaService) {}

  async getAdmins() {
    return await this.prismaService.admin.findMany({orderBy: {createdAt: "desc"}});
  }
  async removeAdmin(adminID: number) {
    const existingAdmin = await this.prismaService.admin.findUnique({ where: { id: adminID } });
    if (!existingAdmin) {
        throw new HttpException("Admin not found", HttpStatus.BAD_REQUEST);
    }
    return this.prismaService.admin.delete({where: {id: adminID}})
  }

  async createAdmin(payload: CreateAdminDto) {
    const { name, email, password } = payload;
    const existingAdmin = await this.prismaService.admin.findUnique({ where: { email: email } });
    if (existingAdmin) {
        throw new HttpException("Admin with this email already exists", HttpStatus.BAD_REQUEST);
    }

    // hash pass
    const hashedPass = await bcrypt.hash(password, 10);
    return this.prismaService.admin.create({
        data: {
            name, password: hashedPass, email, role: "ADMIN"
        }
    })
  }

  async updateAdmin(adminID: number, payload: Partial<CreateAdminDto>) {
    const admin = await this.prismaService.admin.findUnique({
        where: { id: adminID },
    });
    if (!admin) {
        throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
    }
    const updateData: any = { ...payload };
    if (payload.password) {
        updateData.password = await bcrypt.hash(payload.password, 10);
    }
    return this.prismaService.admin.update({
        where: { id: adminID },
        data: updateData,
    });
  }
}
