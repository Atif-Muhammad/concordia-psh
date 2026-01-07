-- CreateTable
CREATE TABLE `StudentStatusHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `previousStatus` ENUM('ACTIVE', 'EXPELLED', 'STRUCK_OFF', 'GRADUATED') NULL,
    `newStatus` ENUM('ACTIVE', 'EXPELLED', 'STRUCK_OFF', 'GRADUATED') NOT NULL,
    `reason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StudentStatusHistory` ADD CONSTRAINT `StudentStatusHistory_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
