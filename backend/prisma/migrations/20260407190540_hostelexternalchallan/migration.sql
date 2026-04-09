-- CreateTable
CREATE TABLE `hostelexternalchallan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registrationId` VARCHAR(191) NOT NULL,
    `challanNumber` VARCHAR(50) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `fineAmount` DOUBLE NOT NULL DEFAULT 0,
    `dueDate` DATE NOT NULL,
    `paidDate` DATE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `month` VARCHAR(50) NULL,
    `selectedHeads` TEXT NULL,
    `remarks` TEXT NULL,
    `paymentHistory` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hostelexternalchallan_challanNumber_key`(`challanNumber`),
    INDEX `hostelexternalchallan_registrationId_idx`(`registrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `hostelexternalchallan` ADD CONSTRAINT `hostelexternalchallan_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `hostelregistration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
