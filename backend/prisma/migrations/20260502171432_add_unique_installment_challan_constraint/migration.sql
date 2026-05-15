/*
  Warnings:

  - A unique constraint covering the columns `[installmentId]` on the table `fee_challan_v2` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `unique_installment_challan` ON `fee_challan_v2`(`installmentId`);
