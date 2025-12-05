import { IsNotEmpty, IsInt, IsDateString, IsString } from 'class-validator';

export class AllocateRoomDto {
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsNotEmpty()
  @IsInt()
  studentId: number;

  @IsNotEmpty()
  @IsDateString()
  allocationDate: string;
}
