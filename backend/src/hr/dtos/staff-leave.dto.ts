import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { StaffLeaveStatus, StaffLeaveType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateStaffLeaveDto {
  @IsNumber()
  staffId: number;

  @IsEnum(StaffLeaveType)
  leaveType: StaffLeaveType;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsString()
  reason: string;
}

export class UpdateStaffLeaveDto {
  @IsOptional()
  @IsEnum(StaffLeaveType)
  leaveType?: StaffLeaveType;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(StaffLeaveStatus)
  status?: StaffLeaveStatus;
}

export class StaffLeaveFilterDto {
  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  staffId?: number;

  @IsOptional()
  @IsEnum(StaffLeaveStatus)
  status?: StaffLeaveStatus;

  @IsOptional()
  @IsEnum(StaffLeaveType)
  leaveType?: StaffLeaveType;
}
