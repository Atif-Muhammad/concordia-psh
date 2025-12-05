import { IsNotEmpty, IsOptional } from "class-validator";


export class DepartmentDto {
    @IsOptional()
    id?: string

    @IsNotEmpty({message: "department name must be provided"})
    departmentName: string;
    @IsNotEmpty({message: "department name must be provided"})
    headOfDepartment: string;

    @IsOptional()
    description?: string;

}