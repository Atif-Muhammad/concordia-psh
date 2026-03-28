/*
  Warnings:

  - You are about to alter the column `remarks` on the `inquiry` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.
  - You are about to drop the `advance_salary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `complaint_remark` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exam_schedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fee_challan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fee_challan_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fee_head` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fee_structure` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fee_structure_head` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `finance_closing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `finance_expense` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `finance_income` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hostel_expense` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hostel_inventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hostel_registration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `institute_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inventory_expense` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payroll_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report_card_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `room_allocation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_inventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staff_attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staff_id_card_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staff_leave` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_arrear` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_fee_installment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_id_card_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_status_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_class_section_mapping` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_subject_mapping` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `advance_salary` DROP FOREIGN KEY `advance_salary_staffId_fkey`;

-- DropForeignKey
ALTER TABLE `assignment` DROP FOREIGN KEY `assignment_sectionId_fkey`;

-- DropForeignKey
ALTER TABLE `assignment` DROP FOREIGN KEY `assignment_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `assignment` DROP FOREIGN KEY `assignment_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `attendance_classId_fkey`;

-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `attendance_sectionId_fkey`;

-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `attendance_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `attendance_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `attendance_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `class` DROP FOREIGN KEY `class_programId_fkey`;

-- DropForeignKey
ALTER TABLE `complaint_remark` DROP FOREIGN KEY `complaint_remark_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `complaint_remark` DROP FOREIGN KEY `complaint_remark_complaintId_fkey`;

-- DropForeignKey
ALTER TABLE `department` DROP FOREIGN KEY `department_hodId_fkey`;

-- DropForeignKey
ALTER TABLE `exam` DROP FOREIGN KEY `exam_classId_fkey`;

-- DropForeignKey
ALTER TABLE `exam` DROP FOREIGN KEY `exam_programId_fkey`;

-- DropForeignKey
ALTER TABLE `exam_schedule` DROP FOREIGN KEY `exam_schedule_examId_fkey`;

-- DropForeignKey
ALTER TABLE `exam_schedule` DROP FOREIGN KEY `exam_schedule_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_challan` DROP FOREIGN KEY `fee_challan_feeStructureId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_challan` DROP FOREIGN KEY `fee_challan_studentArrearId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_challan` DROP FOREIGN KEY `fee_challan_studentClassId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_challan` DROP FOREIGN KEY `fee_challan_studentFeeInstallmentId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_challan` DROP FOREIGN KEY `fee_challan_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_challan` DROP FOREIGN KEY `fee_challan_studentProgramId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_challan` DROP FOREIGN KEY `fee_challan_studentSectionId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_structure` DROP FOREIGN KEY `fee_structure_classId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_structure` DROP FOREIGN KEY `fee_structure_programId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_structure_head` DROP FOREIGN KEY `fee_structure_head_feeHeadId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_structure_head` DROP FOREIGN KEY `fee_structure_head_feeStructureId_fkey`;

-- DropForeignKey
ALTER TABLE `hostel_registration` DROP FOREIGN KEY `hostel_registration_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `inquiry` DROP FOREIGN KEY `inquiry_programInterest_fkey`;

-- DropForeignKey
ALTER TABLE `inventory_expense` DROP FOREIGN KEY `inventory_expense_inventoryItemId_fkey`;

-- DropForeignKey
ALTER TABLE `leave` DROP FOREIGN KEY `leave_approvedById_fkey`;

-- DropForeignKey
ALTER TABLE `leave` DROP FOREIGN KEY `leave_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `marks` DROP FOREIGN KEY `marks_examId_fkey`;

-- DropForeignKey
ALTER TABLE `marks` DROP FOREIGN KEY `marks_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `payroll` DROP FOREIGN KEY `payroll_staffId_fkey`;

-- DropForeignKey
ALTER TABLE `position` DROP FOREIGN KEY `position_classId_fkey`;

-- DropForeignKey
ALTER TABLE `position` DROP FOREIGN KEY `position_examId_fkey`;

-- DropForeignKey
ALTER TABLE `position` DROP FOREIGN KEY `position_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `program` DROP FOREIGN KEY `program_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `result` DROP FOREIGN KEY `result_examId_fkey`;

-- DropForeignKey
ALTER TABLE `result` DROP FOREIGN KEY `result_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `room_allocation` DROP FOREIGN KEY `room_allocation_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `room_allocation` DROP FOREIGN KEY `room_allocation_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `section` DROP FOREIGN KEY `section_classId_fkey`;

-- DropForeignKey
ALTER TABLE `staff_attendance` DROP FOREIGN KEY `staff_attendance_markedBy_fkey`;

-- DropForeignKey
ALTER TABLE `staff_attendance` DROP FOREIGN KEY `staff_attendance_staffId_fkey`;

-- DropForeignKey
ALTER TABLE `staff_leave` DROP FOREIGN KEY `staff_leave_staffId_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `student_classId_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `student_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `student_inquiryId_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `student_programId_fkey`;

-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `student_sectionId_fkey`;

-- DropForeignKey
ALTER TABLE `student_arrear` DROP FOREIGN KEY `student_arrear_classId_fkey`;

-- DropForeignKey
ALTER TABLE `student_arrear` DROP FOREIGN KEY `student_arrear_programId_fkey`;

-- DropForeignKey
ALTER TABLE `student_arrear` DROP FOREIGN KEY `student_arrear_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `student_fee_installment` DROP FOREIGN KEY `student_fee_installment_classId_fkey`;

-- DropForeignKey
ALTER TABLE `student_fee_installment` DROP FOREIGN KEY `student_fee_installment_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `student_status_history` DROP FOREIGN KEY `student_status_history_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `subject` DROP FOREIGN KEY `subject_classId_fkey`;

-- DropForeignKey
ALTER TABLE `teacher_class_section_mapping` DROP FOREIGN KEY `teacher_class_section_mapping_classId_fkey`;

-- DropForeignKey
ALTER TABLE `teacher_class_section_mapping` DROP FOREIGN KEY `teacher_class_section_mapping_sectionId_fkey`;

-- DropForeignKey
ALTER TABLE `teacher_class_section_mapping` DROP FOREIGN KEY `teacher_class_section_mapping_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `teacher_subject_mapping` DROP FOREIGN KEY `teacher_subject_mapping_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `teacher_subject_mapping` DROP FOREIGN KEY `teacher_subject_mapping_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `timetable` DROP FOREIGN KEY `timetable_classId_fkey`;

-- DropForeignKey
ALTER TABLE `timetable` DROP FOREIGN KEY `timetable_sectionId_fkey`;

-- DropForeignKey
ALTER TABLE `timetable` DROP FOREIGN KEY `timetable_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `timetable` DROP FOREIGN KEY `timetable_teacherId_fkey`;

-- AlterTable
ALTER TABLE `inquiry` MODIFY `remarks` JSON NULL;

-- DropTable
DROP TABLE `advance_salary`;

-- DropTable
DROP TABLE `complaint_remark`;

-- DropTable
DROP TABLE `exam_schedule`;

-- DropTable
DROP TABLE `fee_challan`;

-- DropTable
DROP TABLE `fee_challan_template`;

-- DropTable
DROP TABLE `fee_head`;

-- DropTable
DROP TABLE `fee_structure`;

-- DropTable
DROP TABLE `fee_structure_head`;

-- DropTable
DROP TABLE `finance_closing`;

-- DropTable
DROP TABLE `finance_expense`;

-- DropTable
DROP TABLE `finance_income`;

-- DropTable
DROP TABLE `hostel_expense`;

-- DropTable
DROP TABLE `hostel_inventory`;

-- DropTable
DROP TABLE `hostel_registration`;

-- DropTable
DROP TABLE `institute_settings`;

-- DropTable
DROP TABLE `inventory_expense`;

-- DropTable
DROP TABLE `payroll_settings`;

-- DropTable
DROP TABLE `payroll_template`;

-- DropTable
DROP TABLE `report_card_template`;

-- DropTable
DROP TABLE `room_allocation`;

-- DropTable
DROP TABLE `school_inventory`;

-- DropTable
DROP TABLE `staff_attendance`;

-- DropTable
DROP TABLE `staff_id_card_template`;

-- DropTable
DROP TABLE `staff_leave`;

-- DropTable
DROP TABLE `student_arrear`;

-- DropTable
DROP TABLE `student_fee_installment`;

-- DropTable
DROP TABLE `student_id_card_template`;

-- DropTable
DROP TABLE `student_status_history`;

-- DropTable
DROP TABLE `teacher_class_section_mapping`;

-- DropTable
DROP TABLE `teacher_subject_mapping`;

-- CreateTable
CREATE TABLE `StudentStatusHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `previousStatus` ENUM('ACTIVE', 'EXPELLED', 'STRUCK_OFF', 'GRADUATED') NULL,
    `newStatus` ENUM('ACTIVE', 'EXPELLED', 'STRUCK_OFF', 'GRADUATED') NOT NULL,
    `reason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeacherSubjectMapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TeacherSubjectMapping_teacherId_subjectId_key`(`teacherId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeacherClassSectionMapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `sectionId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TeacherClassSectionMapping_id_key`(`id`),
    INDEX `TeacherClassSectionMapping_classId_sectionId_idx`(`classId`, `sectionId`),
    UNIQUE INDEX `TeacherClassSectionMapping_teacherId_classId_sectionId_key`(`teacherId`, `classId`, `sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffAttendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `staffId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY', 'HOLIDAY') NOT NULL DEFAULT 'PRESENT',
    `markedBy` INTEGER NULL,
    `markedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `autoGenerated` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `StaffAttendance_staffId_date_key`(`staffId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComplaintRemark` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `complaintId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `remark` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ComplaintRemark_complaintId_idx`(`complaintId`),
    INDEX `ComplaintRemark_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamSchedule` (
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

    UNIQUE INDEX `ExamSchedule_examId_subjectId_key`(`examId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportCardTemplate` (
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
CREATE TABLE `HostelRegistration` (
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

    INDEX `HostelRegistration_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoomAllocation` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `studentId` INTEGER NULL,
    `externalName` VARCHAR(100) NULL,
    `allocationDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RoomAllocation_roomId_idx`(`roomId`),
    INDEX `RoomAllocation_studentId_idx`(`studentId`),
    UNIQUE INDEX `RoomAllocation_roomId_studentId_key`(`roomId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HostelExpense` (
    `id` VARCHAR(191) NOT NULL,
    `expenseTitle` VARCHAR(200) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HostelExpense_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HostelInventory` (
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
CREATE TABLE `SchoolInventory` (
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

    INDEX `SchoolInventory_category_idx`(`category`),
    INDEX `SchoolInventory_assignedTo_idx`(`assignedTo`),
    INDEX `SchoolInventory_condition_idx`(`condition`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryExpense` (
    `id` VARCHAR(191) NOT NULL,
    `inventoryItemId` VARCHAR(191) NOT NULL,
    `expenseType` VARCHAR(50) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `date` DATE NOT NULL,
    `description` TEXT NOT NULL,
    `vendor` VARCHAR(200) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InventoryExpense_inventoryItemId_idx`(`inventoryItemId`),
    INDEX `InventoryExpense_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayrollSettings` (
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
CREATE TABLE `FeeHead` (
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

    UNIQUE INDEX `FeeHead_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeeStructure` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `programId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `installments` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FeeStructure_programId_classId_key`(`programId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeeStructureHead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `feeStructureId` INTEGER NOT NULL,
    `feeHeadId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,

    UNIQUE INDEX `FeeStructureHead_feeStructureId_feeHeadId_key`(`feeStructureId`, `feeHeadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeeChallan` (
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

    UNIQUE INDEX `FeeChallan_challanNumber_key`(`challanNumber`),
    INDEX `FeeChallan_studentId_idx`(`studentId`),
    INDEX `FeeChallan_status_idx`(`status`),
    INDEX `FeeChallan_studentClassId_idx`(`studentClassId`),
    INDEX `FeeChallan_studentProgramId_idx`(`studentProgramId`),
    INDEX `FeeChallan_studentSectionId_idx`(`studentSectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffLeave` (
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

    INDEX `StaffLeave_staffId_month_idx`(`staffId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdvanceSalary` (
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

    INDEX `AdvanceSalary_staffId_idx`(`staffId`),
    INDEX `AdvanceSalary_month_idx`(`month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceIncome` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FinanceIncome_date_idx`(`date`),
    INDEX `FinanceIncome_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceExpense` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FinanceExpense_date_idx`(`date`),
    INDEX `FinanceExpense_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceClosing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `totalIncome` DOUBLE NOT NULL,
    `totalExpense` DOUBLE NOT NULL,
    `netBalance` DOUBLE NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FinanceClosing_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstituteSettings` (
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
CREATE TABLE `StudentArrear` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `programId` INTEGER NOT NULL,
    `arrearAmount` DOUBLE NOT NULL,
    `lastInstallmentNumber` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StudentArrear_studentId_classId_programId_key`(`studentId`, `classId`, `programId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayrollTemplate` (
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
CREATE TABLE `FeeChallanTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `htmlContent` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffIDCardTemplate` (
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
CREATE TABLE `StudentIDCardTemplate` (
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
CREATE TABLE `StudentFeeInstallment` (
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

    INDEX `StudentFeeInstallment_studentId_classId_idx`(`studentId`, `classId`),
    UNIQUE INDEX `StudentFeeInstallment_studentId_classId_installmentNumber_key`(`studentId`, `classId`, `installmentNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_hodId_fkey` FOREIGN KEY (`hodId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Program` ADD CONSTRAINT `Program_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Section` ADD CONSTRAINT `Section_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subject` ADD CONSTRAINT `Subject_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `Inquiry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentStatusHistory` ADD CONSTRAINT `StudentStatusHistory_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSubjectMapping` ADD CONSTRAINT `TeacherSubjectMapping_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSubjectMapping` ADD CONSTRAINT `TeacherSubjectMapping_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherClassSectionMapping` ADD CONSTRAINT `TeacherClassSectionMapping_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherClassSectionMapping` ADD CONSTRAINT `TeacherClassSectionMapping_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherClassSectionMapping` ADD CONSTRAINT `TeacherClassSectionMapping_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timetable` ADD CONSTRAINT `Timetable_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timetable` ADD CONSTRAINT `Timetable_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timetable` ADD CONSTRAINT `Timetable_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timetable` ADD CONSTRAINT `Timetable_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Leave` ADD CONSTRAINT `Leave_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Leave` ADD CONSTRAINT `Leave_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffAttendance` ADD CONSTRAINT `StaffAttendance_markedBy_fkey` FOREIGN KEY (`markedBy`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffAttendance` ADD CONSTRAINT `StaffAttendance_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inquiry` ADD CONSTRAINT `Inquiry_programInterest_fkey` FOREIGN KEY (`programInterest`) REFERENCES `Program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComplaintRemark` ADD CONSTRAINT `ComplaintRemark_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `Complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComplaintRemark` ADD CONSTRAINT `ComplaintRemark_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exam` ADD CONSTRAINT `Exam_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exam` ADD CONSTRAINT `Exam_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamSchedule` ADD CONSTRAINT `ExamSchedule_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamSchedule` ADD CONSTRAINT `ExamSchedule_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Marks` ADD CONSTRAINT `Marks_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Marks` ADD CONSTRAINT `Marks_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Result` ADD CONSTRAINT `Result_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Result` ADD CONSTRAINT `Result_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Position` ADD CONSTRAINT `Position_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Position` ADD CONSTRAINT `Position_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Position` ADD CONSTRAINT `Position_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HostelRegistration` ADD CONSTRAINT `HostelRegistration_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomAllocation` ADD CONSTRAINT `RoomAllocation_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomAllocation` ADD CONSTRAINT `RoomAllocation_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryExpense` ADD CONSTRAINT `InventoryExpense_inventoryItemId_fkey` FOREIGN KEY (`inventoryItemId`) REFERENCES `SchoolInventory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeStructure` ADD CONSTRAINT `FeeStructure_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeStructure` ADD CONSTRAINT `FeeStructure_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeStructureHead` ADD CONSTRAINT `FeeStructureHead_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `FeeStructure`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeStructureHead` ADD CONSTRAINT `FeeStructureHead_feeHeadId_fkey` FOREIGN KEY (`feeHeadId`) REFERENCES `FeeHead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeChallan` ADD CONSTRAINT `FeeChallan_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeChallan` ADD CONSTRAINT `FeeChallan_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `FeeStructure`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeChallan` ADD CONSTRAINT `FeeChallan_studentArrearId_fkey` FOREIGN KEY (`studentArrearId`) REFERENCES `StudentArrear`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeChallan` ADD CONSTRAINT `FeeChallan_studentClassId_fkey` FOREIGN KEY (`studentClassId`) REFERENCES `Class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeChallan` ADD CONSTRAINT `FeeChallan_studentProgramId_fkey` FOREIGN KEY (`studentProgramId`) REFERENCES `Program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeChallan` ADD CONSTRAINT `FeeChallan_studentSectionId_fkey` FOREIGN KEY (`studentSectionId`) REFERENCES `Section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeChallan` ADD CONSTRAINT `FeeChallan_studentFeeInstallmentId_fkey` FOREIGN KEY (`studentFeeInstallmentId`) REFERENCES `StudentFeeInstallment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payroll` ADD CONSTRAINT `Payroll_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffLeave` ADD CONSTRAINT `StaffLeave_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvanceSalary` ADD CONSTRAINT `AdvanceSalary_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentArrear` ADD CONSTRAINT `StudentArrear_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentArrear` ADD CONSTRAINT `StudentArrear_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentArrear` ADD CONSTRAINT `StudentArrear_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentFeeInstallment` ADD CONSTRAINT `StudentFeeInstallment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentFeeInstallment` ADD CONSTRAINT `StudentFeeInstallment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `attendance` RENAME INDEX `attendance_classId_sectionId_date_idx` TO `Attendance_classId_sectionId_date_idx`;

-- RenameIndex
ALTER TABLE `attendance` RENAME INDEX `attendance_studentId_classId_sectionId_subjectId_date_key` TO `Attendance_studentId_classId_sectionId_subjectId_date_key`;

-- RenameIndex
ALTER TABLE `attendance` RENAME INDEX `attendance_teacherId_subjectId_date_idx` TO `Attendance_teacherId_subjectId_date_idx`;

-- RenameIndex
ALTER TABLE `class` RENAME INDEX `class_id_key` TO `Class_id_key`;

-- RenameIndex
ALTER TABLE `class` RENAME INDEX `class_programId_year_semester_key` TO `Class_programId_year_semester_key`;

-- RenameIndex
ALTER TABLE `complaint` RENAME INDEX `complaint_id_key` TO `Complaint_id_key`;

-- RenameIndex
ALTER TABLE `complaint` RENAME INDEX `complaint_type_idx` TO `Complaint_type_idx`;

-- RenameIndex
ALTER TABLE `contact` RENAME INDEX `contact_category_idx` TO `Contact_category_idx`;

-- RenameIndex
ALTER TABLE `contact` RENAME INDEX `contact_id_key` TO `Contact_id_key`;

-- RenameIndex
ALTER TABLE `department` RENAME INDEX `department_hodId_key` TO `Department_hodId_key`;

-- RenameIndex
ALTER TABLE `department` RENAME INDEX `department_name_key` TO `Department_name_key`;

-- RenameIndex
ALTER TABLE `inquiry` RENAME INDEX `inquiry_id_key` TO `Inquiry_id_key`;

-- RenameIndex
ALTER TABLE `inquiry` RENAME INDEX `inquiry_programInterest_idx` TO `Inquiry_programInterest_idx`;

-- RenameIndex
ALTER TABLE `leave` RENAME INDEX `leave_id_key` TO `Leave_id_key`;

-- RenameIndex
ALTER TABLE `marks` RENAME INDEX `marks_studentId_examId_subject_key` TO `Marks_studentId_examId_subject_key`;

-- RenameIndex
ALTER TABLE `payroll` RENAME INDEX `payroll_staffId_month_key` TO `Payroll_staffId_month_key`;

-- RenameIndex
ALTER TABLE `position` RENAME INDEX `position_examId_classId_idx` TO `Position_examId_classId_idx`;

-- RenameIndex
ALTER TABLE `position` RENAME INDEX `position_examId_classId_studentId_key` TO `Position_examId_classId_studentId_key`;

-- RenameIndex
ALTER TABLE `program` RENAME INDEX `program_name_departmentId_key` TO `Program_name_departmentId_key`;

-- RenameIndex
ALTER TABLE `room` RENAME INDEX `room_roomNumber_key` TO `Room_roomNumber_key`;

-- RenameIndex
ALTER TABLE `section` RENAME INDEX `section_classId_name_key` TO `Section_classId_name_key`;

-- RenameIndex
ALTER TABLE `student` RENAME INDEX `student_id_key` TO `Student_id_key`;

-- RenameIndex
ALTER TABLE `student` RENAME INDEX `student_inquiryId_key` TO `Student_inquiryId_key`;

-- RenameIndex
ALTER TABLE `student` RENAME INDEX `student_rollNumber_key` TO `Student_rollNumber_key`;

-- RenameIndex
ALTER TABLE `subject` RENAME INDEX `subject_code_key` TO `Subject_code_key`;

-- RenameIndex
ALTER TABLE `timetable` RENAME INDEX `timetable_sectionId_classId_dayOfWeek_startTime_key` TO `Timetable_sectionId_classId_dayOfWeek_startTime_key`;

-- RenameIndex
ALTER TABLE `visitor` RENAME INDEX `visitor_date_idx` TO `Visitor_date_idx`;

-- RenameIndex
ALTER TABLE `visitor` RENAME INDEX `visitor_id_key` TO `Visitor_id_key`;
