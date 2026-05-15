/*
  Warnings:

  - You are about to drop the `_arrearschain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `challansettlement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feechallan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `studentarrear` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `studentfeeinstallment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_arrearschain` DROP FOREIGN KEY `_ArrearsChain_A_fkey`;

-- DropForeignKey
ALTER TABLE `_arrearschain` DROP FOREIGN KEY `_ArrearsChain_B_fkey`;

-- DropForeignKey
ALTER TABLE `challansettlement` DROP FOREIGN KEY `challansettlement_payingChallanId_fkey`;

-- DropForeignKey
ALTER TABLE `challansettlement` DROP FOREIGN KEY `challansettlement_settledChallanId_fkey`;

-- DropForeignKey
ALTER TABLE `challansettlement` DROP FOREIGN KEY `challansettlement_settledInstallmentId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `feechallan_feeStructureId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `feechallan_sessionId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `feechallan_studentArrearId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `feechallan_studentClassId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `feechallan_studentFeeInstallmentId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `feechallan_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `feechallan_studentProgramId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `feechallan_studentSectionId_fkey`;

-- DropForeignKey
ALTER TABLE `feechallan` DROP FOREIGN KEY `feechallan_supersededById_fkey`;

-- DropForeignKey
ALTER TABLE `studentarrear` DROP FOREIGN KEY `studentarrear_classId_fkey`;

-- DropForeignKey
ALTER TABLE `studentarrear` DROP FOREIGN KEY `studentarrear_programId_fkey`;

-- DropForeignKey
ALTER TABLE `studentarrear` DROP FOREIGN KEY `studentarrear_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `studentfeeinstallment` DROP FOREIGN KEY `studentfeeinstallment_classId_fkey`;

-- DropForeignKey
ALTER TABLE `studentfeeinstallment` DROP FOREIGN KEY `studentfeeinstallment_sessionId_fkey`;

-- DropForeignKey
ALTER TABLE `studentfeeinstallment` DROP FOREIGN KEY `studentfeeinstallment_studentId_fkey`;

-- DropTable
DROP TABLE `_arrearschain`;

-- DropTable
DROP TABLE `challansettlement`;

-- DropTable
DROP TABLE `feechallan`;

-- DropTable
DROP TABLE `studentarrear`;

-- DropTable
DROP TABLE `studentfeeinstallment`;
