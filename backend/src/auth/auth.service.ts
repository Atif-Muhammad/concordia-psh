import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { LoginAdminDto } from './dtos/login-admin.dto';
import { JwtService } from '@nestjs/jwt';

export type CompactAuthPayload = {
  id: number | string;
  email: string;
  role: string;
  isStaff: boolean;
  isTeaching?: boolean;
  isNonTeaching?: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private normalizeRole(user: any): string {
    return String(user?.role || (user?.isTeaching ? 'Teacher' : 'Staff'));
  }

  private isStaffUser(user: any): boolean {
    return !this.normalizeRole(user).includes('ADMIN');
  }

  buildCompactAuthPayload(user: any): CompactAuthPayload {
    const role = this.normalizeRole(user);
    return {
      id: user.id,
      email: user.email,
      role,
      isStaff: !role.includes('ADMIN'),
      isTeaching: Boolean(user.isTeaching),
      isNonTeaching: Boolean(user.isNonTeaching),
    };
  }

  buildSafeUserResponse(user: any) {
    const isStaff = user?.isStaff ?? this.isStaffUser(user);
    const role = this.normalizeRole(user);
    let designation: string | undefined;

    if (isStaff) {
      if (user.designation) {
        designation = user.designation;
      } else if (user.isTeaching) {
        designation = user.specialization
          ? `Teacher - ${user.specialization}`
          : 'Teacher';
      } else {
        designation = 'Staff';
      }
    }

    return {
      id: user.id,
      name: user.name,
      role,
      designation,
      email: user.email,
      permissions: user.permissions || {},
      isStaff,
      isTeaching: Boolean(user.isTeaching),
      isNonTeaching: Boolean(user.isNonTeaching),
    };
  }

  async generateTokens(payload: CompactAuthPayload) {
    const compactPayload = this.buildCompactAuthPayload(payload);
    const accessToken = await this.jwtService.signAsync(compactPayload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: '1d',
    });
    const refresh_token = await this.jwtService.signAsync(compactPayload, {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: '7d',
    });
    return { access_token: accessToken, refresh_token: refresh_token };
  }

  async refreshTokens(payload: CompactAuthPayload) {
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

    admin.role = this.normalizeRole(admin);
    admin.isStaff = this.isStaffUser(admin);

    return admin;
  }

  async getAuthenticatedUser(payload: CompactAuthPayload) {
    const user = await this.findUserById(payload.id, payload.isStaff);
    return user ? this.buildSafeUserResponse(user) : null;
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
