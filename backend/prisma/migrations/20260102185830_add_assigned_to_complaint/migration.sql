-- AlterTable
ALTER TABLE `complaint` ADD COLUMN `assignedToId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Complaint_assignedToId_idx` ON `Complaint`(`assignedToId`);

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
