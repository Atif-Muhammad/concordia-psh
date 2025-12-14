import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentDto } from './dtos/department.dto';

@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get('get/names')
  async getDepartmentNames() {
    return await this.departmentService.getDepartmentNames();
  }
  @Get('get')
  async getDepartments() {
    return await this.departmentService.getDepartments();
  }

  @Post('create')
  async createDepartment(@Body() payload: DepartmentDto) {
    // console.log(payload)
    return await this.departmentService.createDepartment(payload);
  }
  @Patch('update')
  async updateDepartment(
    @Query() depID: { depID: string },
    @Body() payload: Partial<DepartmentDto>,
  ) {
    return await this.departmentService.updateDepartment(
      Number(depID.depID),
      payload,
    );
  }
  @Delete('remove')
  async removeDepartment(@Query() depID: { depID: string }) {
    return await this.departmentService.removeDepartment(Number(depID.depID));
  }
}
