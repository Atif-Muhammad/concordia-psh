import { IsBoolean, IsNotEmpty, IsOptional } from "class-validator";

export class ClassDto {
    @IsOptional()
    id?:string;

    @IsNotEmpty({message: "Class name must be provided"})
    name: string;

    @IsNotEmpty({message: "Program id must be provided"})
    programId: string;

    @IsOptional()
    year?:string | number

    @IsOptional()
    semester?: string | number

    @IsOptional()
    isSemester: boolean | null

}