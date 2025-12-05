import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  roomNumber: string;

  @IsNotEmpty()
  @IsString()
  roomType: string; // "single" | "double" | "triple"

  @IsNotEmpty()
  @IsInt()
  capacity: number;

  @IsOptional()
  @IsString()
  hostelName?: string;

  @IsOptional()
  @IsString()
  status?: string; // "vacant" | "occupied" | "maintenance"
}
