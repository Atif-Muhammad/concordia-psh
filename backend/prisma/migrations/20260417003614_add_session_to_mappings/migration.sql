-- ============================================================
-- SubjectClassMapping: add optional sessionId FK
-- ============================================================

-- Step 1: Add the new nullable column
ALTER TABLE `subjectclassmapping` ADD COLUMN `sessionId` INTEGER NULL;

-- Step 2: Drop FKs that depend on the old unique index
ALTER TABLE `subjectclassmapping` DROP FOREIGN KEY `subjectclassmapping_subjectId_fkey`;
ALTER TABLE `subjectclassmapping` DROP FOREIGN KEY `subjectclassmapping_classId_fkey`;

-- Step 3: Drop the old unique index (now safe)
DROP INDEX `subjectclassmapping_subjectId_classId_key` ON `subjectclassmapping`;

-- Step 4: Create the new composite unique index (includes sessionId)
CREATE UNIQUE INDEX `subjectclassmapping_subjectId_classId_sessionId_key`
  ON `subjectclassmapping`(`subjectId`, `classId`, `sessionId`);

-- Step 5: Re-add the original FKs
ALTER TABLE `subjectclassmapping`
  ADD CONSTRAINT `subjectclassmapping_subjectId_fkey`
  FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `subjectclassmapping`
  ADD CONSTRAINT `subjectclassmapping_classId_fkey`
  FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Add the new sessionId FK
ALTER TABLE `subjectclassmapping`
  ADD CONSTRAINT `subjectclassmapping_sessionId_fkey`
  FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- TeacherClassSectionMapping: add optional sessionId FK
-- ============================================================

-- Step 1: Add the new nullable column
ALTER TABLE `teacherclasssectionmapping` ADD COLUMN `sessionId` INTEGER NULL;

-- Step 2: Drop FKs that depend on the old unique index
ALTER TABLE `teacherclasssectionmapping` DROP FOREIGN KEY `teacherclasssectionmapping_teacherId_fkey`;
ALTER TABLE `teacherclasssectionmapping` DROP FOREIGN KEY `teacherclasssectionmapping_classId_fkey`;
ALTER TABLE `teacherclasssectionmapping` DROP FOREIGN KEY `teacherclasssectionmapping_sectionId_fkey`;

-- Step 3: Drop the old unique index (now safe)
DROP INDEX `teacherclasssectionmapping_teacherId_classId_sectionId_key` ON `teacherclasssectionmapping`;

-- Step 4: Create the new composite unique index (includes sessionId)
CREATE UNIQUE INDEX `tcsm_teacherId_classId_sectionId_sessionId_key`
  ON `teacherclasssectionmapping`(`teacherId`, `classId`, `sectionId`, `sessionId`);

-- Step 5: Re-add the original FKs
ALTER TABLE `teacherclasssectionmapping`
  ADD CONSTRAINT `teacherclasssectionmapping_teacherId_fkey`
  FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `teacherclasssectionmapping`
  ADD CONSTRAINT `teacherclasssectionmapping_classId_fkey`
  FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `teacherclasssectionmapping`
  ADD CONSTRAINT `teacherclasssectionmapping_sectionId_fkey`
  FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Add the new sessionId FK
ALTER TABLE `teacherclasssectionmapping`
  ADD CONSTRAINT `teacherclasssectionmapping_sessionId_fkey`
  FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
