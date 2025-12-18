
import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentIDCardTemplateDto } from './create-student-id-card-template.dto';

export class UpdateStudentIDCardTemplateDto extends PartialType(
    CreateStudentIDCardTemplateDto,
) { }
