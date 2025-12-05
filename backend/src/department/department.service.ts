import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DepartmentDto } from './dtos/department.dto';

@Injectable()
export class DepartmentService {
  constructor(private prismaService: PrismaService) {}

  async getDepartmentNames() {
    return await this.prismaService.department.findMany({
      select: {
        id: true,
        name: true,
        hod: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {createdAt: "desc"}
    });
  }
  async getDepartments() {
    return await this.prismaService.department.findMany({
      include: { hod: { select: { id: true, name: true } } },orderBy: {createdAt: "desc"}
    });
  }
  async createDepartment(payload: DepartmentDto) {
    const dept = await this.prismaService.department.findFirst({
      where: { name: payload.departmentName },
    });
    if (dept)
      throw new ConflictException(`department '${dept.name}' already exists`);
    return await this.prismaService.department.create({
      data: {
        name: payload.departmentName,
        description: payload.description,
        hodId: Number(payload.headOfDepartment),
      },
    });
  }
  async updateDepartment(depID: number, payload: Partial<DepartmentDto>) {
    return await this.prismaService.department.update({
      where: { id: depID },
      data: {
        name: payload.departmentName,
        description: payload.description,
        hodId: Number(payload.headOfDepartment) || null,
      },
    });
  }
  async removeDepartment(depID: number) {
    return await this.prismaService.department.delete({ where: { id: depID } });
  }
}
