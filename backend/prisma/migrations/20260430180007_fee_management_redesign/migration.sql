-- AlterTable
ALTER TABLE `institutesettings` ADD COLUMN `lateFeeRatePerDay` DECIMAL(12, 2) NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `fee_installment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `sessionId` INTEGER NULL,
    `installmentNumber` INTEGER NOT NULL,
    `month` VARCHAR(50) NULL,
    `basePayable` DECIMAL(12, 2) NOT NULL,
    `lateFeeRatePerDay` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `lateFeeFine` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `extraFine` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NOT NULL,
    `pendingAmount` DECIMAL(12, 2) NOT NULL,
    `paidAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `arrears` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `arrearsMonths` JSON NULL,
    `arrearsInstallments` JSON NULL,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `dueDate` DATE NOT NULL,
    `lastPaymentDate` DATETIME(3) NULL,
    `lastPaymentAmount` DECIMAL(12, 2) NULL,
    `settled` BOOLEAN NULL,
    `supersededBy` INTEGER NULL,
    `challanGenerated` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PENDING', 'PARTIAL', 'PAID', 'VOID', 'SUPERSEDED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fee_installment_studentId_status_idx`(`studentId`, `status`),
    INDEX `fee_installment_classId_sessionId_idx`(`classId`, `sessionId`),
    UNIQUE INDEX `fee_installment_studentId_installmentNumber_sessionId_key`(`studentId`, `installmentNumber`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `installment_head` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `installmentId` INTEGER NOT NULL,
    `headName` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `discountAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,

    INDEX `installment_head_installmentId_idx`(`installmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_challan_v2` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `challanNumber` VARCHAR(8) NOT NULL,
    `installmentId` INTEGER NULL,
    `installmentNo` INTEGER NULL,
    `type` ENUM('INSTALLMENT', 'EXTRA', 'HOSTEL') NOT NULL DEFAULT 'INSTALLMENT',
    `generatedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `snapshotBaseAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `snapshotArrearsAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `snapshotLateFee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `snapshotTotalDue` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `amountReceived` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `paidAt` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PARTIAL', 'PAID', 'VOID', 'SUPERSEDED') NOT NULL DEFAULT 'PENDING',
    `paymentInfo` JSON NULL,
    `heads` JSON NULL,
    `hostelRegNumber` VARCHAR(50) NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fee_challan_v2_challanNumber_key`(`challanNumber`),
    INDEX `fee_challan_v2_installmentId_idx`(`installmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `challan_payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `challanId` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `paymentDate` DATE NOT NULL,
    `paymentMode` VARCHAR(50) NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `challan_payment_challanId_idx`(`challanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fee_installment` ADD CONSTRAINT `fee_installment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_installment` ADD CONSTRAINT `fee_installment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_installment` ADD CONSTRAINT `fee_installment_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `installment_head` ADD CONSTRAINT `installment_head_installmentId_fkey` FOREIGN KEY (`installmentId`) REFERENCES `fee_installment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_challan_v2` ADD CONSTRAINT `fee_challan_v2_installmentId_fkey` FOREIGN KEY (`installmentId`) REFERENCES `fee_installment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challan_payment` ADD CONSTRAINT `challan_payment_challanId_fkey` FOREIGN KEY (`challanId`) REFERENCES `fee_challan_v2`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
