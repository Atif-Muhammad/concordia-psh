import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReportPeriod {
  MONTH = 'month',
  YEAR = 'year',
  OVERALL = 'overall',
}

export class FeeReportQueryDto {
  @IsEnum(ReportPeriod)
  @IsOptional()
  period?: ReportPeriod = ReportPeriod.MONTH;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}
