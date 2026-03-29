-- DropForeignKey
ALTER TABLE `advancesalary` DROP FOREIGN KEY `AdvanceSalary_staffId_fkey`;

-- DropForeignKey
ALTER TABLE `assignment` DROP FOREIGN KEY `Assignment_sectionId_fkey`;

-- DropForeignKey
ALTER TABLE `assignment` DROP FOREIGN KEY `Assignment_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `assignment` DROP FOREIGN KEY `Assignment_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `Attendance_classId_fkey`;

-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `Attendance_sectionId_fkey`;

-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `Attendance_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `Attendance_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `Attendance_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `class` DROP FOREIGN KEY `Class_programId_fkey`;

-- DropForeignKey
ALTER TABLE `complaintremark` DROP FOREIGN KEY `ComplaintRemark_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `complaintremark` DROP FOREIGN KEY `ComplaintRemark_complaintId_fkey`;

-- DropForeignKey
ALTER TABLE `department` DROP FOREIGN KEY `Department_hodId_fkey`;

-- DropForeignKey
ALTER TABLE `exam` DROP FOREIGN KEY `Exam_classId_fkey`;

-- DropForeignKey
ALTER TABLE `exam` DROP FOREIGN KEY `Exam_programId_fkey`;

-- DropForeignKey
ALTER TABLE `examschedule` DROP FOREIGN KEY `ExamSchedule_examId_fkey`;

-- DropForeignKey
ALTER TABLE `examschedule` DROP FOREIGN KEY `ExamSchedule_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `FeeChallan_feeStructureId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `FeeChallan_studentArrearId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `FeeChallan_studentClassId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `FeeChallan_studentFeeInstallmentId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `FeeChallan_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `FeeChallan_studentProgramId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `FeeChallan_studentSectionId_fkey`;

-- DropForeignKey
ALTER TABLE `feestructure` DROP FOREIGN KEY `FeeStructure_classId_fkey`;

-- DropForeignKey
ALTER TABLE `feestructure` DROP FOREIGN KEY `FeeStructure_programId_fkey`;

-- DropForeignKey
ALTER TABLE `feestructurehead` DROP FOREIGN KEY `FeeStructureHead_feeHeadId_fkey`;

-- DropForeignKey
ALTER TABLE `feestructurehead` DROP FOREIGN KEY `FeeStructureHead_feeStructureId_fkey`;

-- DropForeignKey
ALTER TABLE `hostelregistration` DROP FOREIGN KEY `HostelRegistration_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `inquiry` DROP FOREIGN KEY `Inquiry_programInterest_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryexpense` DROP FOREIGN KEY `InventoryExpense_inventoryItemId_fkey`;

-- DropForeignKey
ALTER TABLE `leave` DROP FOREIGN KEY `Leave_approvedById_fkey`;

-- DropForeignKey
ALTER TABLE `leave` DROP FOREIGN KEY `Leave_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `marks` DROP FOREIGN KEY `Marks_examId_fkey`;

-- DropForeignKey
ALTER TABLE `marks` DROP FOREIGN KEY `Marks_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `payroll` DROP FOREIGN KEY `Payroll_staffId_fkey`;

-- DropForeignKey
ALTER TABLE `position` DROP FOREIGN KEY `Position_classId_fkey`;

-- DropForeignKey
ALTER TABLE `position` DROP FOREIGN KEY `Position_examId_fkey`;

-- DropForeignKey
ALTER TABLE `position` DROP FOREIGN KEY `Position_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `program` DROP FOREIGN KEY `Program_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `result` DROP FOREIGN KEY `Result_examId_fkey`;

-- DropForeignKey
ALTER TABLE `result` DROP FOREIGN KEY `Result_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `roomallocation` DROP FOREIGN KEY `RoomAllocation_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `roomallocation` DROP FOREIGN KEY `RoomAllocation_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `section` DROP FOREIGN KEY `Section_classId_fkey`;

-- DropForeignKey
ALTER TABLE `staff` DROP FOREIGN KEY `Staff_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `staffattendance` DROP FOREIGN KEY `StaffAttendance_markedBy_fkey`;

-- DropForeignKey
ALTER TABLE `staffattendance` DROP FOREIGN KEY `StaffAttendance_staffId_fkey`;

