/*
  Warnings:

  - You are about to drop the `advancesalary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `examschedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feechallan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feechallantemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feehead` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feestructure` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feestructurehead` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `financeclosing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `financeexpense` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `financeincome` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hostelexpense` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hostelinventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hostelregistration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `institutesettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventoryexpense` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payrollsettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payrolltemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reportcardtemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roomallocation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schoolinventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staffattendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staffidcardtemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staffleave` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `studentarrear` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `studentfeeinstallment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `studentidcardtemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `studentstatushistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacherclasssectionmapping` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teachersubjectmapping` table. If the table is not empty, all the data it contains will be lost.

*/
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
ALTER TABLE `complaint` DROP FOREIGN KEY `Complaint_assignedToId_fkey`;

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

-- DropTable
DROP TABLE `advancesalary`;

-- DropTable
DROP TABLE `examschedule`;

-- DropTable
DROP TABLE `feechallan`;

-- DropTable
DROP TABLE `feechallantemplate`;

-- DropTable
DROP TABLE `feehead`;

-- DropTable
DROP TABLE `feestructure`;

-- DropTable
DROP TABLE `feestructurehead`;

-- DropTable
DROP TABLE `financeclosing`;

-- DropTable
DROP TABLE `financeexpense`;

-- DropTable
DROP TABLE `financeincome`;

-- DropTable
DROP TABLE `hostelexpense`;

-- DropTable
DROP TABLE `hostelinventory`;

-- DropTable
DROP TABLE `hostelregistration`;

-- DropTable
DROP TABLE `institutesettings`;

-- DropTable
DROP TABLE `inventoryexpense`;

-- DropTable
DROP TABLE `payrollsettings`;

-- DropTable
DROP TABLE `payrolltemplate`;

-- DropTable
DROP TABLE `reportcardtemplate`;

-- DropTable
DROP TABLE `roomallocation`;

-- DropTable
DROP TABLE `schoolinventory`;

-- DropTable
DROP TABLE `staffattendance`;

-- DropTable
DROP TABLE `staffidcardtemplate`;

-- DropTable
DROP TABLE `staffleave`;

-- DropTable
DROP TABLE `studentarrear`;

-- DropTable
DROP TABLE `studentfeeinstallment`;

-- DropTable
DROP TABLE `studentidcardtemplate`;

-- DropTable
DROP TABLE `studentstatushistory`;

-- DropTable
DROP TABLE `teacherclasssectionmapping`;

-- DropTable
DROP TABLE `teachersubjectmapping`;

