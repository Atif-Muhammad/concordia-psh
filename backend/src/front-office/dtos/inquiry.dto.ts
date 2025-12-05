import { IsEnum, IsNotEmpty, IsOptional } from "class-validator"

enum InquiryStatus {
  NEW,
  APPROVED,
  REJECTED,
  FOLLOW_UP
}

export class InquiryDto {
    @IsNotEmpty({message: "Student name must be provided"})
    studentName: string       
    @IsNotEmpty({message: "Student name must be provided"})
    fatherName: string             
    @IsOptional()
    fatherCnic?: string              
    @IsNotEmpty({message: "Student name must be provided"})
    contactNumber: string     
    @IsOptional()
    email?: string                   
    @IsOptional()
    address?: string                 
    @IsNotEmpty({message: "Student interest must be provided"})
    programInterest: string    
    @IsOptional()
    previousInstitute?: string       
    @IsOptional()
    remarks?: string                 
    @IsEnum(InquiryStatus)
    @IsOptional()
    status?: InquiryStatus
}