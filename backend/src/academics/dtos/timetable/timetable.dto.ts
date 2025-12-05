import { IsNotEmpty, IsOptional } from "class-validator";


export class TimetableDto{

    @IsOptional()
    id?: string
    @IsNotEmpty({message: "teacher must be selected"})
    teacherId: string
    @IsNotEmpty({message: "subject must be selected"})
    subjectId: string
    @IsOptional()
    sectionId?: string | null
    @IsNotEmpty({message: "class must be specified"})
    classId: string
    @IsNotEmpty({message: "day must be selected"})
    dayOfWeek: string
    @IsNotEmpty({message: "start time must be selected"})
    startTime: string
    @IsNotEmpty({message: "end time must be selected"})
    endTime: string
    @IsNotEmpty({message: "room must be selected"})
    room: string
    

}