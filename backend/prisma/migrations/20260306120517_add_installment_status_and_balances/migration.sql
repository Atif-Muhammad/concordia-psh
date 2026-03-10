-- AlterTable
ALTER TABLE `feechallan` ADD COLUMN `studentFeeInstallmentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `studentfeeinstallment` ADD COLUMN `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `status` ENUM('PENDING', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE `FeeChallan` ADD CONSTRAINT `FeeChallan_studentFeeInstallmentId_fkey` FOREIGN KEY (`studentFeeInstallmentId`) REFERENCES `StudentFeeInstallment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
