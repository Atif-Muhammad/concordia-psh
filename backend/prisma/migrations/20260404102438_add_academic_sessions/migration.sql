-- AlterTable
ALTER TABLE `exam` ADD COLUMN `sessionId` INTEGER NULL;

-- AlterTable
ALTER TABLE `feechallan` ADD COLUMN `sessionId` INTEGER NULL;

-- AlterTable
ALTER TABLE `student` MODIFY `session` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `studentfeeinstallment` ADD COLUMN `sessionId` INTEGER NULL;

-- CreateTable
CREATE TABLE `academicsession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `academicsession_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studentacademicrecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `sectionId` INTEGER NULL,
    `programId` INTEGER NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT true,
    `enrollmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `studentacademicrecord_studentId_idx`(`studentId`),
    INDEX `studentacademicrecord_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `studentacademicrecord` ADD CONSTRAINT `studentacademicrecord_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentacademicrecord` ADD CONSTRAINT `studentacademicrecord_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentacademicrecord` ADD CONSTRAINT `studentacademicrecord_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentacademicrecord` ADD CONSTRAINT `studentacademicrecord_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentacademicrecord` ADD CONSTRAINT `studentacademicrecord_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam` ADD CONSTRAINT `exam_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentfeeinstallment` ADD CONSTRAINT `studentfeeinstallment_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
