/*
  Warnings:

  - You are about to alter the column `session` on the `student` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Json`.

*/
-- AlterTable
ALTER TABLE `student` MODIFY `session` JSON NULL;
