-- AlterTable
ALTER TABLE `student` ADD COLUMN `admissionFormNumber` VARCHAR(100) NULL,
    ADD COLUMN `obtainedMarks` INTEGER NULL,
    ADD COLUMN `previousBoardName` VARCHAR(200) NULL,
    ADD COLUMN `previousBoardRollNumber` VARCHAR(100) NULL,
    ADD COLUMN `totalMarks` INTEGER NULL;
