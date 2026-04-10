import { IsNotEmpty, IsOptional } from 'class-validator';

export class SubjectDto {
  @IsOptional()
  id?: string;

  @IsNotEmpty({ message: 'Subject name must be provided' })
  name: string;
}