-- CreateTable
CREATE TABLE `student_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `previousStatus` ENUM('ACTIVE', 'EXPELLED', 'STRUCK_OFF', 'GRADUATED') NULL,
    `newStatus` ENUM('ACTIVE', 'EXPELLED', 'STRUCK_OFF', 'GRADUATED') NOT NULL,
    `reason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_subject_mapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teacher_subject_mapping_teacherId_subjectId_key`(`teacherId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_class_section_mapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `sectionId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teacher_class_section_mapping_id_key`(`id`),
    INDEX `teacher_class_section_mapping_classId_sectionId_idx`(`classId`, `sectionId`),
    UNIQUE INDEX `teacher_class_section_mapping_teacherId_classId_sectionId_key`(`teacherId`, `classId`, `sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `staffId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY', 'HOLIDAY') NOT NULL DEFAULT 'PRESENT',
    `markedBy` INTEGER NULL,
    `markedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `autoGenerated` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `staff_attendance_staffId_date_key`(`staffId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_schedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `examId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `startTime` VARCHAR(10) NOT NULL,
    `endTime` VARCHAR(10) NOT NULL,
    `totalMarks` INTEGER NOT NULL DEFAULT 100,
    `room` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exam_schedule_examId_subjectId_key`(`examId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_card_template` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `htmlContent` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostel_registration` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` INTEGER NULL,
    `externalName` VARCHAR(100) NULL,
    `externalInstitute` VARCHAR(100) NULL,
    `externalGuardianName` VARCHAR(100) NULL,
    `externalGuardianNumber` VARCHAR(20) NULL,
    `hostelName` VARCHAR(100) NOT NULL,
    `registrationDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `hostel_registration_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_allocation` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `studentId` INTEGER NULL,
    `externalName` VARCHAR(100) NULL,
    `allocationDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `room_allocation_roomId_idx`(`roomId`),
    INDEX `room_allocation_studentId_idx`(`studentId`),
    UNIQUE INDEX `room_allocation_roomId_studentId_key`(`roomId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostel_expense` (
    `id` VARCHAR(191) NOT NULL,
    `expenseTitle` VARCHAR(200) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `hostel_expense_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostel_inventory` (
    `id` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(200) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `condition` VARCHAR(20) NOT NULL,
    `allocatedToRoom` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_inventory` (
    `id` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(200) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `totalValue` DOUBLE NOT NULL,
    `purchaseDate` DATE NOT NULL,
    `supplier` VARCHAR(200) NOT NULL,
    `condition` VARCHAR(20) NOT NULL,
    `location` VARCHAR(200) NOT NULL,
    `assignedTo` VARCHAR(50) NULL,
    `assignedToName` VARCHAR(200) NULL,
    `assignedDate` DATE NULL,
    `maintenanceCost` DOUBLE NULL DEFAULT 0,
    `lastMaintenanceDate` DATE NULL,
    `warrantyExpiry` DATE NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `school_inventory_category_idx`(`category`),
    INDEX `school_inventory_assignedTo_idx`(`assignedTo`),
    INDEX `school_inventory_condition_idx`(`condition`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_expense` (
    `id` VARCHAR(191) NOT NULL,
    `inventoryItemId` VARCHAR(191) NOT NULL,
    `expenseType` VARCHAR(50) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `date` DATE NOT NULL,
    `description` TEXT NOT NULL,
    `vendor` VARCHAR(200) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `inventory_expense_inventoryItemId_idx`(`inventoryItemId`),
    INDEX `inventory_expense_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `absentDeduction` DOUBLE NOT NULL DEFAULT 0,
    `leaveDeduction` DOUBLE NOT NULL DEFAULT 0,
    `leavesAllowed` INTEGER NOT NULL DEFAULT 0,
    `absentsAllowed` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_head` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `amount` DOUBLE NOT NULL,
    `isDiscount` BOOLEAN NOT NULL DEFAULT false,
    `isTuition` BOOLEAN NOT NULL DEFAULT false,
    `isFine` BOOLEAN NOT NULL DEFAULT false,
    `isLabFee` BOOLEAN NOT NULL DEFAULT false,
    `isLibraryFee` BOOLEAN NOT NULL DEFAULT false,
    `isRegistrationFee` BOOLEAN NOT NULL DEFAULT false,
    `isAdmissionFee` BOOLEAN NOT NULL DEFAULT false,
    `isProspectusFee` BOOLEAN NOT NULL DEFAULT false,
    `isExaminationFee` BOOLEAN NOT NULL DEFAULT false,
    `isAlliedCharges` BOOLEAN NOT NULL DEFAULT false,
    `isHostelFee` BOOLEAN NOT NULL DEFAULT false,
    `isOther` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fee_head_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_structure` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `programId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `installments` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fee_structure_programId_classId_key`(`programId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_structure_head` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `feeStructureId` INTEGER NOT NULL,
    `feeHeadId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,

    UNIQUE INDEX `fee_structure_head_feeStructureId_feeHeadId_key`(`feeStructureId`, `feeHeadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_challan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `challanNumber` VARCHAR(50) NOT NULL,
    `studentId` INTEGER NOT NULL,
    `feeStructureId` INTEGER NULL,
    `amount` DOUBLE NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `tuitionPaid` DOUBLE NOT NULL DEFAULT 0,
    `additionalPaid` DOUBLE NOT NULL DEFAULT 0,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `fineAmount` DOUBLE NOT NULL DEFAULT 0,
    `dueDate` DATE NOT NULL,
    `issueDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paidDate` DATE NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE', 'PARTIAL') NOT NULL DEFAULT 'PENDING',
    `installmentNumber` INTEGER NOT NULL DEFAULT 1,
    `coveredInstallments` VARCHAR(50) NULL,
    `selectedHeads` TEXT NULL,
    `remarks` TEXT NULL,
    `challanType` ENUM('INSTALLMENT', 'ARREARS_ONLY', 'FEE_HEADS_ONLY', 'MIXED') NULL,
    `includesArrears` BOOLEAN NOT NULL DEFAULT false,
    `arrearsAmount` DOUBLE NOT NULL DEFAULT 0,
    `studentArrearId` INTEGER NULL,
    `studentClassId` INTEGER NULL,
    `studentProgramId` INTEGER NULL,
    `studentSectionId` INTEGER NULL,
    `studentFeeInstallmentId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fee_challan_challanNumber_key`(`challanNumber`),
    INDEX `fee_challan_studentId_idx`(`studentId`),
    INDEX `fee_challan_status_idx`(`status`),
    INDEX `fee_challan_studentClassId_idx`(`studentClassId`),
    INDEX `fee_challan_studentProgramId_idx`(`studentProgramId`),
    INDEX `fee_challan_studentSectionId_idx`(`studentSectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_leave` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `month` VARCHAR(7) NOT NULL,
    `staffId` INTEGER NULL,
    `employeeId` INTEGER NULL,
    `teacherId` INTEGER NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `days` INTEGER NOT NULL DEFAULT 0,
    `reason` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `staff_leave_staffId_month_idx`(`staffId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `advance_salary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `staffId` INTEGER NULL,
    `employeeId` INTEGER NULL,
    `teacherId` INTEGER NULL,
    `amount` DOUBLE NOT NULL,
    `month` VARCHAR(7) NOT NULL,
    `remarks` TEXT NULL,
    `adjusted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `advance_salary_staffId_idx`(`staffId`),
    INDEX `advance_salary_month_idx`(`month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `finance_income` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `finance_income_date_idx`(`date`),
    INDEX `finance_income_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `finance_expense` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `finance_expense_date_idx`(`date`),
    INDEX `finance_expense_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `finance_closing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `totalIncome` DOUBLE NOT NULL,
    `totalExpense` DOUBLE NOT NULL,
    `netBalance` DOUBLE NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `finance_closing_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `institute_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instituteName` VARCHAR(200) NOT NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `facebook` VARCHAR(255) NULL,
    `instagram` VARCHAR(255) NULL,
    `logo` VARCHAR(500) NULL,
    `challanPrefix` VARCHAR(20) NULL DEFAULT '',
    `lateFeeFine` DOUBLE NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_arrear` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `programId` INTEGER NOT NULL,
    `arrearAmount` DOUBLE NOT NULL,
    `lastInstallmentNumber` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_arrear_studentId_classId_programId_key`(`studentId`, `classId`, `programId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_template` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `htmlContent` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_challan_template` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `htmlContent` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_id_card_template` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `htmlContent` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_id_card_template` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `htmlContent` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_fee_installment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `installmentNumber` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `pendingAmount` DOUBLE NOT NULL DEFAULT 0,
    `remainingAmount` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'PENDING',
    `dueDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_fee_installment_studentId_classId_idx`(`studentId`, `classId`),
    UNIQUE INDEX `student_fee_installment_studentId_classId_installmentNumber_key`(`studentId`, `classId`, `installmentNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `department` ADD CONSTRAINT `department_hodId_fkey` FOREIGN KEY (`hodId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program` ADD CONSTRAINT `program_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class` ADD CONSTRAINT `class_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `section` ADD CONSTRAINT `section_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `student_status_history` ADD CONSTRAINT `student_status_history_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_subject_mapping` ADD CONSTRAINT `teacher_subject_mapping_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_subject_mapping` ADD CONSTRAINT `teacher_subject_mapping_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_class_section_mapping` ADD CONSTRAINT `teacher_class_section_mapping_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_class_section_mapping` ADD CONSTRAINT `teacher_class_section_mapping_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_class_section_mapping` ADD CONSTRAINT `teacher_class_section_mapping_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable` ADD CONSTRAINT `timetable_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment` ADD CONSTRAINT `assignment_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave` ADD CONSTRAINT `leave_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave` ADD CONSTRAINT `leave_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_markedBy_fkey` FOREIGN KEY (`markedBy`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiry` ADD CONSTRAINT `inquiry_programInterest_fkey` FOREIGN KEY (`programInterest`) REFERENCES `program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint` ADD CONSTRAINT `complaint_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam` ADD CONSTRAINT `exam_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam` ADD CONSTRAINT `exam_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedule` ADD CONSTRAINT `exam_schedule_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedule` ADD CONSTRAINT `exam_schedule_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `hostel_registration` ADD CONSTRAINT `hostel_registration_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_allocation` ADD CONSTRAINT `room_allocation_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_allocation` ADD CONSTRAINT `room_allocation_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_expense` ADD CONSTRAINT `inventory_expense_inventoryItemId_fkey` FOREIGN KEY (`inventoryItemId`) REFERENCES `school_inventory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structure` ADD CONSTRAINT `fee_structure_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structure` ADD CONSTRAINT `fee_structure_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structure_head` ADD CONSTRAINT `fee_structure_head_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `fee_structure`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structure_head` ADD CONSTRAINT `fee_structure_head_feeHeadId_fkey` FOREIGN KEY (`feeHeadId`) REFERENCES `fee_head`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_challan` ADD CONSTRAINT `fee_challan_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_challan` ADD CONSTRAINT `fee_challan_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `fee_structure`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_challan` ADD CONSTRAINT `fee_challan_studentArrearId_fkey` FOREIGN KEY (`studentArrearId`) REFERENCES `student_arrear`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_challan` ADD CONSTRAINT `fee_challan_studentClassId_fkey` FOREIGN KEY (`studentClassId`) REFERENCES `class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_challan` ADD CONSTRAINT `fee_challan_studentProgramId_fkey` FOREIGN KEY (`studentProgramId`) REFERENCES `program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_challan` ADD CONSTRAINT `fee_challan_studentSectionId_fkey` FOREIGN KEY (`studentSectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_challan` ADD CONSTRAINT `fee_challan_studentFeeInstallmentId_fkey` FOREIGN KEY (`studentFeeInstallmentId`) REFERENCES `student_fee_installment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll` ADD CONSTRAINT `payroll_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_leave` ADD CONSTRAINT `staff_leave_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `advance_salary` ADD CONSTRAINT `advance_salary_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_arrear` ADD CONSTRAINT `student_arrear_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_arrear` ADD CONSTRAINT `student_arrear_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_arrear` ADD CONSTRAINT `student_arrear_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fee_installment` ADD CONSTRAINT `student_fee_installment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fee_installment` ADD CONSTRAINT `student_fee_installment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE `complaint` RENAME INDEX `Complaint_assignedToId_idx` TO `complaint_assignedToId_idx`;

-- RenameIndex
ALTER TABLE `complaint` RENAME INDEX `Complaint_id_key` TO `complaint_id_key`;

-- RenameIndex
ALTER TABLE `complaint` RENAME INDEX `Complaint_type_idx` TO `complaint_type_idx`;

-- RenameIndex
ALTER TABLE `contact` RENAME INDEX `Contact_category_idx` TO `contact_category_idx`;

-- RenameIndex
ALTER TABLE `contact` RENAME INDEX `Contact_id_key` TO `contact_id_key`;

-- RenameIndex
ALTER TABLE `department` RENAME INDEX `Department_hodId_key` TO `department_hodId_key`;

-- RenameIndex
ALTER TABLE `department` RENAME INDEX `Department_name_key` TO `department_name_key`;

-- RenameIndex
ALTER TABLE `inquiry` RENAME INDEX `Inquiry_id_key` TO `inquiry_id_key`;

-- RenameIndex
ALTER TABLE `inquiry` RENAME INDEX `Inquiry_programInterest_idx` TO `inquiry_programInterest_idx`;

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
ALTER TABLE `section` RENAME INDEX `Section_classId_name_key` TO `section_classId_name_key`;

-- RenameIndex
ALTER TABLE `student` RENAME INDEX `Student_id_key` TO `student_id_key`;

-- RenameIndex
ALTER TABLE `student` RENAME INDEX `Student_inquiryId_key` TO `student_inquiryId_key`;

-- RenameIndex
ALTER TABLE `student` RENAME INDEX `Student_rollNumber_key` TO `student_rollNumber_key`;

-- RenameIndex
ALTER TABLE `subject` RENAME INDEX `Subject_code_key` TO `subject_code_key`;

-- RenameIndex
ALTER TABLE `timetable` RENAME INDEX `Timetable_sectionId_classId_dayOfWeek_startTime_key` TO `timetable_sectionId_classId_dayOfWeek_startTime_key`;

-- RenameIndex
ALTER TABLE `visitor` RENAME INDEX `Visitor_date_idx` TO `visitor_date_idx`;

-- RenameIndex
ALTER TABLE `visitor` RENAME INDEX `Visitor_id_key` TO `visitor_id_key`;
