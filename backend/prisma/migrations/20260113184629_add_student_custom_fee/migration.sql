-- AlterTable
ALTER TABLE `student` ADD COLUMN `numberOfInstallments` INTEGER NULL DEFAULT 1,
    ADD COLUMN `tuitionFee` INTEGER NULL DEFAULT 0;
