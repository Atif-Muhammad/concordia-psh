/*
  Warnings:

  - A unique constraint covering the columns `[staffId]` on the table `staff` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `staff` ADD COLUMN `staffId` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `staffidsettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teachingPrefix` VARCHAR(30) NOT NULL,
    `nonTeachingPrefix` VARCHAR(30) NOT NULL,
    `dualPrefix` VARCHAR(30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `staff_staffId_key` ON `staff`(`staffId`);
