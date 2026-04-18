-- Drop old timetable table (no data to preserve — new design)
DROP TABLE IF EXISTS `timetable`;

-- Create new classtimetable table
CREATE TABLE `classtimetable` (
    `id`        INTEGER NOT NULL AUTO_INCREMENT,
    `classId`   INTEGER NOT NULL,
    `sectionId` INTEGER NULL,
    `slots`     JSON NOT NULL DEFAULT (JSON_ARRAY()),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `classtimetable_classId_sectionId_key`(`classId`, `sectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `classtimetable` ADD CONSTRAINT `classtimetable_classId_fkey`
  FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classtimetable` ADD CONSTRAINT `classtimetable_sectionId_fkey`
  FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
