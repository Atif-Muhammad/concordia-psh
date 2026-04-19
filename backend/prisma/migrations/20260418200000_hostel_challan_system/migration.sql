-- Migration: hostel_challan_system
-- Adds HostelChallan model and hostelLateFee to InstituteSettings

-- Add hostelLateFee to InstituteSettings
ALTER TABLE `institutesettings` ADD COLUMN `hostelLateFee` DOUBLE NOT NULL DEFAULT 0;

-- Create HostelChallan table
CREATE TABLE `hostelchallan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `challanNumber` VARCHAR(50) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `month` VARCHAR(50) NOT NULL,
    `dueDate` DATE NOT NULL,
    `hostelFee` DOUBLE NOT NULL DEFAULT 0,
    `fineAmount` DOUBLE NOT NULL DEFAULT 0,
    `lateFeeFine` DOUBLE NOT NULL DEFAULT 0,
    `arrearsAmount` DOUBLE NOT NULL DEFAULT 0,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `paidDate` DATE NULL,
    `remarks` TEXT NULL,
    `settledAmount` DOUBLE NOT NULL DEFAULT 0,
    `supersededById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hostelchallan_challanNumber_key`(`challanNumber`),
    INDEX `hostelchallan_registrationId_idx`(`registrationId`),
    INDEX `hostelchallan_supersededById_idx`(`supersededById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign keys
ALTER TABLE `hostelchallan` ADD CONSTRAINT `hostelchallan_registrationId_fkey`
    FOREIGN KEY (`registrationId`) REFERENCES `hostelregistration`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `hostelchallan` ADD CONSTRAINT `hostelchallan_supersededById_fkey`
    FOREIGN KEY (`supersededById`) REFERENCES `hostelchallan`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
