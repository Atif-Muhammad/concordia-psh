-- AddForeignKey
ALTER TABLE `StudentFeeInstallment` ADD CONSTRAINT `StudentFeeInstallment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
