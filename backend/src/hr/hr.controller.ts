import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Delete,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { JwtAccGuard } from 'src/common/guards/jwt-access.guard';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import {
  UploadedFile,
  UseInterceptors,
  ConflictException,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { EmployeeDto } from './dtos/employee.dot';
import { StaffDto } from './dtos/staff.dto';

@Controller('hr')
export class HrController {
  constructor(
    private readonly hrService: HrService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  // ═══════════════════════════════════════════════════════════════════════════
  // UNIFIED STAFF MANAGEMENT ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('staff')
  async getAllStaff(
    @Query('isTeaching') isTeaching?: string,
    @Query('isNonTeaching') isNonTeaching?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return await this.hrService.getAllStaff({
      isTeaching:
        isTeaching === 'true'
          ? true
          : isTeaching === 'false'
            ? false
            : undefined,
      isNonTeaching:
        isNonTeaching === 'true'
          ? true
          : isNonTeaching === 'false'
            ? false
            : undefined,
      search,
      status,
    });
  }

  @Get('staff/:id')
  async getStaffById(@Param('id') id: string) {
    return await this.hrService.getStaffById(Number(id));
  }

  @Post('staff')
  @UseInterceptors(
    FileInterceptor('photo', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async createStaff(
    @UploadedFile() file: Express.Multer.File,
    @Body() payload: StaffDto,
  ) {
    let url: string | null = null;
    let public_id: string | null = null;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadFile(file);
      if (!uploaded?.url || !uploaded?.public_id) {
        throw new ConflictException('Failed to upload staff photo');
      }
      url = uploaded.url;
      public_id = uploaded.public_id;
    }

    // photo_url and photo_public_id are handled by the controller since they come from file upload
    const finalPayload = {
      ...payload,
      photo_url: url || undefined,
      photo_public_id: public_id || undefined,
    };

    return await this.hrService.createStaff(finalPayload);
  }

  @Patch('staff/:id')
  @UseInterceptors(
    FileInterceptor('photo', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async updateStaff(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() payload: Partial<StaffDto>,
  ) {
    const staffId = Number(id);
    let photo_url: string | undefined;
    let photo_public_id: string | undefined;

    if (file) {
      // Get existing staff to delete old photo
      const existingStaff = await this.hrService.findOne(staffId);
      if (existingStaff?.photo_public_id) {
        await this.cloudinaryService
          .removeFile(existingStaff.photo_public_id)
          .catch(() => {
            console.warn(
              `Failed to delete old photo: ${existingStaff.photo_public_id}`,
            );
          });
      }

      const uploadResult = await this.cloudinaryService.uploadFile(file);
      if (!uploadResult?.url || !uploadResult?.public_id) {
        throw new ConflictException('Failed to upload staff photo');
      }
      photo_url = uploadResult.url;
      photo_public_id = uploadResult.public_id;
    }

    // photo_url and photo_public_id are handled by the controller since they come from file upload
    const updateData: any = { ...payload };
    if (photo_url && photo_public_id) {
      updateData.photo_url = photo_url;
      updateData.photo_public_id = photo_public_id;
    }

    return await this.hrService.updateStaff(staffId, updateData);
  }

  @Delete('staff/:id')
  async deleteStaff(@Param('id') id: string) {
    const staffId = Number(id);
    const existingStaff = await this.hrService.findOne(staffId);

    if (existingStaff?.photo_public_id) {
      await this.cloudinaryService
        .removeFile(existingStaff.photo_public_id)
        .catch(() => {
          console.warn(
            `Failed to delete staff photo: ${existingStaff.photo_public_id}`,
          );
        });
    }

    return await this.hrService.deleteStaff(staffId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY EMPLOYEE ENDPOINTS (kept for backward compatibility)
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('get/employees')
  async getEmployees(
    @Query('dept') dept: string,
    @Query('search') search: string,
  ) {
    return await this.hrService.fetchEmpls(dept, search);
  }
  @Post('create/employee')
  @UseInterceptors(
    FileInterceptor('photo', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async createEmpl(
    @UploadedFile() file: Express.Multer.File,
    @Body() payload: EmployeeDto,
  ) {
    let url: string | null = null;
    let public_id: string | null = null;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadFile(file);
      if (!uploaded?.url || !uploaded?.public_id) {
        throw new ConflictException('Failed to upload employee photo');
      }
      url = uploaded.url;
      public_id = uploaded.public_id;
    }

    return await this.hrService.createEmp({
      ...payload,
      photo_url: url || undefined,
      photo_public_id: public_id || undefined,
    });
  }

  @Patch('update/employee')
  @UseInterceptors(
    FileInterceptor('photo', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async updateEmpl(
    @UploadedFile() file: Express.Multer.File,
    @Query('id') id: string,
    @Body() payload: EmployeeDto,
  ) {
    const empId = Number(id);
    let photo_url: string | undefined;
    let photo_public_id: string | undefined;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      if (!uploadResult.url || !uploadResult.public_id) {
        throw new ConflictException('Failed to upload employee photo');
      }
      photo_url = uploadResult.url;
      photo_public_id = uploadResult.public_id;
    }

    const updateData = { ...payload };
    if (photo_url && photo_public_id) {
      updateData.photo_url = photo_url;
      updateData.photo_public_id = photo_public_id;
    }

    return await this.hrService.updateEmp(empId, updateData);
  }

  @Delete('delete/employee')
  async deleteEmpl(@Query('id') id: string) {
    const empId = Number(id);
    const existingEmp = await this.hrService.findOne(empId);

    if (existingEmp && existingEmp.photo_public_id) {
      await this.cloudinaryService
        .removeFile(existingEmp.photo_public_id)
        .catch(() => {
          console.warn(
            `Failed to delete old photo: ${existingEmp.photo_public_id}`,
          );
        });
    }

    return await this.hrService.deleteEmp(empId);
  }

  @Get('get/employees-by-dept')
  async getEmployeesByDept() {
    return await this.hrService.getEmployeesByDept();
  }

  @Get('payroll-settings')
  async getPayrollSettings() {
    return await this.hrService.getPayrollSettings();
  }

  @Patch('payroll-settings')
  async updatePayrollSettings(@Body() payload: any) {
    return await this.hrService.updatePayrollSettings(payload);
  }

  @Get('payroll-sheet')
  async getPayrollSheet(
    @Query('month') month: string,
    @Query('type') type: 'teacher' | 'employee' | 'all',
  ) {
    return await this.hrService.getPayrollSheet(month, type);
  }

  @Get('payroll-history')
  async getPayrollHistory(
    @Query('staffId') staffId: string,
    @Query('type') type: 'teacher' | 'employee' | 'all',
  ) {
    return await this.hrService.getPayrollHistory(Number(staffId), type);
  }

  @Post('payroll')
  async upsertPayroll(@Body() payload: any) {
    return await this.hrService.upsertPayroll(payload);
  }

  @Get('leave-sheet')
  async getLeaveSheet(
    @Query('month') month: string,
    @Query('type') type: 'teacher' | 'employee' | 'all',
  ) {
    return await this.hrService.getLeaveSheet(month, type);
  }

  @Post('leave')
  async upsertLeave(@Body() payload: any) {
    return await this.hrService.upsertLeave(payload);
  }

  @Get('staff-attendance')
  async getStaffAttendance(@Query('date') date: string) {
    return await this.hrService.getStaffAttendance(new Date(date));
  }

  @UseGuards(JwtAccGuard)
  @Post('staff-attendance')
  async markStaffAttendance(
    @Req() req: { user: { id: string } },
    @Body()
    payload: {
      staffId?: number;
      employeeId?: number; // legacy
      teacherId?: number; // legacy
      date: string;
      status: string;
      notes?: string;
    },
  ) {
    const adminId = req.user?.id ? Number(req.user.id) : null;
    return await this.hrService.markStaffAttendance({
      ...payload,
      markedBy: adminId,
    });
  }

  @Post('holidays')
  async createHoliday(@Body() payload: any) {
    return await this.hrService.createHoliday(payload);
  }

  @Get('holidays')
  async getHolidays(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return await this.hrService.getHolidays(
      year ? Number(year) : undefined,
      month ? Number(month) : undefined,
    );
  }

  @Delete('holidays')
  async deleteHoliday(@Query('id') id: string) {
    return await this.hrService.deleteHoliday(Number(id));
  }

  @Post('advance-salary')
  async createAdvanceSalary(@Body() payload: any) {
    return await this.hrService.createAdvanceSalary(payload);
  }

  @Get('advance-salary')
  async getAdvanceSalaries(
    @Query('month') month?: string,
    @Query('type') type?: 'teacher' | 'employee' | 'all',
  ) {
    return await this.hrService.getAdvanceSalaries(month, type);
  }

  @Patch('advance-salary')
  async updateAdvanceSalary(@Query('id') id: string, @Body() payload: any) {
    return await this.hrService.updateAdvanceSalary(Number(id), payload);
  }

  @Delete('advance-salary')
  async deleteAdvanceSalary(@Query('id') id: string) {
    return await this.hrService.deleteAdvanceSalary(Number(id));
  }

  // summary
  @Get('attendance-summary')
  async getAttendanceSummary(
    @Query('month') month: string,
    @Query('staffId') staffId: number,
    @Query('type') type: string,
  ) {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of the month
    if (type === 'TEACHER') {
      return await this.hrService.getTeacherAttendanceSummary(
        staffId,
        startDate,
        endDate,
      );
    }
  }

  // Payroll Templates
  @Post('payroll-template')
  async createPayrollTemplate(@Body() payload: any) {
    return await this.hrService.createPayrollTemplate(payload);
  }

  @Get('payroll-template')
  async getPayrollTemplates() {
    return await this.hrService.getPayrollTemplates();
  }

  @Patch('payroll-template')
  async updatePayrollTemplate(@Query('id') id: string, @Body() payload: any) {
    return await this.hrService.updatePayrollTemplate(Number(id), payload);
  }

  @Delete('payroll-template')
  async deletePayrollTemplate(@Query('id') id: string) {
    return await this.hrService.deletePayrollTemplate(Number(id));
  }
}
