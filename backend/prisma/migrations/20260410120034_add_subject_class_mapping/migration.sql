/*
  Warnings:

  - You are about to drop the column `classId` on the `subject` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `subject` table. All the data in the column will be lost.
  - You are about to drop the column `creditHours` on the `subject` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `subject` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `subject` DROP FOREIGN KEY `subject_classId_fkey`;

-- DropIndex
DROP INDEX `subject_classId_fkey` ON `subject`;

-- DropIndex
DROP INDEX `subject_code_key` ON `subject`;

-- AlterTable
ALTER TABLE `subject` DROP COLUMN `classId`,
    DROP COLUMN `code`,
    DROP COLUMN `creditHours`,
    DROP COLUMN `description`;

-- CreateTable
CREATE TABLE `subjectclassmapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subjectId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `creditHours` INTEGER NULL,
    `code` VARCHAR(20) NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subjectclassmapping_subjectId_classId_key`(`subjectId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subjectclassmapping` ADD CONSTRAINT `subjectclassmapping_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subjectclassmapping` ADD CONSTRAINT `subjectclassmapping_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