-- DropForeignKey
ALTER TABLE `staffleave` DROP FOREIGN KEY `StaffLeave_staffId_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `Student_classId_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `Student_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `Student_inquiryId_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `Student_programId_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `Student_sectionId_fkey`;

-- DropForeignKey
ALTER TABLE `studentarrear` DROP FOREIGN KEY `StudentArrear_classId_fkey`;

-- DropForeignKey
ALTER TABLE `studentarrear` DROP FOREIGN KEY `StudentArrear_programId_fkey`;

-- DropForeignKey
ALTER TABLE `studentarrear` DROP FOREIGN KEY `StudentArrear_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `studentfeeinstallment` DROP FOREIGN KEY `StudentFeeInstallment_classId_fkey`;

-- DropForeignKey
ALTER TABLE `studentfeeinstallment` DROP FOREIGN KEY `StudentFeeInstallment_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `studentstatushistory` DROP FOREIGN KEY `StudentStatusHistory_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `subject` DROP FOREIGN KEY `Subject_classId_fkey`;

-- DropForeignKey
ALTER TABLE `teacherclasssectionmapping` DROP FOREIGN KEY `TeacherClassSectionMapping_classId_fkey`;

-- DropForeignKey
ALTER TABLE `teacherclasssectionmapping` DROP FOREIGN KEY `TeacherClassSectionMapping_sectionId_fkey`;

-- DropForeignKey
ALTER TABLE `teacherclasssectionmapping` DROP FOREIGN KEY `TeacherClassSectionMapping_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `teachersubjectmapping` DROP FOREIGN KEY `TeacherSubjectMapping_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `teachersubjectmapping` DROP FOREIGN KEY `TeacherSubjectMapping_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `timetable` DROP FOREIGN KEY `Timetable_classId_fkey`;

-- DropForeignKey
ALTER TABLE `timetable` DROP FOREIGN KEY `Timetable_sectionId_fkey`;

-- DropForeignKey
ALTER TABLE `timetable` DROP FOREIGN KEY `Timetable_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `timetable` DROP FOREIGN KEY `Timetable_teacherId_fkey`;

