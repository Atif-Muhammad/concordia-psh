import { IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @IsOptional()
  @IsString()
  roomType?: string;

  @IsOptional()
  @IsInt()
  capacity?: number;

  @IsOptional()
  @IsString()
  hostelName?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
