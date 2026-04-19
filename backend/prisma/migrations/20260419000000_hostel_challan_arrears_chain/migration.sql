-- Add previousChallanId FK to HostelChallan for arrears chain
ALTER TABLE `hostelchallan` 
  ADD COLUMN `previousChallanId` INTEGER NULL,
  ADD INDEX `hostelchallan_previousChallanId_idx` (`previousChallanId`),
  ADD CONSTRAINT `hostelchallan_previousChallanId_fkey` 
    FOREIGN KEY (`previousChallanId`) REFERENCES `hostelchallan`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- hostelLateFee is already nullable in DB (double YES) — ensure schema matches
ALTER TABLE `institutesettings` MODIFY COLUMN `hostelLateFee` DOUBLE NULL DEFAULT 0;
