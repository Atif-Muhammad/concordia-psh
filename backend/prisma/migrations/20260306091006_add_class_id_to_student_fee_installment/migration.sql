/*
  Warnings:

  - A unique constraint covering the columns `[studentId,classId,installmentNumber]` on the table `StudentFeeInstallment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `classId` to the `StudentFeeInstallment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `studentfeeinstallment` DROP FOREIGN KEY `StudentFeeInstallment_studentId_fkey`;

-- DropIndex
DROP INDEX `StudentFeeInstallment_studentId_installmentNumber_key` ON `studentfeeinstallment`;

-- AlterTable
ALTER TABLE `studentfeeinstallment` ADD COLUMN `classId` INTEGER;
UPDATE `studentfeeinstallment` s JOIN `Student` st ON s.studentId = st.id SET s.classId = st.classId;
ALTER TABLE `studentfeeinstallment` MODIFY `classId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `StudentFeeInstallment_studentId_classId_idx` ON `StudentFeeInstallment`(`studentId`, `classId`);

-- CreateIndex
CREATE UNIQUE INDEX `StudentFeeInstallment_studentId_classId_installmentNumber_key` ON `StudentFeeInstallment`(`studentId`, `classId`, `installmentNumber`);

-- AddForeignKey
-- ALTER TABLE `FeeChallan` ADD CONSTRAINT `FeeChallan_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `FeeStructure`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentFeeInstallment` ADD CONSTRAINT `StudentFeeInstallment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
