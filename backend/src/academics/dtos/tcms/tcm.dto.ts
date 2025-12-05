import { IsNotEmpty, IsOptional } from "class-validator";



export class TcsmDto {
    @IsNotEmpty({message: "Teacher must be specified"})
    teacherId: string
    @IsNotEmpty({message: "Class must be specified"})
    classId: string
    @IsOptional()
    sectionId?: number | null;  
}