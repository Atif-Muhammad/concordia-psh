-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `sessionId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `_arrearschain` RENAME INDEX `_arrearschain_AB_unique` TO `_ArrearsChain_AB_unique`;

-- RenameIndex
ALTER TABLE `_arrearschain` RENAME INDEX `_arrearschain_B_index` TO `_ArrearsChain_B_index`;

-- RenameIndex
ALTER TABLE `_complaintassignees` RENAME INDEX `_complaintassignees_AB_unique` TO `_ComplaintAssignees_AB_unique`;

-- RenameIndex
ALTER TABLE `_complaintassignees` RENAME INDEX `_complaintassignees_B_index` TO `_ComplaintAssignees_B_index`;
