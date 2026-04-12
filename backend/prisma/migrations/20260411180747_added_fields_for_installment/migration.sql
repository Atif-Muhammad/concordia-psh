-- AlterTable
ALTER TABLE `studentfeeinstallment` ADD COLUMN `lateFeeAccrued` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `lateFeeLastCalculatedAt` DATETIME(3) NULL;
