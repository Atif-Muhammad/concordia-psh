ALTER TABLE `payroll`
  ADD COLUMN `paidAmount` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `generatedById` INTEGER NULL,
  ADD COLUMN `generatedByName` VARCHAR(191) NULL;

CREATE TABLE `payrollpayment` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `payrollId` INTEGER NOT NULL,
  `staffId` INTEGER NULL,
  `amount` DOUBLE NOT NULL,
  `paidById` INTEGER NULL,
  `paidByName` VARCHAR(191) NULL,
  `paymentMethod` VARCHAR(191) NULL,
  `remarks` TEXT NULL,
  `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `payrollpayment_payrollId_idx`(`payrollId`),
  INDEX `payrollpayment_staffId_idx`(`staffId`),
  INDEX `payrollpayment_paidById_idx`(`paidById`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `payrollpayment` ADD CONSTRAINT `payrollpayment_payrollId_fkey` FOREIGN KEY (`payrollId`) REFERENCES `payroll`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `payrollpayment` ADD CONSTRAINT `payrollpayment_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
