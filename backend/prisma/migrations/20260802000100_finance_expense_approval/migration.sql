ALTER TABLE `financeexpense`
  ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN `createdById` INTEGER NULL,
  ADD COLUMN `createdByName` VARCHAR(100) NULL,
  ADD COLUMN `createdByRole` VARCHAR(50) NULL,
  ADD COLUMN `createdByIsStaff` BOOLEAN NULL,
  ADD COLUMN `approvedById` INTEGER NULL,
  ADD COLUMN `approvedByName` VARCHAR(100) NULL,
  ADD COLUMN `approvedByRole` VARCHAR(50) NULL,
  ADD COLUMN `approvedByIsStaff` BOOLEAN NULL,
  ADD COLUMN `approvedAt` DATETIME(3) NULL,
  ADD COLUMN `rejectedById` INTEGER NULL,
  ADD COLUMN `rejectedByName` VARCHAR(100) NULL,
  ADD COLUMN `rejectedByRole` VARCHAR(50) NULL,
  ADD COLUMN `rejectedByIsStaff` BOOLEAN NULL,
  ADD COLUMN `rejectedAt` DATETIME(3) NULL,
  ADD COLUMN `rejectionReason` TEXT NULL;

ALTER TABLE `financeexpense`
  ALTER COLUMN `status` SET DEFAULT 'PENDING';

CREATE INDEX `financeexpense_status_idx` ON `financeexpense`(`status`);
