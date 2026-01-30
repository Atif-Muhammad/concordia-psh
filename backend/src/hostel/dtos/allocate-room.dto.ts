import {
  IsNotEmpty,
  IsInt,
  IsDateString,
  IsString,
  IsOptional,
} from 'class-validator';

export class AllocateRoomDto {
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsOptional()
  @IsInt()
  studentId?: number;

  @IsOptional()
  @IsString()
  externalName?: string;

  @IsNotEmpty()
  @IsDateString()
  allocationDate: string;
}
