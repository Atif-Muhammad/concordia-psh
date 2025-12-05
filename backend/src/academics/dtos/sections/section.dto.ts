import { IsNotEmpty, IsOptional } from "class-validator";

export class SectionDto{

    @IsOptional()
    id?: string

    @IsNotEmpty({message: "Section name must be provided"})
    name: string

    @IsNotEmpty({message: "Class must be specified"})
    classId: string | number

    @IsNotEmpty({message: "Section capacity must be provided"})
    capacity: string | number

    @IsNotEmpty({message: "Room name/number must be provided"})
    room: string
}