import { IsNotEmpty, IsOptional } from 'class-validator';

export class SectionDto {
  @IsOptional()
  id?: string;

  @IsNotEmpty({ message: 'Section name must be provided' })
  name: string;

  @IsNotEmpty({ message: 'Class must be specified' })
  classId: string | number;

  @IsOptional()
  capacity?: string | number;

  @IsOptional()
  room?: string;
}
