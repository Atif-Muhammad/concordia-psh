/*
  Warnings:

  - A unique constraint covering the columns `[studentId,examId,subject]` on the table `Marks` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `examschedule` ADD COLUMN `totalMarks` INTEGER NOT NULL DEFAULT 100;

-- CreateIndex
CREATE UNIQUE INDEX `Marks_studentId_examId_subject_key` ON `Marks`(`studentId`, `examId`, `subject`);
