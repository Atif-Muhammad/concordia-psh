-- AlterTable
ALTER TABLE `hostelregistration` ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `decidedFeePerMonth` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `guardianCnic` VARCHAR(15) NULL,
    ADD COLUMN `studentCnic` VARCHAR(15) NULL;

-- CreateTable
CREATE TABLE `hostelfee_payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registrationId` VARCHAR(191) NOT NULL,
    `month` VARCHAR(50) NOT NULL,
    `paidDate` DATE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `hostelfee_payment_registrationId_idx`(`registrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `hostelfee_payment` ADD CONSTRAINT `hostelfee_payment_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `hostelregistration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
