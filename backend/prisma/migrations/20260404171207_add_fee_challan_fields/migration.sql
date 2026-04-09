-- AlterTable
ALTER TABLE `feechallan` ADD COLUMN `lateFeeFine` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `supersededById` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_supersededById_fkey` FOREIGN KEY (`supersededById`) REFERENCES `feechallan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
