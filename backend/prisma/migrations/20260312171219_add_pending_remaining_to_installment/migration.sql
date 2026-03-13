-- AlterTable
ALTER TABLE `studentfeeinstallment` ADD COLUMN `pendingAmount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `remainingAmount` DOUBLE NOT NULL DEFAULT 0;
