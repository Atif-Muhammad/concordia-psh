-- AlterTable
ALTER TABLE `feechallan` ADD COLUMN `totalAmount` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `studentfeeinstallment` ADD COLUMN `totalAmount` DOUBLE NOT NULL DEFAULT 0;