-- AddForeignKey
ALTER TABLE `department` ADD CONSTRAINT `department_hodId_fkey` FOREIGN KEY (`hodId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program` ADD CONSTRAINT `program_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class` ADD CONSTRAINT `class_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `section` ADD CONSTRAINT `section_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject` ADD CONSTRAINT `subject_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `inquiry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentstatushistory` ADD CONSTRAINT `studentstatushistory_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teachersubjectmapping` ADD CONSTRAINT `teachersubjectmapping_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teachersubjectmapping` ADD CONSTRAINT `teachersubjectmapping_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacherclasssectionmapping` ADD CONSTRAINT `teacherclasssectionmapping_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacherclasssectionmapping` ADD CONSTRAINT `teacherclasssectionmapping_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacherclasssectionmapping` ADD CONSTRAINT `teacherclasssectionmapping_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment` ADD CONSTRAINT `assignment_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment` ADD CONSTRAINT `assignment_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment` ADD CONSTRAINT `assignment_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave` ADD CONSTRAINT `leave_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave` ADD CONSTRAINT `leave_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staffattendance` ADD CONSTRAINT `staffattendance_markedBy_fkey` FOREIGN KEY (`markedBy`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staffattendance` ADD CONSTRAINT `staffattendance_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiry` ADD CONSTRAINT `inquiry_programInterest_fkey` FOREIGN KEY (`programInterest`) REFERENCES `program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaintremark` ADD CONSTRAINT `complaintremark_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaintremark` ADD CONSTRAINT `complaintremark_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam` ADD CONSTRAINT `exam_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam` ADD CONSTRAINT `exam_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examschedule` ADD CONSTRAINT `examschedule_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examschedule` ADD CONSTRAINT `examschedule_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marks` ADD CONSTRAINT `marks_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marks` ADD CONSTRAINT `marks_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `result` ADD CONSTRAINT `result_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `result` ADD CONSTRAINT `result_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `position` ADD CONSTRAINT `position_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `position` ADD CONSTRAINT `position_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `position` ADD CONSTRAINT `position_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostelregistration` ADD CONSTRAINT `hostelregistration_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roomallocation` ADD CONSTRAINT `roomallocation_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roomallocation` ADD CONSTRAINT `roomallocation_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryexpense` ADD CONSTRAINT `inventoryexpense_inventoryItemId_fkey` FOREIGN KEY (`inventoryItemId`) REFERENCES `schoolinventory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feestructure` ADD CONSTRAINT `feestructure_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feestructure` ADD CONSTRAINT `feestructure_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feestructurehead` ADD CONSTRAINT `feestructurehead_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `feestructure`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feestructurehead` ADD CONSTRAINT `feestructurehead_feeHeadId_fkey` FOREIGN KEY (`feeHeadId`) REFERENCES `feehead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `feestructure`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_studentArrearId_fkey` FOREIGN KEY (`studentArrearId`) REFERENCES `studentarrear`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_studentClassId_fkey` FOREIGN KEY (`studentClassId`) REFERENCES `class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_studentProgramId_fkey` FOREIGN KEY (`studentProgramId`) REFERENCES `program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_studentSectionId_fkey` FOREIGN KEY (`studentSectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_studentFeeInstallmentId_fkey` FOREIGN KEY (`studentFeeInstallmentId`) REFERENCES `studentfeeinstallment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll` ADD CONSTRAINT `payroll_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staffleave` ADD CONSTRAINT `staffleave_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `advancesalary` ADD CONSTRAINT `advancesalary_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentarrear` ADD CONSTRAINT `studentarrear_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentarrear` ADD CONSTRAINT `studentarrear_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentarrear` ADD CONSTRAINT `studentarrear_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentfeeinstallment` ADD CONSTRAINT `studentfeeinstallment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentfeeinstallment` ADD CONSTRAINT `studentfeeinstallment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `advancesalary` RENAME INDEX `AdvanceSalary_month_idx` TO `advancesalary_month_idx`;

-- RenameIndex
ALTER TABLE `advancesalary` RENAME INDEX `AdvanceSalary_staffId_idx` TO `advancesalary_staffId_idx`;

-- RenameIndex
ALTER TABLE `attendance` RENAME INDEX `Attendance_classId_sectionId_date_idx` TO `attendance_classId_sectionId_date_idx`;

-- RenameIndex
ALTER TABLE `attendance` RENAME INDEX `Attendance_studentId_classId_sectionId_subjectId_date_key` TO `attendance_studentId_classId_sectionId_subjectId_date_key`;

-- RenameIndex
ALTER TABLE `attendance` RENAME INDEX `Attendance_teacherId_subjectId_date_idx` TO `attendance_teacherId_subjectId_date_idx`;

-- RenameIndex
ALTER TABLE `class` RENAME INDEX `Class_id_key` TO `class_id_key`;

-- RenameIndex
ALTER TABLE `class` RENAME INDEX `Class_programId_year_semester_key` TO `class_programId_year_semester_key`;

-- RenameIndex
ALTER TABLE `complaint` RENAME INDEX `Complaint_id_key` TO `complaint_id_key`;

-- RenameIndex
ALTER TABLE `complaint` RENAME INDEX `Complaint_type_idx` TO `complaint_type_idx`;

-- RenameIndex
ALTER TABLE `complaintremark` RENAME INDEX `ComplaintRemark_authorId_idx` TO `complaintremark_authorId_idx`;

-- RenameIndex
ALTER TABLE `complaintremark` RENAME INDEX `ComplaintRemark_complaintId_idx` TO `complaintremark_complaintId_idx`;

-- RenameIndex
ALTER TABLE `contact` RENAME INDEX `Contact_category_idx` TO `contact_category_idx`;

-- RenameIndex
ALTER TABLE `contact` RENAME INDEX `Contact_id_key` TO `contact_id_key`;

-- RenameIndex
ALTER TABLE `department` RENAME INDEX `Department_hodId_key` TO `department_hodId_key`;

-- RenameIndex
ALTER TABLE `department` RENAME INDEX `Department_name_key` TO `department_name_key`;

-- RenameIndex
ALTER TABLE `examschedule` RENAME INDEX `ExamSchedule_examId_subjectId_key` TO `examschedule_examId_subjectId_key`;

-- RenameIndex
ALTER TABLE `feechallan` RENAME INDEX `FeeChallan_challanNumber_key` TO `feechallan_challanNumber_key`;

-- RenameIndex
ALTER TABLE `feechallan` RENAME INDEX `FeeChallan_status_idx` TO `feechallan_status_idx`;

-- RenameIndex
ALTER TABLE `feechallan` RENAME INDEX `FeeChallan_studentClassId_idx` TO `feechallan_studentClassId_idx`;

-- RenameIndex
ALTER TABLE `feechallan` RENAME INDEX `FeeChallan_studentId_idx` TO `feechallan_studentId_idx`;

-- RenameIndex
ALTER TABLE `feechallan` RENAME INDEX `FeeChallan_studentProgramId_idx` TO `feechallan_studentProgramId_idx`;

-- RenameIndex
ALTER TABLE `feechallan` RENAME INDEX `FeeChallan_studentSectionId_idx` TO `feechallan_studentSectionId_idx`;

-- RenameIndex
ALTER TABLE `feehead` RENAME INDEX `FeeHead_name_key` TO `feehead_name_key`;

-- RenameIndex
ALTER TABLE `feestructure` RENAME INDEX `FeeStructure_programId_classId_key` TO `feestructure_programId_classId_key`;

-- RenameIndex
ALTER TABLE `feestructurehead` RENAME INDEX `FeeStructureHead_feeStructureId_feeHeadId_key` TO `feestructurehead_feeStructureId_feeHeadId_key`;

-- RenameIndex
ALTER TABLE `financeclosing` RENAME INDEX `FinanceClosing_date_idx` TO `financeclosing_date_idx`;

-- RenameIndex
ALTER TABLE `financeexpense` RENAME INDEX `FinanceExpense_category_idx` TO `financeexpense_category_idx`;

-- RenameIndex
ALTER TABLE `financeexpense` RENAME INDEX `FinanceExpense_date_idx` TO `financeexpense_date_idx`;

-- RenameIndex
ALTER TABLE `financeincome` RENAME INDEX `FinanceIncome_category_idx` TO `financeincome_category_idx`;

-- RenameIndex
ALTER TABLE `financeincome` RENAME INDEX `FinanceIncome_date_idx` TO `financeincome_date_idx`;

-- RenameIndex
ALTER TABLE `hostelexpense` RENAME INDEX `HostelExpense_date_idx` TO `hostelexpense_date_idx`;

-- RenameIndex
ALTER TABLE `hostelregistration` RENAME INDEX `HostelRegistration_studentId_idx` TO `hostelregistration_studentId_idx`;

-- RenameIndex
ALTER TABLE `inquiry` RENAME INDEX `Inquiry_id_key` TO `inquiry_id_key`;

-- RenameIndex
ALTER TABLE `inquiry` RENAME INDEX `Inquiry_programInterest_idx` TO `inquiry_programInterest_idx`;

-- RenameIndex
ALTER TABLE `inventoryexpense` RENAME INDEX `InventoryExpense_date_idx` TO `inventoryexpense_date_idx`;

-- RenameIndex
ALTER TABLE `inventoryexpense` RENAME INDEX `InventoryExpense_inventoryItemId_idx` TO `inventoryexpense_inventoryItemId_idx`;

-- RenameIndex
ALTER TABLE `leave` RENAME INDEX `Leave_id_key` TO `leave_id_key`;

-- RenameIndex
ALTER TABLE `marks` RENAME INDEX `Marks_studentId_examId_subject_key` TO `marks_studentId_examId_subject_key`;

-- RenameIndex
ALTER TABLE `payroll` RENAME INDEX `Payroll_staffId_month_key` TO `payroll_staffId_month_key`;

-- RenameIndex
ALTER TABLE `position` RENAME INDEX `Position_examId_classId_idx` TO `position_examId_classId_idx`;

-- RenameIndex
ALTER TABLE `position` RENAME INDEX `Position_examId_classId_studentId_key` TO `position_examId_classId_studentId_key`;

-- RenameIndex
ALTER TABLE `program` RENAME INDEX `Program_name_departmentId_key` TO `program_name_departmentId_key`;

-- RenameIndex
ALTER TABLE `room` RENAME INDEX `Room_roomNumber_key` TO `room_roomNumber_key`;

-- RenameIndex
ALTER TABLE `roomallocation` RENAME INDEX `RoomAllocation_roomId_idx` TO `roomallocation_roomId_idx`;

-- RenameIndex
ALTER TABLE `roomallocation` RENAME INDEX `RoomAllocation_roomId_studentId_key` TO `roomallocation_roomId_studentId_key`;

-- RenameIndex
ALTER TABLE `roomallocation` RENAME INDEX `RoomAllocation_studentId_idx` TO `roomallocation_studentId_idx`;

-- RenameIndex
ALTER TABLE `schoolinventory` RENAME INDEX `SchoolInventory_assignedTo_idx` TO `schoolinventory_assignedTo_idx`;

-- RenameIndex
ALTER TABLE `schoolinventory` RENAME INDEX `SchoolInventory_category_idx` TO `schoolinventory_category_idx`;

-- RenameIndex
ALTER TABLE `schoolinventory` RENAME INDEX `SchoolInventory_condition_idx` TO `schoolinventory_condition_idx`;

-- RenameIndex
ALTER TABLE `section` RENAME INDEX `Section_classId_name_key` TO `section_classId_name_key`;

-- RenameIndex
ALTER TABLE `staff` RENAME INDEX `Staff_cnic_key` TO `staff_cnic_key`;

-- RenameIndex
ALTER TABLE `staff` RENAME INDEX `Staff_email_key` TO `staff_email_key`;

-- RenameIndex
ALTER TABLE `staff` RENAME INDEX `Staff_empDepartment_idx` TO `staff_empDepartment_idx`;

-- RenameIndex
ALTER TABLE `staff` RENAME INDEX `Staff_id_key` TO `staff_id_key`;

-- RenameIndex
ALTER TABLE `staff` RENAME INDEX `Staff_status_idx` TO `staff_status_idx`;

-- RenameIndex
ALTER TABLE `staffattendance` RENAME INDEX `StaffAttendance_staffId_date_key` TO `staffattendance_staffId_date_key`;

-- RenameIndex
ALTER TABLE `staffleave` RENAME INDEX `StaffLeave_staffId_month_idx` TO `staffleave_staffId_month_idx`;

-- RenameIndex
ALTER TABLE `student` RENAME INDEX `Student_id_key` TO `student_id_key`;

-- RenameIndex
ALTER TABLE `student` RENAME INDEX `Student_inquiryId_key` TO `student_inquiryId_key`;

-- RenameIndex
ALTER TABLE `student` RENAME INDEX `Student_rollNumber_key` TO `student_rollNumber_key`;

-- RenameIndex
ALTER TABLE `studentarrear` RENAME INDEX `StudentArrear_studentId_classId_programId_key` TO `studentarrear_studentId_classId_programId_key`;

-- RenameIndex
ALTER TABLE `studentfeeinstallment` RENAME INDEX `StudentFeeInstallment_studentId_classId_idx` TO `studentfeeinstallment_studentId_classId_idx`;

-- RenameIndex
ALTER TABLE `studentfeeinstallment` RENAME INDEX `StudentFeeInstallment_studentId_classId_installmentNumber_key` TO `studentfeeinstallment_studentId_classId_installmentNumber_key`;

-- RenameIndex
ALTER TABLE `subject` RENAME INDEX `Subject_code_key` TO `subject_code_key`;

-- RenameIndex
ALTER TABLE `teacherclasssectionmapping` RENAME INDEX `TeacherClassSectionMapping_classId_sectionId_idx` TO `teacherclasssectionmapping_classId_sectionId_idx`;

-- RenameIndex
ALTER TABLE `teacherclasssectionmapping` RENAME INDEX `TeacherClassSectionMapping_id_key` TO `teacherclasssectionmapping_id_key`;

-- RenameIndex
ALTER TABLE `teacherclasssectionmapping` RENAME INDEX `TeacherClassSectionMapping_teacherId_classId_sectionId_key` TO `teacherclasssectionmapping_teacherId_classId_sectionId_key`;

-- RenameIndex
ALTER TABLE `teachersubjectmapping` RENAME INDEX `TeacherSubjectMapping_teacherId_subjectId_key` TO `teachersubjectmapping_teacherId_subjectId_key`;

-- RenameIndex
ALTER TABLE `timetable` RENAME INDEX `Timetable_sectionId_classId_dayOfWeek_startTime_key` TO `timetable_sectionId_classId_dayOfWeek_startTime_key`;

-- RenameIndex
ALTER TABLE `visitor` RENAME INDEX `Visitor_date_idx` TO `visitor_date_idx`;

-- RenameIndex
ALTER TABLE `visitor` RENAME INDEX `Visitor_id_key` TO `visitor_id_key`;
