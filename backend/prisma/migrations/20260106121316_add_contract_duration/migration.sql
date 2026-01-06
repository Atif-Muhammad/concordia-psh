-- AlterTable
ALTER TABLE `employee` ADD COLUMN `contractEnd` DATETIME(3) NULL,
    ADD COLUMN `contractStart` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `teacher` ADD COLUMN `contractEnd` DATETIME(3) NULL,
    ADD COLUMN `contractStart` DATETIME(3) NULL;
