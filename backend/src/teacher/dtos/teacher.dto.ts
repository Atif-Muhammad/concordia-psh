import { IsEnum, IsNotEmpty, IsNotEmptyObject, IsOptional } from "class-validator";


enum TeacherType {
    PERMANENT,
    CONTRACT
}

enum TeacherStatus {
    ACTIVE,
    TERMINATED,
    RETIRED
}

export class TeacherDto {

    @IsOptional()
    id?: string;
    @IsNotEmpty({ message: "teacher name must be provided" })
    name: string
    @IsNotEmpty({ message: "teacher email must be provided" })
    email: string
    @IsNotEmpty({ message: "teacher password must be given" })
    password: string
    @IsNotEmpty({ message: "teacher phone must be provided" })
    phone: string
    @IsNotEmpty({ message: "teacher specialization must be provided" })
    specialization: string
    @IsNotEmpty({ message: "teacher's department must be provided" })
    departmentId: string
    @IsNotEmpty({ message: "teacher highest degree must be provided" })
    highestDegree: string
    @IsNotEmptyObject()
    documents: { bsDegree: Boolean, msDegree: Boolean, phd: Boolean, postDoc: Boolean, experienceLetter: Boolean, cv: Boolean }
    @IsEnum(TeacherType)
    @IsOptional()
    teacherType?: TeacherType
    @IsEnum(TeacherStatus)
    @IsOptional()
    teacherStatus?: TeacherStatus
    @IsOptional()
    basicPay?: string

}