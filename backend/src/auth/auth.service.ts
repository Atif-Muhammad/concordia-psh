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
  ) {}

  async generateTokens(payload: {
    id: number | string;
    email: string;
    role?: string;
    permissions: any;
  }) {
    if (!payload.role) {
      payload = { ...payload, role: 'Teacher' };
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
    email: string;
    role?: string;
    permissions: any;
  }) {
    return this.generateTokens(payload);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async createSuperAdmin(payload: CreateAdminDto) {
    const { email, password, name } = payload;
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
        role: 'SUPER_ADMIN',
      },
    });
  }

  async createAdmin(payload: CreateAdminDto) {
    console.log(payload);
    // const { name, email, password } = payload;
    // const existingAdmin = await this.prisma.admin.findUnique({ where: { email: email } });
    // if (existingAdmin) {
    //     throw new HttpException("Admin with this email already exists", HttpStatus.BAD_REQUEST);
    // }

    // // hash pass
    // const hashedPass = await bcrypt.hash(password, 10);
    // return this.prisma.admin.create({
    //     data: {
    //         name, password: hashedPass, email, role: "ADMIN"
    //     }
    // })
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
      admin = await this.prisma.teacher.findUnique({
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

    return admin;
  }

  async loginMember(memberID: string, otp: number) {
    // check otp against the memberID
    // const matched = await this.prisma.member.findFirst({where: {Membership_No: String(memberID), otp}})
    // if(!matched) {
    //     throw new HttpException("OTP Didn't match", HttpStatus.NOT_ACCEPTABLE);
    // }
    // await this.prisma.member.update({where: {Membership_No: String(memberID)}, data: {otp: null}})
    // return matched;
  }
}
