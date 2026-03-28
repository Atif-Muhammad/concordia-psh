/*
  Warnings:

  - You are about to drop the column `mName` on the `student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `student` DROP COLUMN `mName`,
    ADD COLUMN `session` VARCHAR(50) NULL;
