/*
  Warnings:

  - You are about to drop the `employee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `employeeattendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacherattendance` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[staffId,month]` on the table `Payroll` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `advancesalary` DROP FOREIGN KEY `AdvanceSalary_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `advancesalary` DROP FOREIGN KEY `AdvanceSalary_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `assignment` DROP FOREIGN KEY `Assignment_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `Attendance_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `complaint` DROP FOREIGN KEY `Complaint_assignedToId_fkey`;

-- DropForeignKey
ALTER TABLE `department` DROP FOREIGN KEY `Department_hodId_fkey`;

-- DropForeignKey
ALTER TABLE `employeeattendance` DROP FOREIGN KEY `EmployeeAttendance_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `employeeattendance` DROP FOREIGN KEY `EmployeeAttendance_markedBy_fkey`;

-- DropForeignKey
ALTER TABLE `payroll` DROP FOREIGN KEY `Payroll_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `payroll` DROP FOREIGN KEY `Payroll_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `staffleave` DROP FOREIGN KEY `StaffLeave_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `staffleave` DROP FOREIGN KEY `StaffLeave_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `teacher` DROP FOREIGN KEY `Teacher_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `teacherattendance` DROP FOREIGN KEY `TeacherAttendance_markedBy_fkey`;

-- DropForeignKey
ALTER TABLE `teacherattendance` DROP FOREIGN KEY `TeacherAttendance_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `teacherclasssectionmapping` DROP FOREIGN KEY `TeacherClassSectionMapping_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `teachersubjectmapping` DROP FOREIGN KEY `TeacherSubjectMapping_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `timetable` DROP FOREIGN KEY `Timetable_teacherId_fkey`;

-- DropIndex
DROP INDEX `AdvanceSalary_employeeId_idx` ON `advancesalary`;

-- DropIndex
DROP INDEX `AdvanceSalary_teacherId_idx` ON `advancesalary`;

-- DropIndex
DROP INDEX `Assignment_teacherId_fkey` ON `assignment`;

-- DropIndex
DROP INDEX `Payroll_employeeId_month_key` ON `payroll`;

-- DropIndex
DROP INDEX `Payroll_teacherId_month_key` ON `payroll`;

-- DropIndex
DROP INDEX `StaffLeave_employeeId_month_idx` ON `staffleave`;

-- DropIndex
DROP INDEX `StaffLeave_teacherId_month_idx` ON `staffleave`;

-- DropIndex
DROP INDEX `Timetable_teacherId_fkey` ON `timetable`;

-- AlterTable
ALTER TABLE `advancesalary` ADD COLUMN `staffId` INTEGER NULL;

-- AlterTable
ALTER TABLE `feechallan` ADD COLUMN `studentSectionId` INTEGER NULL;

-- AlterTable
ALTER TABLE `payroll` ADD COLUMN `staffId` INTEGER NULL;

-- AlterTable
ALTER TABLE `staffleave` ADD COLUMN `staffId` INTEGER NULL;

-- AlterTable
ALTER TABLE `student` ADD COLUMN `lateFeeFine` INTEGER NULL DEFAULT 0;

-- DropTable
DROP TABLE `employee`;

-- DropTable
DROP TABLE `employeeattendance`;

-- DropTable
DROP TABLE `teacher`;

-- DropTable
DROP TABLE `teacherattendance`;

-- CreateTable
CREATE TABLE `Staff` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `fatherName` VARCHAR(100) NULL,
    `email` VARCHAR(100) NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `cnic` VARCHAR(15) NULL,
    `address` VARCHAR(255) NULL,
    `photo_url` VARCHAR(191) NULL,
    `photo_public_id` VARCHAR(191) NULL,
    `specialization` VARCHAR(50) NULL,
    `highestDegree` VARCHAR(50) NULL,
    `documents` JSON NULL,
    `staffType` ENUM('PERMANENT', 'CONTRACT') NOT NULL DEFAULT 'CONTRACT',
    `status` ENUM('ACTIVE', 'TERMINATED', 'RETIRED') NOT NULL DEFAULT 'ACTIVE',
    `basicPay` DECIMAL(10, 2) NULL,
    `joinDate` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leaveDate` DATETIME(3) NULL,
    `departmentId` INTEGER NULL,
    `isTeaching` BOOLEAN NOT NULL DEFAULT false,
    `isNonTeaching` BOOLEAN NOT NULL DEFAULT false,
    `designation` VARCHAR(100) NULL,
    `empDepartment` ENUM('ADMIN', 'FINANCE', 'SECURITY', 'TRANSPORT', 'CLASS_4', 'MAINTENANCE', 'IT_SUPPORT', 'LIBRARY', 'LAB', 'OTHER') NULL,
    `contractStart` DATETIME(3) NULL,
    `contractEnd` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Staff_id_key`(`id`),
    UNIQUE INDEX `Staff_email_key`(`email`),
    UNIQUE INDEX `Staff_cnic_key`(`cnic`),
    INDEX `Staff_empDepartment_idx`(`empDepartment`),
    INDEX `Staff_status_idx`(`status`),
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
CREATE TABLE `StudentFeeInstallment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `installmentNumber` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StudentFeeInstallment_studentId_installmentNumber_key`(`studentId`, `installmentNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AdvanceSalary_staffId_idx` ON `AdvanceSalary`(`staffId`);

-- CreateIndex
CREATE INDEX `FeeChallan_studentSectionId_idx` ON `FeeChallan`(`studentSectionId`);

-- CreateIndex
CREATE UNIQUE INDEX `Payroll_staffId_month_key` ON `Payroll`(`staffId`, `month`);

-- CreateIndex
CREATE INDEX `StaffLeave_staffId_month_idx` ON `StaffLeave`(`staffId`, `month`);

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_hodId_fkey` FOREIGN KEY (`hodId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Staff` ADD CONSTRAINT `Staff_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSubjectMapping` ADD CONSTRAINT `TeacherSubjectMapping_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherClassSectionMapping` ADD CONSTRAINT `TeacherClassSectionMapping_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Timetable` ADD CONSTRAINT `Timetable_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffAttendance` ADD CONSTRAINT `StaffAttendance_markedBy_fkey` FOREIGN KEY (`markedBy`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffAttendance` ADD CONSTRAINT `StaffAttendance_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeeChallan` ADD CONSTRAINT `FeeChallan_studentSectionId_fkey` FOREIGN KEY (`studentSectionId`) REFERENCES `Section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payroll` ADD CONSTRAINT `Payroll_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffLeave` ADD CONSTRAINT `StaffLeave_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvanceSalary` ADD CONSTRAINT `AdvanceSalary_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentFeeInstallment` ADD CONSTRAINT `StudentFeeInstallment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
