-- AlterTable
ALTER TABLE `hostelregistration` ADD COLUMN `externalGuardianName` VARCHAR(100) NULL,
    ADD COLUMN `externalGuardianNumber` VARCHAR(20) NULL,
    ADD COLUMN `externalInstitute` VARCHAR(100) NULL,
    ADD COLUMN `externalName` VARCHAR(100) NULL,
    MODIFY `studentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `roomallocation` ADD COLUMN `externalName` VARCHAR(100) NULL,
    MODIFY `studentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `staff` ADD COLUMN `permissions` JSON NULL;
