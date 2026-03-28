-- AlterTable
ALTER TABLE `feechallan` ADD COLUMN `paymentHistory` JSON NULL,
    ADD COLUMN `remainingAmount` DOUBLE NOT NULL DEFAULT 0;
