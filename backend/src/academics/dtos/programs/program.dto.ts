import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import { Level } from 'src/common/constants/level.enum';

export class ProgramDto {
  @IsOptional()
  id?: string;
  @IsNotEmpty({ message: 'Program name must be provided' })
  name: string;
  @IsOptional()
  description?: string;
  @IsNotEmpty({ message: 'Program level must be provided' })
  level: Level;

  @IsNotEmpty({ message: "Program's department must be provided" })
  departmentId: string | number;

  @IsNotEmpty({ message: "Program's duration must be provided" })
  duration: string;
  @IsNotEmpty()
  @IsOptional()
  rollPrefix?: string;
}
