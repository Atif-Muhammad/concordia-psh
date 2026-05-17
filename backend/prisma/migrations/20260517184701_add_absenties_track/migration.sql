-- AlterTable
ALTER TABLE `fee_challan_v2` ADD COLUMN `snapshotAbsentiesFine` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `snapshotTotalAbsenties` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `snapshotTotalLeaves` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `fee_installment` ADD COLUMN `absentiesFine` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `attendanceMonthlyTrack` JSON NULL,
    ADD COLUMN `totalAbsenties` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `totalLeaves` INTEGER NOT NULL DEFAULT 0;
