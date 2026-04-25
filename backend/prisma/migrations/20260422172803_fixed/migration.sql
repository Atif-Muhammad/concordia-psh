-- CreateTable
CREATE TABLE IF NOT EXISTS `admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    `permissions` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_id_key`(`id`),
    UNIQUE INDEX `admin_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `department` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(300) NULL,
    `hodId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `department_name_key`(`name`),
    UNIQUE INDEX `department_hodId_key`(`hodId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `program` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `description` VARCHAR(300) NULL,
    `level` ENUM('INTERMEDIATE', 'UNDERGRADUATE', 'COACHING', 'DIPLOMA', 'SHORT_COURSE') NOT NULL,
    `duration` VARCHAR(50) NOT NULL,
    `rollPrefix` VARCHAR(50) NULL,
    `departmentId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `program_name_departmentId_key`(`name`, `departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `class` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `year` INTEGER NULL,
    `semester` INTEGER NULL,
    `isSemester` BOOLEAN NOT NULL DEFAULT false,
    `rollPrefix` VARCHAR(50) NULL,
    `programId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `class_id_key`(`id`),
    UNIQUE INDEX `class_programId_year_semester_key`(`programId`, `year`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `section` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(20) NOT NULL,
    `capacity` INTEGER NULL,
    `room` VARCHAR(191) NULL,
    `classId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `section_classId_name_key`(`classId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `academicsession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `academicsession_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `staff` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `fatherName` VARCHAR(100) NULL,
    `email` VARCHAR(100) NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `cnic` VARCHAR(15) NULL,
    `address` VARCHAR(255) NULL,
    `religion` VARCHAR(50) NULL,
    `photo_url` VARCHAR(191) NULL,
    `photo_public_id` VARCHAR(191) NULL,
    `specialization` VARCHAR(50) NULL,
    `highestDegree` VARCHAR(50) NULL,
    `documents` JSON NULL,
    `staffType` ENUM('PERMANENT', 'CONTRACT') NOT NULL DEFAULT 'CONTRACT',
    `status` ENUM('ACTIVE', 'TERMINATED', 'RETIRED') NOT NULL DEFAULT 'ACTIVE',
    `basicPay` DECIMAL(10, 2) NULL,
    `joinDate` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leaveDate` DATETIME(3) NULL,
    `departmentId` INTEGER NULL,
    `isTeaching` BOOLEAN NOT NULL DEFAULT false,
    `isNonTeaching` BOOLEAN NOT NULL DEFAULT false,
    `permissions` JSON NULL,
    `designation` VARCHAR(100) NULL,
    `empDepartment` ENUM('ADMIN', 'FINANCE', 'SECURITY', 'TRANSPORT', 'CLASS_4', 'MAINTENANCE', 'IT_SUPPORT', 'LIBRARY', 'LAB', 'OTHER') NULL,
    `contractStart` DATETIME(3) NULL,
    `contractEnd` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_id_key`(`id`),
    UNIQUE INDEX `staff_email_key`(`email`),
    UNIQUE INDEX `staff_cnic_key`(`cnic`),
    INDEX `staff_empDepartment_idx`(`empDepartment`),
    INDEX `staff_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `staffleavesettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `staffId` INTEGER NOT NULL,
    `sickAllowed` INTEGER NOT NULL DEFAULT 0,
    `sickDeduction` DOUBLE NOT NULL DEFAULT 0,
    `annualAllowed` INTEGER NOT NULL DEFAULT 0,
    `annualDeduction` DOUBLE NOT NULL DEFAULT 0,
    `casualAllowed` INTEGER NOT NULL DEFAULT 0,
    `casualDeduction` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staffleavesettings_staffId_key`(`staffId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `subject` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `subjectclassmapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subjectId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `sessionId` INTEGER NULL,
    `creditHours` INTEGER NULL,
    `code` VARCHAR(20) NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subjectclassmapping_subjectId_classId_sessionId_key`(`subjectId`, `classId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `student` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `photo_url` VARCHAR(191) NULL,
    `photo_public_id` VARCHAR(191) NULL,
    `fName` VARCHAR(100) NOT NULL,
    `lName` VARCHAR(100) NULL,
    `session` VARCHAR(50) NULL,
    `fatherOrguardian` VARCHAR(100) NULL,
    `rollNumber` VARCHAR(50) NOT NULL,
    `parentOrGuardianEmail` VARCHAR(50) NULL,
    `parentOrGuardianPhone` VARCHAR(20) NULL,
    `parentCNIC` VARCHAR(15) NULL,
    `studentCnic` VARCHAR(15) NULL,
    `address` VARCHAR(255) NULL,
    `gender` VARCHAR(10) NULL,
    `religion` VARCHAR(50) NULL,
    `dob` DATETIME(3) NULL,
    `admissionDate` DATETIME(3) NULL,
    `documents` JSON NOT NULL,
    `passedOut` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ACTIVE', 'EXPELLED', 'STRUCK_OFF', 'GRADUATED') NOT NULL DEFAULT 'ACTIVE',
    `statusDate` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tuitionFee` INTEGER NULL DEFAULT 0,
    `numberOfInstallments` INTEGER NULL DEFAULT 1,
    `lateFeeFine` INTEGER NULL DEFAULT 0,
    `admissionFormNumber` VARCHAR(100) NULL,
    `previousBoardName` VARCHAR(200) NULL,
    `previousBoardRollNumber` VARCHAR(100) NULL,
    `obtainedMarks` INTEGER NULL,
    `totalMarks` INTEGER NULL,
    `departmentId` INTEGER NULL,
    `programId` INTEGER NULL,
    `classId` INTEGER NOT NULL,
    `sectionId` INTEGER NULL,
    `inquiryId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_id_key`(`id`),
    UNIQUE INDEX `student_rollNumber_key`(`rollNumber`),
    UNIQUE INDEX `student_inquiryId_key`(`inquiryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `studentacademicrecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `sectionId` INTEGER NULL,
    `programId` INTEGER NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT true,
    `enrollmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `studentacademicrecord_studentId_idx`(`studentId`),
    INDEX `studentacademicrecord_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `studentstatushistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `previousStatus` ENUM('ACTIVE', 'EXPELLED', 'STRUCK_OFF', 'GRADUATED') NULL,
    `newStatus` ENUM('ACTIVE', 'EXPELLED', 'STRUCK_OFF', 'GRADUATED') NOT NULL,
    `reason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `teachersubjectmapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teachersubjectmapping_teacherId_subjectId_key`(`teacherId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `teacherclasssectionmapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `sectionId` INTEGER NULL,
    `sessionId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teacherclasssectionmapping_id_key`(`id`),
    INDEX `teacherclasssectionmapping_classId_sectionId_idx`(`classId`, `sectionId`),
    UNIQUE INDEX `tcsm_teacherId_classId_sectionId_sessionId_key`(`teacherId`, `classId`, `sectionId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `classtimetable` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classId` INTEGER NOT NULL,
    `sectionId` INTEGER NULL,
    `sessionId` INTEGER NULL,
    `slots` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `classtimetable_classId_sectionId_sessionId_key`(`classId`, `sectionId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `assignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `dueDate` DATETIME(3) NULL,
    `teacherId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `sectionId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `sectionId` INTEGER NULL,
    `subjectId` INTEGER NOT NULL,
    `teacherId` INTEGER NULL,
    `sessionId` INTEGER NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LEAVE', 'SHORT_LEAVE', 'HALF_DAY', 'HOLIDAY') NOT NULL DEFAULT 'PRESENT',
    `markedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `autoGenerated` BOOLEAN NOT NULL DEFAULT false,

    INDEX `attendance_classId_sectionId_date_idx`(`classId`, `sectionId`, `date`),
    INDEX `attendance_teacherId_subjectId_date_idx`(`teacherId`, `subjectId`, `date`),
    UNIQUE INDEX `attendance_studentId_classId_sectionId_subjectId_date_key`(`studentId`, `classId`, `sectionId`, `subjectId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `attendanceskip` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classId` INTEGER NOT NULL,
    `sectionId` INTEGER NULL,
    `date` DATE NOT NULL,
    `reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attendanceskip_classId_date_idx`(`classId`, `date`),
    UNIQUE INDEX `attendanceskip_classId_sectionId_date_key`(`classId`, `sectionId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `leave` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `fromDate` DATETIME(3) NOT NULL,
    `toDate` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `approvedById` INTEGER NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `leave_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `staffattendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `staffId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LEAVE', 'SHORT_LEAVE', 'HALF_DAY', 'HOLIDAY') NOT NULL DEFAULT 'PRESENT',
    `markedBy` INTEGER NULL,
    `markedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `autoGenerated` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `staffattendance_staffId_date_key`(`staffId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `inquiry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentName` VARCHAR(191) NOT NULL,
    `fatherName` VARCHAR(191) NULL,
    `fatherCnic` VARCHAR(191) NULL,
    `contactNumber` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `programInterest` INTEGER NULL,
    `previousInstitute` VARCHAR(191) NULL,
    `remarks` JSON NULL,
    `status` ENUM('NEW', 'APPROVED', 'REJECTED', 'FOLLOW_UP') NOT NULL DEFAULT 'NEW',
    `inquiryType` ENUM('PHYSICAL', 'HEAD_OFFICE', 'REGIONAL_OFFICE', 'SOCIAL_MEDIA', 'TELEPHONE', 'REFERENCE') NULL,
    `gender` VARCHAR(10) NULL,
    `sessionId` INTEGER NULL,
    `prospectusSold` BOOLEAN NOT NULL DEFAULT false,
    `prospectusFee` DOUBLE NULL,
    `prospectusReceipt` VARCHAR(100) NULL,
    `followUpDate` DATETIME(3) NULL,
    `followUpSlab` VARCHAR(100) NULL,
    `referenceBody` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `inquiry_id_key`(`id`),
    INDEX `inquiry_programInterest_idx`(`programInterest`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `visitor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visitorName` VARCHAR(100) NOT NULL,
    `phone` BIGINT NOT NULL,
    `IDCard` BIGINT NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `persons` INTEGER NOT NULL,
    `inTime` DATETIME(3) NOT NULL,
    `outTime` DATETIME(3) NULL,
    `purpose` VARCHAR(191) NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visitor_id_key`(`id`),
    INDEX `visitor_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `complaint` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('Parent', 'Student', 'Staff') NOT NULL DEFAULT 'Student',
    `complainantName` VARCHAR(50) NOT NULL,
    `contact` BIGINT NOT NULL,
    `subject` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('Pending', 'In_Progress', 'Resolved', 'Rejected') NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `complaint_id_key`(`id`),
    INDEX `complaint_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `complaintremark` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `complaintId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `remark` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `complaintremark_complaintId_idx`(`complaintId`),
    INDEX `complaintremark_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `contact` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `phone` BIGINT NOT NULL,
    `email` VARCHAR(191) NULL,
    `category` ENUM('Emergency', 'Academic', 'Technical', 'Maintenance', 'Other') NOT NULL DEFAULT 'Other',
    `details` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `contact_id_key`(`id`),
    INDEX `contact_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `exam` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `examName` VARCHAR(191) NOT NULL,
    `programId` INTEGER NOT NULL,
    `classId` INTEGER NULL,
    `session` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NULL,
    `sessionId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `examschedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `examId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `startTime` VARCHAR(10) NOT NULL,
    `endTime` VARCHAR(10) NOT NULL,
    `totalMarks` INTEGER NOT NULL DEFAULT 100,
    `room` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `examschedule_examId_subjectId_key`(`examId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `marks` (
    `id` VARCHAR(191) NOT NULL,
    `examId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `totalMarks` INTEGER NOT NULL,
    `obtainedMarks` INTEGER NOT NULL,
    `isAbsent` BOOLEAN NOT NULL DEFAULT false,
    `teacherRemarks` VARCHAR(191) NULL,

    UNIQUE INDEX `marks_studentId_examId_subject_key`(`studentId`, `examId`, `subject`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `result` (
    `id` VARCHAR(191) NOT NULL,
    `examId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `totalMarks` INTEGER NOT NULL,
    `obtainedMarks` INTEGER NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `gpa` DOUBLE NOT NULL,
    `grade` VARCHAR(191) NOT NULL,
    `position` INTEGER NULL,
    `remarks` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `position` (
    `id` VARCHAR(191) NOT NULL,
    `examId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `position` INTEGER NOT NULL,
    `totalMarks` INTEGER NOT NULL,
    `obtainedMarks` INTEGER NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `gpa` DOUBLE NOT NULL,
    `grade` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `position_examId_classId_idx`(`examId`, `classId`),
    UNIQUE INDEX `position_examId_classId_studentId_key`(`examId`, `classId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `reportcardtemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `htmlContent` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `hostelregistration` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` INTEGER NULL,
    `externalName` VARCHAR(100) NULL,
    `externalInstitute` VARCHAR(100) NULL,
    `externalGuardianName` VARCHAR(100) NULL,
    `externalGuardianNumber` VARCHAR(20) NULL,
    `guardianCnic` VARCHAR(15) NULL,
    `studentCnic` VARCHAR(15) NULL,
    `address` TEXT NULL,
    `decidedFeePerMonth` DOUBLE NOT NULL DEFAULT 0,
    `hostelName` VARCHAR(100) NOT NULL,
    `registrationDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `hostelregistration_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `hostelexternalchallan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registrationId` VARCHAR(191) NOT NULL,
    `challanNumber` VARCHAR(50) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `fineAmount` DOUBLE NOT NULL DEFAULT 0,
    `dueDate` DATE NOT NULL,
    `paidDate` DATE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `month` VARCHAR(50) NULL,
    `selectedHeads` TEXT NULL,
    `remarks` TEXT NULL,
    `paymentHistory` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hostelexternalchallan_challanNumber_key`(`challanNumber`),
    INDEX `hostelexternalchallan_registrationId_idx`(`registrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `hostelfee_payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registrationId` VARCHAR(191) NOT NULL,
    `month` VARCHAR(50) NOT NULL,
    `paidDate` DATE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `hostelfee_payment_registrationId_idx`(`registrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `hostelchallan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `challanNumber` VARCHAR(50) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `month` VARCHAR(50) NOT NULL,
    `dueDate` DATE NOT NULL,
    `hostelFee` DOUBLE NOT NULL DEFAULT 0,
    `fineAmount` DOUBLE NOT NULL DEFAULT 0,
    `lateFeeFine` DOUBLE NOT NULL DEFAULT 0,
    `arrearsAmount` DOUBLE NOT NULL DEFAULT 0,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `paidDate` DATE NULL,
    `remarks` TEXT NULL,
    `settledAmount` DOUBLE NOT NULL DEFAULT 0,
    `supersededById` INTEGER NULL,
    `previousChallanId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hostelchallan_challanNumber_key`(`challanNumber`),
    INDEX `hostelchallan_registrationId_idx`(`registrationId`),
    INDEX `hostelchallan_supersededById_idx`(`supersededById`),
    INDEX `hostelchallan_previousChallanId_idx`(`previousChallanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `room` (
    `id` VARCHAR(191) NOT NULL,
    `roomNumber` VARCHAR(20) NOT NULL,
    `roomType` VARCHAR(20) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `currentOccupancy` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL,
    `hostelName` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `room_roomNumber_key`(`roomNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `roomallocation` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `studentId` INTEGER NULL,
    `externalName` VARCHAR(100) NULL,
    `allocationDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `roomallocation_roomId_idx`(`roomId`),
    INDEX `roomallocation_studentId_idx`(`studentId`),
    UNIQUE INDEX `roomallocation_roomId_studentId_key`(`roomId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `hostelexpense` (
    `id` VARCHAR(191) NOT NULL,
    `expenseTitle` VARCHAR(200) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `hostelexpense_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `hostelinventory` (
    `id` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(200) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `condition` VARCHAR(20) NOT NULL,
    `allocatedToRoom` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `schoolinventory` (
    `id` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(200) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `totalValue` DOUBLE NOT NULL,
    `purchaseDate` DATE NOT NULL,
    `supplier` VARCHAR(200) NOT NULL,
    `condition` VARCHAR(20) NOT NULL,
    `location` VARCHAR(200) NOT NULL,
    `assignedTo` VARCHAR(50) NULL,
    `assignedToName` VARCHAR(200) NULL,
    `assignedDate` DATE NULL,
    `maintenanceCost` DOUBLE NULL DEFAULT 0,
    `lastMaintenanceDate` DATE NULL,
    `warrantyExpiry` DATE NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `schoolinventory_category_idx`(`category`),
    INDEX `schoolinventory_assignedTo_idx`(`assignedTo`),
    INDEX `schoolinventory_condition_idx`(`condition`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `inventoryexpense` (
    `id` VARCHAR(191) NOT NULL,
    `inventoryItemId` VARCHAR(191) NOT NULL,
    `expenseType` VARCHAR(50) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `date` DATE NOT NULL,
    `description` TEXT NOT NULL,
    `vendor` VARCHAR(200) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `inventoryexpense_inventoryItemId_idx`(`inventoryItemId`),
    INDEX `inventoryexpense_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `payrollsettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `absentDeduction` DOUBLE NOT NULL DEFAULT 0,
    `leaveDeduction` DOUBLE NOT NULL DEFAULT 0,
    `leavesAllowed` INTEGER NOT NULL DEFAULT 0,
    `absentsAllowed` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `feehead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `amount` DOUBLE NOT NULL,
    `isDiscount` BOOLEAN NOT NULL DEFAULT false,
    `isTuition` BOOLEAN NOT NULL DEFAULT false,
    `isFine` BOOLEAN NOT NULL DEFAULT false,
    `isLabFee` BOOLEAN NOT NULL DEFAULT false,
    `isLibraryFee` BOOLEAN NOT NULL DEFAULT false,
    `isRegistrationFee` BOOLEAN NOT NULL DEFAULT false,
    `isAdmissionFee` BOOLEAN NOT NULL DEFAULT false,
    `isProspectusFee` BOOLEAN NOT NULL DEFAULT false,
    `isExaminationFee` BOOLEAN NOT NULL DEFAULT false,
    `isAlliedCharges` BOOLEAN NOT NULL DEFAULT false,
    `isHostelFee` BOOLEAN NOT NULL DEFAULT false,
    `isOther` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `feehead_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `feestructure` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `programId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `installments` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `feestructure_programId_classId_key`(`programId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `feestructurehead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `feeStructureId` INTEGER NOT NULL,
    `feeHeadId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,

    UNIQUE INDEX `feestructurehead_feeStructureId_feeHeadId_key`(`feeStructureId`, `feeHeadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `feechallan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `challanNumber` VARCHAR(50) NOT NULL,
    `studentId` INTEGER NOT NULL,
    `feeStructureId` INTEGER NULL,
    `amount` DOUBLE NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `remainingAmount` DOUBLE NOT NULL DEFAULT 0,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `fineAmount` DOUBLE NOT NULL DEFAULT 0,
    `lateFeeFine` DOUBLE NULL DEFAULT 0,
    `settledAmount` DOUBLE NULL DEFAULT 0,
    `dueDate` DATE NOT NULL,
    `issueDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paidDate` DATE NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE', 'PARTIAL', 'VOID') NOT NULL DEFAULT 'PENDING',
    `installmentNumber` INTEGER NOT NULL DEFAULT 1,
    `coveredInstallments` VARCHAR(50) NULL,
    `selectedHeads` TEXT NULL,
    `paymentHistory` JSON NULL,
    `remarks` TEXT NULL,
    `challanType` ENUM('INSTALLMENT', 'ARREARS_ONLY', 'FEE_HEADS_ONLY', 'MIXED') NULL,
    `studentArrearId` INTEGER NULL,
    `studentClassId` INTEGER NULL,
    `studentProgramId` INTEGER NULL,
    `studentSectionId` INTEGER NULL,
    `studentFeeInstallmentId` INTEGER NULL,
    `month` VARCHAR(50) NULL,
    `session` VARCHAR(50) NULL,
    `sessionId` INTEGER NULL,
    `supersededById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `feechallan_challanNumber_key`(`challanNumber`),
    INDEX `feechallan_studentId_idx`(`studentId`),
    INDEX `feechallan_status_idx`(`status`),
    INDEX `feechallan_studentClassId_idx`(`studentClassId`),
    INDEX `feechallan_studentProgramId_idx`(`studentProgramId`),
    INDEX `feechallan_studentSectionId_idx`(`studentSectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `payroll` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `month` VARCHAR(7) NOT NULL,
    `staffId` INTEGER NULL,
    `employeeId` INTEGER NULL,
    `teacherId` INTEGER NULL,
    `basicSalary` DOUBLE NOT NULL DEFAULT 0,
    `securityDeduction` DOUBLE NOT NULL DEFAULT 0,
    `advanceDeduction` DOUBLE NOT NULL DEFAULT 0,
    `absentDeduction` DOUBLE NOT NULL DEFAULT 0,
    `leaveDeduction` DOUBLE NOT NULL DEFAULT 0,
    `sickLeaveDeduction` DOUBLE NOT NULL DEFAULT 0,
    `incomeTax` DOUBLE NOT NULL DEFAULT 0,
    `eobi` DOUBLE NOT NULL DEFAULT 0,
    `lateArrivalDeduction` DOUBLE NOT NULL DEFAULT 0,
    `otherDeduction` DOUBLE NOT NULL DEFAULT 0,
    `totalDeductions` DOUBLE NOT NULL DEFAULT 0,
    `extraAllowance` DOUBLE NOT NULL DEFAULT 0,
    `travelAllowance` DOUBLE NOT NULL DEFAULT 0,
    `houseRentAllowance` DOUBLE NOT NULL DEFAULT 0,
    `medicalAllowance` DOUBLE NOT NULL DEFAULT 0,
    `insuranceAllowance` DOUBLE NOT NULL DEFAULT 0,
    `otherAllowance` DOUBLE NOT NULL DEFAULT 0,
    `totalAllowances` DOUBLE NOT NULL DEFAULT 0,
    `netSalary` DOUBLE NOT NULL DEFAULT 0,
    `arrearsAmount` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'UNPAID',
    `paymentDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payroll_staffId_month_key`(`staffId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `staffleave` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `month` VARCHAR(7) NOT NULL,
    `staffId` INTEGER NULL,
    `employeeId` INTEGER NULL,
    `teacherId` INTEGER NULL,
    `leaveType` ENUM('CASUAL', 'SICK', 'ANNUAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER') NOT NULL DEFAULT 'CASUAL',
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `days` INTEGER NOT NULL DEFAULT 0,
    `reason` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `locked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `staffleave_staffId_month_idx`(`staffId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `holiday` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `repeatYearly` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `advancesalary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `staffId` INTEGER NULL,
    `employeeId` INTEGER NULL,
    `teacherId` INTEGER NULL,
    `amount` DOUBLE NOT NULL,
    `month` VARCHAR(7) NOT NULL,
    `remarks` TEXT NULL,
    `adjusted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `advancesalary_staffId_idx`(`staffId`),
    INDEX `advancesalary_month_idx`(`month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `financeincome` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `financeincome_date_idx`(`date`),
    INDEX `financeincome_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `financeexpense` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `financeexpense_date_idx`(`date`),
    INDEX `financeexpense_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `financeclosing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `totalIncome` DOUBLE NOT NULL,
    `totalExpense` DOUBLE NOT NULL,
    `netBalance` DOUBLE NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `financeclosing_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `institutesettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instituteName` VARCHAR(200) NOT NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `facebook` VARCHAR(255) NULL,
    `instagram` VARCHAR(255) NULL,
    `logo` VARCHAR(500) NULL,
    `challanPrefix` VARCHAR(20) NULL DEFAULT '',
    `lateFeeFine` DOUBLE NULL DEFAULT 0,
    `hostelLateFee` DOUBLE NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `studentarrear` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `programId` INTEGER NOT NULL,
    `arrearAmount` DOUBLE NOT NULL,
    `lastInstallmentNumber` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `studentarrear_studentId_classId_programId_key`(`studentId`, `classId`, `programId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `payrolltemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `htmlContent` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `feechallantemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `htmlContent` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `staffidcardtemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `htmlContent` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `studentidcardtemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `htmlContent` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `studentfeeinstallment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `installmentNumber` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `pendingAmount` DOUBLE NOT NULL DEFAULT 0,
    `remainingAmount` DOUBLE NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'PENDING',
    `dueDate` DATETIME(3) NOT NULL,
    `paidDate` DATETIME(3) NULL,
    `month` VARCHAR(191) NULL,
    `session` VARCHAR(191) NULL,
    `lateFeeAccrued` DOUBLE NOT NULL DEFAULT 0,
    `lateFeeLastCalculatedAt` DATETIME(3) NULL,
    `sessionId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `studentfeeinstallment_studentId_classId_idx`(`studentId`, `classId`),
    UNIQUE INDEX `studentfeeinstallment_studentId_classId_installmentNumber_key`(`studentId`, `classId`, `installmentNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `_ComplaintAssignees` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ComplaintAssignees_AB_unique`(`A`, `B`),
    INDEX `_ComplaintAssignees_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `_ArrearsChain` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArrearsChain_AB_unique`(`A`, `B`),
    INDEX `_ArrearsChain_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `department` ADD CONSTRAINT `department_hodId_fkey` FOREIGN KEY (`hodId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program` ADD CONSTRAINT `program_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class` ADD CONSTRAINT `class_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `section` ADD CONSTRAINT `section_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staffleavesettings` ADD CONSTRAINT `staffleavesettings_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subjectclassmapping` ADD CONSTRAINT `subjectclassmapping_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subjectclassmapping` ADD CONSTRAINT `subjectclassmapping_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subjectclassmapping` ADD CONSTRAINT `subjectclassmapping_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `inquiry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentacademicrecord` ADD CONSTRAINT `studentacademicrecord_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentacademicrecord` ADD CONSTRAINT `studentacademicrecord_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentacademicrecord` ADD CONSTRAINT `studentacademicrecord_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentacademicrecord` ADD CONSTRAINT `studentacademicrecord_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentacademicrecord` ADD CONSTRAINT `studentacademicrecord_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentstatushistory` ADD CONSTRAINT `studentstatushistory_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teachersubjectmapping` ADD CONSTRAINT `teachersubjectmapping_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teachersubjectmapping` ADD CONSTRAINT `teachersubjectmapping_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacherclasssectionmapping` ADD CONSTRAINT `teacherclasssectionmapping_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacherclasssectionmapping` ADD CONSTRAINT `teacherclasssectionmapping_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacherclasssectionmapping` ADD CONSTRAINT `teacherclasssectionmapping_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacherclasssectionmapping` ADD CONSTRAINT `teacherclasssectionmapping_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classtimetable` ADD CONSTRAINT `classtimetable_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classtimetable` ADD CONSTRAINT `classtimetable_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classtimetable` ADD CONSTRAINT `classtimetable_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment` ADD CONSTRAINT `assignment_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment` ADD CONSTRAINT `assignment_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment` ADD CONSTRAINT `assignment_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendanceskip` ADD CONSTRAINT `attendanceskip_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendanceskip` ADD CONSTRAINT `attendanceskip_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `section`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave` ADD CONSTRAINT `leave_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave` ADD CONSTRAINT `leave_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staffattendance` ADD CONSTRAINT `staffattendance_markedBy_fkey` FOREIGN KEY (`markedBy`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staffattendance` ADD CONSTRAINT `staffattendance_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiry` ADD CONSTRAINT `inquiry_programInterest_fkey` FOREIGN KEY (`programInterest`) REFERENCES `program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiry` ADD CONSTRAINT `inquiry_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaintremark` ADD CONSTRAINT `complaintremark_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaintremark` ADD CONSTRAINT `complaintremark_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam` ADD CONSTRAINT `exam_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam` ADD CONSTRAINT `exam_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam` ADD CONSTRAINT `exam_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examschedule` ADD CONSTRAINT `examschedule_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examschedule` ADD CONSTRAINT `examschedule_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marks` ADD CONSTRAINT `marks_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marks` ADD CONSTRAINT `marks_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `result` ADD CONSTRAINT `result_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `result` ADD CONSTRAINT `result_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `position` ADD CONSTRAINT `position_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `position` ADD CONSTRAINT `position_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `position` ADD CONSTRAINT `position_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostelregistration` ADD CONSTRAINT `hostelregistration_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostelexternalchallan` ADD CONSTRAINT `hostelexternalchallan_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `hostelregistration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostelfee_payment` ADD CONSTRAINT `hostelfee_payment_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `hostelregistration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostelchallan` ADD CONSTRAINT `hostelchallan_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `hostelregistration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostelchallan` ADD CONSTRAINT `hostelchallan_supersededById_fkey` FOREIGN KEY (`supersededById`) REFERENCES `hostelchallan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostelchallan` ADD CONSTRAINT `hostelchallan_previousChallanId_fkey` FOREIGN KEY (`previousChallanId`) REFERENCES `hostelchallan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roomallocation` ADD CONSTRAINT `roomallocation_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roomallocation` ADD CONSTRAINT `roomallocation_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryexpense` ADD CONSTRAINT `inventoryexpense_inventoryItemId_fkey` FOREIGN KEY (`inventoryItemId`) REFERENCES `schoolinventory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feestructure` ADD CONSTRAINT `feestructure_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feestructure` ADD CONSTRAINT `feestructure_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feestructurehead` ADD CONSTRAINT `feestructurehead_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `feestructure`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feestructurehead` ADD CONSTRAINT `feestructurehead_feeHeadId_fkey` FOREIGN KEY (`feeHeadId`) REFERENCES `feehead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `feestructure`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_studentArrearId_fkey` FOREIGN KEY (`studentArrearId`) REFERENCES `studentarrear`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_studentClassId_fkey` FOREIGN KEY (`studentClassId`) REFERENCES `class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_studentProgramId_fkey` FOREIGN KEY (`studentProgramId`) REFERENCES `program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_studentSectionId_fkey` FOREIGN KEY (`studentSectionId`) REFERENCES `section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_studentFeeInstallmentId_fkey` FOREIGN KEY (`studentFeeInstallmentId`) REFERENCES `studentfeeinstallment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feechallan` ADD CONSTRAINT `feechallan_supersededById_fkey` FOREIGN KEY (`supersededById`) REFERENCES `feechallan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll` ADD CONSTRAINT `payroll_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staffleave` ADD CONSTRAINT `staffleave_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `advancesalary` ADD CONSTRAINT `advancesalary_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentarrear` ADD CONSTRAINT `studentarrear_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentarrear` ADD CONSTRAINT `studentarrear_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentarrear` ADD CONSTRAINT `studentarrear_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentfeeinstallment` ADD CONSTRAINT `studentfeeinstallment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentfeeinstallment` ADD CONSTRAINT `studentfeeinstallment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studentfeeinstallment` ADD CONSTRAINT `studentfeeinstallment_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academicsession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ComplaintAssignees` ADD CONSTRAINT `_ComplaintAssignees_A_fkey` FOREIGN KEY (`A`) REFERENCES `complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ComplaintAssignees` ADD CONSTRAINT `_ComplaintAssignees_B_fkey` FOREIGN KEY (`B`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArrearsChain` ADD CONSTRAINT `_ArrearsChain_A_fkey` FOREIGN KEY (`A`) REFERENCES `feechallan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArrearsChain` ADD CONSTRAINT `_ArrearsChain_B_fkey` FOREIGN KEY (`B`) REFERENCES `feechallan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
