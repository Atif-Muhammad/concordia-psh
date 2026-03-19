/*
  Warnings:

  - You are about to drop the column `assignedToId` on the `complaint` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `complaint` DROP FOREIGN KEY `complaint_assignedToId_fkey`;

-- DropIndex
DROP INDEX `complaint_assignedToId_idx` ON `complaint`;

-- AlterTable
ALTER TABLE `complaint` DROP COLUMN `assignedToId`;

-- CreateTable
CREATE TABLE `complaint_remark` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `complaintId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `remark` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `complaint_remark_complaintId_idx`(`complaintId`),
    INDEX `complaint_remark_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ComplaintAssignees` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ComplaintAssignees_AB_unique`(`A`, `B`),
    INDEX `_ComplaintAssignees_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `complaint_remark` ADD CONSTRAINT `complaint_remark_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_remark` ADD CONSTRAINT `complaint_remark_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ComplaintAssignees` ADD CONSTRAINT `_ComplaintAssignees_A_fkey` FOREIGN KEY (`A`) REFERENCES `complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ComplaintAssignees` ADD CONSTRAINT `_ComplaintAssignees_B_fkey` FOREIGN KEY (`B`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
