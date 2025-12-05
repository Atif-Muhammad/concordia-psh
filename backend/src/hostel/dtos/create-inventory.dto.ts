import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateInventoryDto {
  @IsNotEmpty()
  @IsString()
  itemName: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @IsNotEmpty()
  @IsString()
  condition: string;

  @IsOptional()
  @IsString()
  allocatedToRoom?: string;
}
