/*
  Warnings:

  - You are about to drop the column `pendingAmount` on the `studentfeeinstallment` table. All the data in the column will be lost.
  - You are about to drop the column `remainingAmount` on the `studentfeeinstallment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `feechallan` ADD COLUMN `amountReceived` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `arrearsBreakdown` JSON NULL,
    ADD COLUMN `arrearsFingerprint` VARCHAR(191) NULL,
    ADD COLUMN `baseAmount` DECIMAL(10, 2) NULL,
    ADD COLUMN `computedTotalDue` DECIMAL(10, 2) NULL,
    ADD COLUMN `coveredInstallmentIds` JSON NULL,
    ADD COLUMN `frozenArrearsAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `frozenArrearsFine` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `frozenBaseFine` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `outstandingAmount` DECIMAL(10, 2) NULL,
    ADD COLUMN `totalDiscount` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `studentfeeinstallment` DROP COLUMN `pendingAmount`,
    DROP COLUMN `remainingAmount`,
    ADD COLUMN `lateFeeSnapshot` DECIMAL(10, 2) NULL,
    ADD COLUMN `lateFeeSnapshotAt` DATETIME(3) NULL,
    ADD COLUMN `outstandingPrincipal` DOUBLE NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `challansettlement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payingChallanId` INTEGER NOT NULL,
    `settledChallanId` INTEGER NULL,
    `settledInstallmentId` INTEGER NOT NULL,
    `amountApplied` DECIMAL(10, 2) NOT NULL,
    `settlementDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `challansettlement_payingChallanId_idx`(`payingChallanId`),
    INDEX `challansettlement_settledChallanId_idx`(`settledChallanId`),
    INDEX `challansettlement_settledInstallmentId_idx`(`settledInstallmentId`),
    INDEX `challansettlement_settlementDate_idx`(`settlementDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `feechallan_arrearsFingerprint_idx` ON `feechallan`(`arrearsFingerprint`);

-- CreateIndex
CREATE INDEX `feechallan_computedTotalDue_idx` ON `feechallan`(`computedTotalDue`);

-- CreateIndex
CREATE INDEX `feechallan_outstandingAmount_idx` ON `feechallan`(`outstandingAmount`);

-- AddForeignKey
ALTER TABLE `challansettlement` ADD CONSTRAINT `challansettlement_payingChallanId_fkey` FOREIGN KEY (`payingChallanId`) REFERENCES `feechallan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challansettlement` ADD CONSTRAINT `challansettlement_settledChallanId_fkey` FOREIGN KEY (`settledChallanId`) REFERENCES `feechallan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challansettlement` ADD CONSTRAINT `challansettlement_settledInstallmentId_fkey` FOREIGN KEY (`settledInstallmentId`) REFERENCES `studentfeeinstallment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
