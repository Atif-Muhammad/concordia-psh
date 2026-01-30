import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { LoginAdminDto } from './dtos/login-admin.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async generateTokens(payload: {
    id: number | string;
    name: string;
    email: string;
    role?: string;
    permissions: any;
    isStaff?: boolean;
  }) {
    if (!payload.role) {
      payload = { ...payload, role: payload.isStaff ? 'Staff' : 'ADMIN' };
    }
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: '1d',
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: '7d',
    });
    return { access_token: accessToken, refresh_token: refresh_token };
  }

  async refreshTokens(payload: {
    id: number | string;
    name: string;
    email: string;
    role?: string;
    permissions: any;
    isStaff?: boolean;
  }) {
    return this.generateTokens(payload);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async createSuperAdmin(payload: CreateAdminDto) {
    const { email, password, name, role } = payload;
    // check if email exists
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { email },
    });
    if (existingAdmin) {
      throw new HttpException(
        'Super Admin with this email already exists',
        HttpStatus.BAD_REQUEST,
      );
    }
    // // hash the password
    const hashedPass = await bcrypt.hash(password, 10);
    return this.prisma.admin.create({
      data: {
        password: hashedPass,
        email,
        name,
        permissions: { all: true },
        role,
      },
    });
  }


  async updateAdmin(adminID: number, payload: Partial<CreateAdminDto>) {
    // const admin = await this.prisma.admin.findUnique({
    //     where: { id: adminID },
    // });
    // if (!admin) {
    //     throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
    // }
    // const updateData: any = { ...payload };
    // if (payload.password) {
    //     updateData.password = await bcrypt.hash(payload.password, 10);
    // }
    // return this.prisma.admin.update({
    //     where: { id: adminID },
    //     data: updateData,
    // });
  }

  async login(payload: LoginAdminDto) {
    const { email, password } = payload;
    // find the admin email
    let admin: any;
    admin = await this.prisma.admin.findUnique({
      where: { email },
    });
    if (!admin) {
      admin = await this.prisma.staff.findUnique({
        where: { email },
      });
      if (!admin) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
    }
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    if (!admin.role) {
      admin.role = admin.isTeaching ? 'Teacher' : 'Staff';
    }
    admin.isStaff = !admin.role.includes('ADMIN'); // Staff if not ADMIN/SUPER_ADMIN

    // Ensure isStaff flag is correctly set based on which table user was found in
    // Note: this is a bit redundant if role is already set correctly, but safe
    const isActuallyStaff = !admin.role.includes('SUPER_ADMIN') && !admin.role.includes('ADMIN');
    admin.isStaff = isActuallyStaff;

    return admin;
  }

  async findUserById(id: number | string, isStaff?: boolean) {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    if (isNaN(numericId)) return null;

    if (isStaff === true) {
      const staff = await this.prisma.staff.findUnique({
        where: { id: numericId },
      });
      if (staff) {
        (staff as any).role = (staff as any).isTeaching ? 'Teacher' : 'Staff';
        (staff as any).isStaff = true;
      }
      return staff;
    }

    if (isStaff === false) {
      const admin = await this.prisma.admin.findUnique({
        where: { id: numericId },
      });
      if (admin) {
        (admin as any).isStaff = false;
        return admin;
      }
      return null;
    }

    // Fallback if isStaff is unknown (check both)
    const admin = await this.prisma.admin.findUnique({
      where: { id: numericId },
    });
    if (admin) {
      (admin as any).isStaff = false;
      return admin;
    }

    const staff = await this.prisma.staff.findUnique({
      where: { id: numericId },
    });
    if (staff) {
      (staff as any).role = (staff as any).isTeaching ? 'Teacher' : 'Staff';
      (staff as any).isStaff = true;
    }
    return staff;
  }
}
