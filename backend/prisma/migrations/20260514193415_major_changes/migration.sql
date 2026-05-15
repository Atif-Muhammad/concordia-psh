/*
  Warnings:

  - You are about to drop the column `heads` on the `fee_challan_v2` table. All the data in the column will be lost.
  - You are about to drop the column `hostelRegNumber` on the `fee_challan_v2` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `fee_challan_v2` table. All the data in the column will be lost.
  - You are about to drop the `hostelchallan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hostelexternalchallan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hostelfee_payment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[type,periodStart,periodEnd]` on the table `financeclosing` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[staffId,leaveType,startDate,endDate]` on the table `staffleave` will be added. If there are existing duplicate values, this will fail.
  - Made the column `installmentId` on table `fee_challan_v2` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `periodEnd` to the `financeclosing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStart` to the `financeclosing` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `classtimetable` DROP FOREIGN KEY `classtimetable_classId_fkey`;

-- DropForeignKey
ALTER TABLE `classtimetable` DROP FOREIGN KEY `classtimetable_sectionId_fkey`;

-- DropForeignKey
ALTER TABLE `classtimetable` DROP FOREIGN KEY `classtimetable_sessionId_fkey`;

-- DropForeignKey
ALTER TABLE `fee_challan_v2` DROP FOREIGN KEY `fee_challan_v2_installmentId_fkey`;

-- DropForeignKey
ALTER TABLE `feestructurehead` DROP FOREIGN KEY `feestructurehead_feeHeadId_fkey`;

-- DropForeignKey
ALTER TABLE `hostelchallan` DROP FOREIGN KEY `hostelchallan_previousChallanId_fkey`;

-- DropForeignKey
ALTER TABLE `hostelchallan` DROP FOREIGN KEY `hostelchallan_registrationId_fkey`;

-- DropForeignKey
ALTER TABLE `hostelchallan` DROP FOREIGN KEY `hostelchallan_supersededById_fkey`;

-- DropForeignKey
ALTER TABLE `hostelexternalchallan` DROP FOREIGN KEY `hostelexternalchallan_registrationId_fkey`;

-- DropForeignKey
ALTER TABLE `hostelfee_payment` DROP FOREIGN KEY `hostelfee_payment_registrationId_fkey`;

-- DropIndex
DROP INDEX `unique_installment_challan` ON `fee_challan_v2`;

-- DropIndex
DROP INDEX `feestructurehead_feeHeadId_fkey` ON `feestructurehead`;

-- AlterTable
ALTER TABLE `advancesalary` ADD COLUMN `actionAudit` JSON NULL,
    ADD COLUMN `adjustedSource` VARCHAR(20) NULL;

-- AlterTable
ALTER TABLE `fee_challan_v2` DROP COLUMN `heads`,
    DROP COLUMN `hostelRegNumber`,
    DROP COLUMN `type`,
    ADD COLUMN `advanceAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `advanceFromChallanNo` VARCHAR(8) NULL,
    ADD COLUMN `snapshotDiscount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `snapshotExtraFine` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    MODIFY `installmentId` INTEGER NOT NULL,
    MODIFY `status` ENUM('PENDING', 'PARTIAL', 'PAID', 'VOID', 'SUPERSEDED', 'SETTLED', 'OVERDUE') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `fee_installment` ADD COLUMN `advancePaid` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `settledAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    MODIFY `status` ENUM('PENDING', 'PARTIAL', 'PAID', 'VOID', 'SUPERSEDED', 'SETTLED', 'OVERDUE') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `feechallantemplate` ADD COLUMN `type` ENUM('INSTALLMENT', 'EXTRA', 'HOSTEL') NOT NULL DEFAULT 'INSTALLMENT';

-- AlterTable
ALTER TABLE `financeclosing` ADD COLUMN `periodEnd` DATE NOT NULL,
    ADD COLUMN `periodStart` DATE NOT NULL;

-- AlterTable
ALTER TABLE `financeexpense` ADD COLUMN `subCategory` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `installment_head` ADD COLUMN `feeHeadId` INTEGER NULL;

-- AlterTable
ALTER TABLE `institutesettings` ADD COLUMN `extraChallanLateFee` DECIMAL(12, 2) NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `payroll` ADD COLUMN `actionAudit` JSON NULL,
    ADD COLUMN `amountAudit` JSON NULL;

-- AlterTable
ALTER TABLE `staffleave` ADD COLUMN `actionAudit` JSON NULL;

-- DropTable
DROP TABLE `hostelchallan`;

-- DropTable
DROP TABLE `hostelexternalchallan`;

-- DropTable
DROP TABLE `hostelfee_payment`;

-- CreateTable
CREATE TABLE `fee_challan_head` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `challanId` INTEGER NOT NULL,
    `feeHeadId` INTEGER NULL,
    `headName` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,

    INDEX `fee_challan_head_challanId_idx`(`challanId`),
    INDEX `fee_challan_head_feeHeadId_idx`(`feeHeadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `extra_challan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `challanNumber` VARCHAR(50) NOT NULL,
    `studentId` INTEGER NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATE NOT NULL,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `lateFeeFine` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `lateFeeRatePerDay` DECIMAL(12, 2) NULL DEFAULT 0,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `paidAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'PARTIAL', 'PAID', 'VOID', 'SUPERSEDED', 'SETTLED', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `extra_challan_challanNumber_key`(`challanNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `extra_challan_head` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `extraChallanId` INTEGER NOT NULL,
    `headName` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `extra_challan_payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `extraChallanId` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `paymentDate` DATE NOT NULL,
    `paymentMode` VARCHAR(50) NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostel_challan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `challanNumber` VARCHAR(50) NOT NULL,
    `studentId` INTEGER NULL,
    `hostelRegNumber` VARCHAR(50) NOT NULL,
    `month` VARCHAR(50) NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATE NOT NULL,
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `paidAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `arrearsAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'PARTIAL', 'PAID', 'VOID', 'SUPERSEDED', 'SETTLED', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `remarks` TEXT NULL,
    `paidAt` DATETIME(3) NULL,
    `settledByChallanNumber` VARCHAR(50) NULL,
    `settledAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `settledAt` DATETIME(3) NULL,
    `supersedesId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hostel_challan_challanNumber_key`(`challanNumber`),
    UNIQUE INDEX `hostel_challan_supersedesId_key`(`supersedesId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostel_challan_head` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hostelChallanId` INTEGER NOT NULL,
    `headName` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostel_challan_payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hostelChallanId` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `paymentDate` DATE NOT NULL,
    `paymentMode` VARCHAR(50) NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `financeclosing_periodStart_periodEnd_idx` ON `financeclosing`(`periodStart`, `periodEnd`);

-- CreateIndex
CREATE UNIQUE INDEX `financeclosing_type_periodStart_periodEnd_key` ON `financeclosing`(`type`, `periodStart`, `periodEnd`);

-- CreateIndex
CREATE INDEX `financeexpense_subCategory_idx` ON `financeexpense`(`subCategory`);

-- CreateIndex
CREATE INDEX `installment_head_feeHeadId_idx` ON `installment_head`(`feeHeadId`);

-- CreateIndex
CREATE UNIQUE INDEX `staffleave_staffId_leaveType_startDate_endDate_key` ON `staffleave`(`staffId`, `leaveType`, `startDate`, `endDate`);

-- AddForeignKey
ALTER TABLE `classtimetable` ADD CONSTRAINT `ct_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classtimetable` ADD CONSTRAINT `ct_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classtimetable` ADD CONSTRAINT `ct_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_challan_head` ADD CONSTRAINT `fee_challan_head_challanId_fkey` FOREIGN KEY (`challanId`) REFERENCES `fee_challan_v2`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_challan_head` ADD CONSTRAINT `fee_challan_head_feeHeadId_fkey` FOREIGN KEY (`feeHeadId`) REFERENCES `feehead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feestructurehead` ADD CONSTRAINT `feestructurehead_feeHeadId_fkey` FOREIGN KEY (`feeHeadId`) REFERENCES `feehead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `installment_head` ADD CONSTRAINT `installment_head_feeHeadId_fkey` FOREIGN KEY (`feeHeadId`) REFERENCES `feehead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_challan_v2` ADD CONSTRAINT `fee_challan_v2_installmentId_fkey` FOREIGN KEY (`installmentId`) REFERENCES `fee_installment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `extra_challan` ADD CONSTRAINT `extra_challan_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `extra_challan_head` ADD CONSTRAINT `extra_challan_head_extraChallanId_fkey` FOREIGN KEY (`extraChallanId`) REFERENCES `extra_challan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `extra_challan_payment` ADD CONSTRAINT `extra_challan_payment_extraChallanId_fkey` FOREIGN KEY (`extraChallanId`) REFERENCES `extra_challan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostel_challan` ADD CONSTRAINT `hostel_challan_supersedesId_fkey` FOREIGN KEY (`supersedesId`) REFERENCES `hostel_challan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostel_challan` ADD CONSTRAINT `hostel_challan_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostel_challan` ADD CONSTRAINT `hostel_challan_hostelRegNumber_fkey` FOREIGN KEY (`hostelRegNumber`) REFERENCES `hostelregistration`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostel_challan_head` ADD CONSTRAINT `hostel_challan_head_hostelChallanId_fkey` FOREIGN KEY (`hostelChallanId`) REFERENCES `hostel_challan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostel_challan_payment` ADD CONSTRAINT `hostel_challan_payment_hostelChallanId_fkey` FOREIGN KEY (`hostelChallanId`) REFERENCES `hostel_challan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
