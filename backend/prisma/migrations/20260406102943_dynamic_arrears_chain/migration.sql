/*
  Warnings:

  - You are about to drop the column `arrearsAmount` on the `feechallan` table. All the data in the column will be lost.
  - You are about to drop the column `includesArrears` on the `feechallan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `feechallan` DROP COLUMN `arrearsAmount`,
    DROP COLUMN `includesArrears`;

-- CreateTable
CREATE TABLE `_ArrearsChain` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArrearsChain_AB_unique`(`A`, `B`),
    INDEX `_ArrearsChain_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ArrearsChain` ADD CONSTRAINT `_ArrearsChain_A_fkey` FOREIGN KEY (`A`) REFERENCES `feechallan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArrearsChain` ADD CONSTRAINT `_ArrearsChain_B_fkey` FOREIGN KEY (`B`) REFERENCES `feechallan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
