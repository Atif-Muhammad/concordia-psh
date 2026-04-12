/*
  Warnings:

  - You are about to drop the column `additionalPaid` on the `feechallan` table. All the data in the column will be lost.
  - You are about to drop the column `tuitionPaid` on the `feechallan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `feechallan` DROP COLUMN `additionalPaid`,
    DROP COLUMN `tuitionPaid`;
