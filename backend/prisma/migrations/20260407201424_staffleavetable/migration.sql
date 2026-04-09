-- CreateTable
CREATE TABLE `staffleavesettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `staffId` INTEGER NOT NULL,
    `sickAllowed` INTEGER NOT NULL DEFAULT 0,
    `sickDeduction` DOUBLE NOT NULL DEFAULT 0,
    `annualAllowed` INTEGER NOT NULL DEFAULT 0,
    `annualDeduction` DOUBLE NOT NULL DEFAULT 0,
    `casualAllowed` INTEGER NOT NULL DEFAULT 0,
    `casualDeduction` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staffleavesettings_staffId_key`(`staffId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `staffleavesettings` ADD CONSTRAINT `staffleavesettings_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
