-- Add student CNIC/Form-B to inquiry records
ALTER TABLE `inquiry`
ADD COLUMN `studentCnic` VARCHAR(15) NULL AFTER `studentName`;
