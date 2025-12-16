import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffIDCardTemplateDto } from './create-staff-id-card-template.dto';

export class UpdateStaffIDCardTemplateDto extends PartialType(
    CreateStaffIDCardTemplateDto,
) { }
