import { IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  itemName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  quantity?: number;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  allocatedToRoom?: string;
}
