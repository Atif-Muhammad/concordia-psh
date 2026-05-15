/*
  Warnings:

  - You are about to drop the column `settledByChallanId` on the `fee_challan_v2` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `fee_challan_v2` DROP COLUMN `settledByChallanId`,
    ADD COLUMN `settledByChallanNumber` VARCHAR(8) NULL;
