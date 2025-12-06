import { IsNotEmpty, IsOptional } from "class-validator";

export class StudentDto {

  @IsNotEmpty({ message: "First name must be provided" })
  fName: string
  @IsOptional()
  mName?: string
  @IsOptional()
  lName?: string
  @IsNotEmpty({ message: "student's father or guardian must be provided" })
  fatherOrguardian: string
  @IsNotEmpty({ message: "Roll number must be specified" })
  rollNumber: string
  @IsOptional()
  photo?: string;
  @IsOptional()
  photo_url?: string;
  @IsOptional()
  photo_public_id?: string;

  @IsOptional()
  parentOrGuardianEmail?: string
  @IsNotEmpty({ message: "Parent/Guardian's phone must be provided" })
  parentOrGuardianPhone: string
  @IsNotEmpty({ message: "Gender must be selected" })
  gender: string
  @IsNotEmpty({ message: "Date of Birth must be selected" })
  dob: string
  @IsNotEmpty({ message: "student's class must be selected" })
  classId: string
  @IsNotEmpty({ message: "student's program must be selected" })
  programId: string
  @IsOptional()
  sectionId?: string
  @IsNotEmpty({ message: "Provided Documents must be selected" })
  documents: string
  @IsOptional()
  inquiryId?: string // Link to the inquiry this student was created from
}



// {
//   fieldname: 'photo',
//   originalname: 'batman.jpg',
//   encoding: '7bit',
//   mimetype: 'image/jpeg',
//   buffer: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 00 00 01 00 01 00 00 ff ed 00 7c 50 68 6f 74 6f 73 68 6f 70 20 33 2e 30 00 38 42 49 4d 04 04
// 00 00 00 00 00 60 ... 223027 more bytes>,
//   size: 223077
// }


