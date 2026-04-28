-- AlterTable
ALTER TABLE `feechallan` ADD COLUMN `isLocked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `settlementSnapshot` JSON NULL;

-- CreateIndex
CREATE INDEX `feechallan_isLocked_idx` ON `feechallan`(`isLocked`);
