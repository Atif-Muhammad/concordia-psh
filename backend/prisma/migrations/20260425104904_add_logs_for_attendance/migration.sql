-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `generatedAt` DATETIME(3) NULL,
    ADD COLUMN `generatedById` INTEGER NULL,
    ADD COLUMN `markedById` INTEGER NULL;

-- AlterTable
ALTER TABLE `staffattendance` ADD COLUMN `generatedAt` DATETIME(3) NULL,
    ADD COLUMN `generatedById` INTEGER NULL;
