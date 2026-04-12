-- AlterTable
ALTER TABLE `inquiry` ADD COLUMN `followUpDate` DATETIME(3) NULL,
    ADD COLUMN `followUpSlab` VARCHAR(100) NULL,
    ADD COLUMN `gender` VARCHAR(10) NULL,
    ADD COLUMN `inquiryType` ENUM('PHYSICAL', 'HEAD_OFFICE', 'REGIONAL_OFFICE', 'SOCIAL_MEDIA', 'TELEPHONE', 'REFERENCE') NULL,
    ADD COLUMN `prospectusFee` DOUBLE NULL,
    ADD COLUMN `prospectusReceipt` VARCHAR(100) NULL,
    ADD COLUMN `prospectusSold` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sessionId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `inquiry` ADD CONSTRAINT `inquiry_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
