-- Track leave type on staff attendance rows for typed leave deductions
ALTER TABLE `staffattendance`
ADD COLUMN `leaveType` VARCHAR(20) NULL AFTER `status`;
