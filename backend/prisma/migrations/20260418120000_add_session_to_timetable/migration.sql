-- Add sessionId column (nullable — no data loss)
ALTER TABLE `classtimetable` ADD COLUMN `sessionId` INTEGER NULL;

-- Add FK to academicsession
ALTER TABLE `classtimetable` ADD CONSTRAINT `classtimetable_sessionId_fkey`
  FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop FKs before dropping the index they depend on
ALTER TABLE `classtimetable` DROP FOREIGN KEY `classtimetable_classId_fkey`;
ALTER TABLE `classtimetable` DROP FOREIGN KEY `classtimetable_sectionId_fkey`;

-- Drop old unique index (classId, sectionId)
ALTER TABLE `classtimetable` DROP INDEX `classtimetable_classId_sectionId_key`;

-- Add new unique index (classId, sectionId, sessionId)
ALTER TABLE `classtimetable` ADD UNIQUE INDEX `classtimetable_classId_sectionId_sessionId_key`(`classId`, `sectionId`, `sessionId`);

-- Re-add the FKs
ALTER TABLE `classtimetable` ADD CONSTRAINT `classtimetable_classId_fkey`
  FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `classtimetable` ADD CONSTRAINT `classtimetable_sectionId_fkey`
  FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
