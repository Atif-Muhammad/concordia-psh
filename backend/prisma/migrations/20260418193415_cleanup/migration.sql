-- RenameIndex (safe - only runs if table exists)
SET @exist := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '_arrearschain');
SET @sql := IF(@exist > 0, 'ALTER TABLE `_arrearschain` RENAME INDEX `_ArrearsChain_AB_unique` TO `_arrearschain_AB_unique`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@exist > 0, 'ALTER TABLE `_arrearschain` RENAME INDEX `_ArrearsChain_B_index` TO `_arrearschain_B_index`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- RenameIndex (safe - only runs if table exists)
SET @exist2 := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '_complaintassignees');
SET @sql2 := IF(@exist2 > 0, 'ALTER TABLE `_complaintassignees` RENAME INDEX `_ComplaintAssignees_AB_unique` TO `_complaintassignees_AB_unique`', 'SELECT 1');
PREPARE stmt FROM @sql2; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql2 := IF(@exist2 > 0, 'ALTER TABLE `_complaintassignees` RENAME INDEX `_ComplaintAssignees_B_index` TO `_complaintassignees_B_index`', 'SELECT 1');
PREPARE stmt FROM @sql2; EXECUTE stmt; DEALLOCATE PREPARE stmt;
