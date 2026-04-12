// prisma/seed.ts - Comprehensive seed for Concordia PSH
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper to generate a random 13-digit number string
function generateChallanNumber(): string {
  return Math.floor(Math.random() * 9000000000000 + 1000000000000).toString();
}

async function main() {
  console.log('🌱 Starting comprehensive seed...\n');

  // ─── 0. CLEANUP (Optional for re-runs) ───
  console.log('🧹 Cleaning up database...');
  await prisma.$transaction([
    prisma.feeChallan.deleteMany(),
    prisma.studentFeeInstallment.deleteMany(),
    prisma.studentArrear.deleteMany(),
    prisma.studentStatusHistory.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.leave.deleteMany(),
    prisma.marks.deleteMany(),
    prisma.result.deleteMany(),
    prisma.position.deleteMany(),
    prisma.student.deleteMany(),
    prisma.section.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.feeStructureHead.deleteMany(),
    prisma.feeStructure.deleteMany(),
    prisma.class.deleteMany(),
    prisma.program.deleteMany(),
    prisma.department.deleteMany(),
    prisma.staff.deleteMany(),
    prisma.feeHead.deleteMany(),
    prisma.holiday.deleteMany(),
    prisma.financeIncome.deleteMany(),
    prisma.financeExpense.deleteMany(),
    prisma.roomAllocation.deleteMany(),
    prisma.room.deleteMany(),
    prisma.hostelRegistration.deleteMany(),
  ]);


  // ─── 1. INSTITUTE SETTINGS ───
  console.log('📋 Creating institute settings...');
  await prisma.instituteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      instituteName: 'Hayatabad Model School',
      phone: '091-5619915',
      email: 'info@concordiapsh.edu.pk',
      address: 'Hayatabad, Peshawar, KP, Pakistan',
    },
  });
  
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // ─── 2. DEPARTMENTS ───
  console.log('🏢 Creating departments...');
  const depts = await Promise.all([
    prisma.department.create({ data: { name: 'Science', description: 'Natural & Physical Sciences' } }),
    prisma.department.create({ data: { name: 'Computer Science', description: 'IT & Computer Sciences' } }),
    prisma.department.create({ data: { name: 'Arts & Humanities', description: 'Languages, Social Sciences & Humanities' } }),
    prisma.department.create({ data: { name: 'Medical Sciences', description: 'Nursing, Radiology, Dental, Anesthesia' } }),
  ]);
  const [sciDept, csDept, artsDept, medDept] = depts;

  // ─── 3. PROGRAMS ───
  console.log('📚 Creating programs...');
  const programs = await Promise.all([
    prisma.program.create({ data: { name: 'FSC Pre-Medical', level: 'INTERMEDIATE', duration: '2 Years', departmentId: sciDept.id, rollPrefix: 'PSH-PM' } }),
    prisma.program.create({ data: { name: 'FSC Pre-Engineering', level: 'INTERMEDIATE', duration: '2 Years', departmentId: sciDept.id, rollPrefix: 'PSH-PE' } }),
    prisma.program.create({ data: { name: 'ICS', level: 'INTERMEDIATE', duration: '2 Years', departmentId: csDept.id, rollPrefix: 'PSH-ICS' } }),
    prisma.program.create({ data: { name: 'General Science', level: 'INTERMEDIATE', duration: '2 Years', departmentId: sciDept.id, rollPrefix: 'PSH-GS' } }),
    prisma.program.create({ data: { name: 'Humanities', level: 'INTERMEDIATE', duration: '2 Years', departmentId: artsDept.id, rollPrefix: 'PSH-HU' } }),
    prisma.program.create({ data: { name: 'BS Computer Science', level: 'UNDERGRADUATE', duration: '4 Years', departmentId: csDept.id, rollPrefix: 'PSH-BSCS' } }),
    prisma.program.create({ data: { name: 'BS Nursing', level: 'UNDERGRADUATE', duration: '4 Years', departmentId: medDept.id, rollPrefix: 'PSH-BSN' } }),
    prisma.program.create({ data: { name: 'BS English', level: 'UNDERGRADUATE', duration: '4 Years', departmentId: artsDept.id, rollPrefix: 'PSH-BSE' } }),
  ]);
  const [fscPM, fscPE, ics, genSci, humanities, bscs, bsNursing, bsEnglish] = programs;

  // ─── 4. CLASSES ───
  console.log('🏫 Creating classes...');
  // Intermediate classes (year-based)
  const classes = await Promise.all([
    // FSC Pre-Medical 1st yr & 2nd yr
    prisma.class.create({ data: { name: '1st Year', year: 1, isSemester: false, programId: fscPM.id, rollPrefix: 'PM-1' } }),
    prisma.class.create({ data: { name: '2nd Year', year: 2, isSemester: false, programId: fscPM.id, rollPrefix: 'PM-2' } }),
    // FSC Pre-Engineering
    prisma.class.create({ data: { name: '1st Year', year: 1, isSemester: false, programId: fscPE.id, rollPrefix: 'PE-1' } }),
    prisma.class.create({ data: { name: '2nd Year', year: 2, isSemester: false, programId: fscPE.id, rollPrefix: 'PE-2' } }),
    // ICS
    prisma.class.create({ data: { name: '1st Year', year: 1, isSemester: false, programId: ics.id, rollPrefix: 'ICS-1' } }),
    prisma.class.create({ data: { name: '2nd Year', year: 2, isSemester: false, programId: ics.id, rollPrefix: 'ICS-2' } }),
    // General Science
    prisma.class.create({ data: { name: '1st Year', year: 1, isSemester: false, programId: genSci.id } }),
    // Humanities
    prisma.class.create({ data: { name: '1st Year', year: 1, isSemester: false, programId: humanities.id } }),
    // BSCS semester-based
    prisma.class.create({ data: { name: 'Semester 1', year: 1, semester: 1, isSemester: true, programId: bscs.id, rollPrefix: 'BSCS-S1' } }),
    prisma.class.create({ data: { name: 'Semester 2', year: 1, semester: 2, isSemester: true, programId: bscs.id, rollPrefix: 'BSCS-S2' } }),
    prisma.class.create({ data: { name: 'Semester 3', year: 2, semester: 3, isSemester: true, programId: bscs.id, rollPrefix: 'BSCS-S3' } }),
    // BS Nursing
    prisma.class.create({ data: { name: 'Semester 1', year: 1, semester: 1, isSemester: true, programId: bsNursing.id } }),
    // BS English
    prisma.class.create({ data: { name: 'Semester 1', year: 1, semester: 1, isSemester: true, programId: bsEnglish.id } }),
  ]);
  const [
    pm1, pm2, pe1, pe2, ics1, ics2, gs1, hu1,
    bscs1, bscs2, bscs3, bsn1, bse1
  ] = classes;

  // ─── 5. SECTIONS ───
  console.log('📖 Creating sections...');
  const sections = await Promise.all([
    prisma.section.create({ data: { name: 'A', classId: pm1.id, capacity: 40 } }),
    prisma.section.create({ data: { name: 'B', classId: pm1.id, capacity: 40 } }),
    prisma.section.create({ data: { name: 'A', classId: pm2.id, capacity: 40 } }),
    prisma.section.create({ data: { name: 'A', classId: pe1.id, capacity: 35 } }),
    prisma.section.create({ data: { name: 'B', classId: pe1.id, capacity: 35 } }),
    prisma.section.create({ data: { name: 'A', classId: pe2.id, capacity: 35 } }),
    prisma.section.create({ data: { name: 'A', classId: ics1.id, capacity: 30 } }),
    prisma.section.create({ data: { name: 'A', classId: ics2.id, capacity: 30 } }),
    prisma.section.create({ data: { name: 'A', classId: gs1.id, capacity: 30 } }),
    prisma.section.create({ data: { name: 'A', classId: hu1.id, capacity: 30 } }),
    prisma.section.create({ data: { name: 'Morning', classId: bscs1.id, capacity: 50 } }),
    prisma.section.create({ data: { name: 'Evening', classId: bscs1.id, capacity: 50 } }),
    prisma.section.create({ data: { name: 'Morning', classId: bscs2.id, capacity: 50 } }),
    prisma.section.create({ data: { name: 'Morning', classId: bscs3.id, capacity: 50 } }),
    prisma.section.create({ data: { name: 'A', classId: bsn1.id, capacity: 40 } }),
    prisma.section.create({ data: { name: 'A', classId: bse1.id, capacity: 40 } }),
  ]);
  const [
    pm1A, pm1B, pm2A,
    pe1A, pe1B, pe2A,
    ics1A, ics2A,
    gs1A, hu1A,
    bscs1M, bscs1E, bscs2M, bscs3M,
    bsn1A, bse1A
  ] = sections;

  // ─── 6. STAFF / TEACHERS ───
  console.log('👨‍🏫 Creating staff and teachers...');
  const pwd = await bcrypt.hash('teacher123', 10);
  const staff = await Promise.all([
    prisma.staff.create({ data: { name: 'Dr. Ahmed Khan', email: 'ahmed.khan@concordia.edu', password: pwd, phone: '0301-1234567', isTeaching: true, staffType: 'PERMANENT', status: 'ACTIVE', departmentId: sciDept.id, specialization: 'Physics', basicPay: 85000 } }),
    prisma.staff.create({ data: { name: 'Prof. Sara Ali', email: 'sara.ali@concordia.edu', password: pwd, phone: '0302-2345678', isTeaching: true, staffType: 'PERMANENT', status: 'ACTIVE', departmentId: sciDept.id, specialization: 'Chemistry', basicPay: 80000 } }),
    prisma.staff.create({ data: { name: 'Mr. Bilal Shah', email: 'bilal.shah@concordia.edu', password: pwd, phone: '0303-3456789', isTeaching: true, staffType: 'CONTRACT', status: 'ACTIVE', departmentId: csDept.id, specialization: 'Programming', basicPay: 65000 } }),
    prisma.staff.create({ data: { name: 'Ms. Fatima Noor', email: 'fatima.noor@concordia.edu', password: pwd, phone: '0304-4567890', isTeaching: true, staffType: 'PERMANENT', status: 'ACTIVE', departmentId: artsDept.id, specialization: 'English Literature', basicPay: 75000 } }),
    prisma.staff.create({ data: { name: 'Dr. Usman Tariq', email: 'usman.tariq@concordia.edu', password: pwd, phone: '0305-5678901', isTeaching: true, staffType: 'PERMANENT', status: 'ACTIVE', departmentId: medDept.id, specialization: 'Anatomy', basicPay: 90000 } }),
    prisma.staff.create({ data: { name: 'Mr. Imran Yousuf', email: 'imran.yousuf@concordia.edu', password: pwd, phone: '0306-6789012', isTeaching: true, staffType: 'CONTRACT', status: 'ACTIVE', departmentId: sciDept.id, specialization: 'Mathematics', basicPay: 60000 } }),
    // Non-teaching staff
    prisma.staff.create({ data: { name: 'Mr. Zahid Iqbal', email: 'zahid.iqbal@concordia.edu', password: pwd, phone: '0307-7890123', isNonTeaching: true, staffType: 'PERMANENT', status: 'ACTIVE', designation: 'Accountant', empDepartment: 'FINANCE', basicPay: 50000 } }),
    prisma.staff.create({ data: { name: 'Mr. Rafiq Hussain', email: 'rafiq.hussain@concordia.edu', password: pwd, phone: '0308-8901234', isNonTeaching: true, staffType: 'PERMANENT', status: 'ACTIVE', designation: 'Security Guard', empDepartment: 'SECURITY', basicPay: 30000 } }),
    prisma.staff.create({ data: { name: 'Ms. Nasreen Bibi', email: 'nasreen.bibi@concordia.edu', password: pwd, phone: '0309-9012345', isNonTeaching: true, staffType: 'CONTRACT', status: 'ACTIVE', designation: 'Librarian', empDepartment: 'LIBRARY', basicPay: 40000 } }),
    prisma.staff.create({ data: { name: 'Mr. Tariq Aziz', email: 'tariq.aziz@concordia.edu', password: pwd, phone: '0310-0123456', isNonTeaching: true, staffType: 'PERMANENT', status: 'ACTIVE', designation: 'IT Support', empDepartment: 'IT_SUPPORT', basicPay: 45000 } }),
  ]);

  // ─── 7. SUBJECTS ───
  console.log('📝 Creating subjects...');
  const subjects = await Promise.all([
    // Unique subject names (reusable across classes)
    prisma.subject.create({ data: { name: 'Physics' } }),
    prisma.subject.create({ data: { name: 'Chemistry' } }),
    prisma.subject.create({ data: { name: 'Biology' } }),
    prisma.subject.create({ data: { name: 'English' } }),
    prisma.subject.create({ data: { name: 'Urdu' } }),
    prisma.subject.create({ data: { name: 'Mathematics' } }),
    prisma.subject.create({ data: { name: 'Computer Science' } }),
    prisma.subject.create({ data: { name: 'Intro to Computing' } }),
    prisma.subject.create({ data: { name: 'Calculus I' } }),
    prisma.subject.create({ data: { name: 'English Composition' } }),
  ]);
  const [physics, chemistry, biology, english, urdu, mathematics, computerScience, introComputing, calculusI, englishComp] = subjects;

  // ─── 7b. SUBJECT-CLASS MAPPINGS ───
  console.log('🔗 Creating subject-class mappings...');
  await Promise.all([
    // PM 1st Year
    prisma.subjectClassMapping.create({ data: { subjectId: physics.id, classId: pm1.id, code: 'PHY-101', creditHours: 4 } }),
    prisma.subjectClassMapping.create({ data: { subjectId: chemistry.id, classId: pm1.id, code: 'CHM-101', creditHours: 4 } }),
    prisma.subjectClassMapping.create({ data: { subjectId: biology.id, classId: pm1.id, code: 'BIO-101', creditHours: 4 } }),
    prisma.subjectClassMapping.create({ data: { subjectId: english.id, classId: pm1.id, code: 'ENG-101', creditHours: 3 } }),
    prisma.subjectClassMapping.create({ data: { subjectId: urdu.id, classId: pm1.id, code: 'URD-101', creditHours: 3 } }),
    // PE 1st Year
    prisma.subjectClassMapping.create({ data: { subjectId: physics.id, classId: pe1.id, code: 'PHY-PE1', creditHours: 4 } }),
    prisma.subjectClassMapping.create({ data: { subjectId: chemistry.id, classId: pe1.id, code: 'CHM-PE1', creditHours: 4 } }),
    prisma.subjectClassMapping.create({ data: { subjectId: mathematics.id, classId: pe1.id, code: 'MTH-PE1', creditHours: 4 } }),
    // ICS 1st Year
    prisma.subjectClassMapping.create({ data: { subjectId: computerScience.id, classId: ics1.id, code: 'CS-101', creditHours: 4 } }),
    prisma.subjectClassMapping.create({ data: { subjectId: mathematics.id, classId: ics1.id, code: 'MTH-ICS1', creditHours: 4 } }),
    // BSCS Sem 1
    prisma.subjectClassMapping.create({ data: { subjectId: introComputing.id, classId: bscs1.id, code: 'CS-111', creditHours: 3 } }),
    prisma.subjectClassMapping.create({ data: { subjectId: calculusI.id, classId: bscs1.id, code: 'MTH-111', creditHours: 3 } }),
    prisma.subjectClassMapping.create({ data: { subjectId: englishComp.id, classId: bscs1.id, code: 'ENG-111', creditHours: 3 } }),
  ]);

  // ─── 8. FEE HEADS ───
  console.log('💰 Creating fee heads...');
  const feeHeads = await Promise.all([
    prisma.feeHead.create({ data: { name: 'Tuition Fee', amount: 0, description: 'Monthly/Semester tuition fee', isTuition: true } }),
    prisma.feeHead.create({ data: { name: 'Admission Fee', amount: 5000, description: 'One-time admission fee', isAdmissionFee: true } }),
    prisma.feeHead.create({ data: { name: 'Registration Fee', amount: 2000, description: 'Registration and enrollment fee', isRegistrationFee: true } }),
    prisma.feeHead.create({ data: { name: 'Lab Fee', amount: 3000, description: 'Science/Computer lab usage fee', isLabFee: true } }),
    prisma.feeHead.create({ data: { name: 'Library Fee', amount: 1500, description: 'Library access and materials', isLibraryFee: true } }),
    prisma.feeHead.create({ data: { name: 'Examination Fee', amount: 4000, description: 'Per-exam examination charges', isExaminationFee: true } }),
    prisma.feeHead.create({ data: { name: 'Prospectus Fee', amount: 500, description: 'Prospectus and handbook', isProspectusFee: true } }),
    prisma.feeHead.create({ data: { name: 'Allied Charges', amount: 2500, description: 'Sports, events, misc charges', isAlliedCharges: true } }),
    prisma.feeHead.create({ data: { name: 'Hostel Fee', amount: 8000, description: 'Monthly hostel accommodation', isHostelFee: true } }),
    prisma.feeHead.create({ data: { name: 'Late Fee Fine', amount: 100, description: 'Per-day late payment fine', isFine: true } }),
    prisma.feeHead.create({ data: { name: 'Scholarship Discount', amount: 0, description: 'Scholarship deduction', isDiscount: true } }),
    prisma.feeHead.create({ data: { name: 'Other Charges', amount: 1000, description: 'Miscellaneous charges', isOther: true } }),
  ]);
  const [tuitionH, admissionH, registrationH, labH, libraryH, examH, prospectusH, alliedH, hostelH, lateH, scholarshipH, otherH] = feeHeads;

  // ─── 9. FEE STRUCTURES ───
  console.log('🏗️ Creating fee structures...');
  // FSC Pre-Medical 1st Year: 30,000 total, 3 installments
  const fsPM1 = await prisma.feeStructure.create({
    data: {
      programId: fscPM.id,
      classId: pm1.id,
      totalAmount: 30000,
      installments: 3,
      feeHeads: {
        create: [
          { feeHeadId: tuitionH.id, amount: 30000 },
          { feeHeadId: labH.id, amount: 3000 },
          { feeHeadId: libraryH.id, amount: 1500 },
        ],
      },
    },
  });
  // FSC Pre-Medical 2nd Year
  const fsPM2 = await prisma.feeStructure.create({
    data: {
      programId: fscPM.id,
      classId: pm2.id,
      totalAmount: 30000,
      installments: 3,
      feeHeads: {
        create: [
          { feeHeadId: tuitionH.id, amount: 30000 },
          { feeHeadId: labH.id, amount: 3000 },
        ],
      },
    },
  });
  // FSC Pre-Engineering 1st Year: 28,000 total, 3 installments
  const fsPE1 = await prisma.feeStructure.create({
    data: {
      programId: fscPE.id,
      classId: pe1.id,
      totalAmount: 28000,
      installments: 3,
      feeHeads: {
        create: [
          { feeHeadId: tuitionH.id, amount: 28000 },
          { feeHeadId: labH.id, amount: 3000 },
        ],
      },
    },
  });
  // ICS 1st Year: 25,000 total, 3 installments
  const fsICS1 = await prisma.feeStructure.create({
    data: {
      programId: ics.id,
      classId: ics1.id,
      totalAmount: 25000,
      installments: 3,
      feeHeads: {
        create: [
          { feeHeadId: tuitionH.id, amount: 25000 },
          { feeHeadId: labH.id, amount: 3000 },
        ],
      },
    },
  });
  // BSCS Semester 1: 50,000 total, 2 installments
  const fsBSCS1 = await prisma.feeStructure.create({
    data: {
      programId: bscs.id,
      classId: bscs1.id,
      totalAmount: 50000,
      installments: 2,
      feeHeads: {
        create: [
          { feeHeadId: tuitionH.id, amount: 50000 },
          { feeHeadId: labH.id, amount: 5000 },
          { feeHeadId: libraryH.id, amount: 2000 },
        ],
      },
    },
  });
  // BSCS Semester 2: 50,000 total, 2 installments
  const fsBSCS2 = await prisma.feeStructure.create({
    data: {
      programId: bscs.id,
      classId: bscs2.id,
      totalAmount: 50000,
      installments: 2,
      feeHeads: {
        create: [
          { feeHeadId: tuitionH.id, amount: 50000 },
          { feeHeadId: labH.id, amount: 5000 },
        ],
      },
    },
  });
  // BS Nursing Semester 1: 60,000 total, 3 installments
  const fsBSN1 = await prisma.feeStructure.create({
    data: {
      programId: bsNursing.id,
      classId: bsn1.id,
      totalAmount: 60000,
      installments: 3,
      feeHeads: {
        create: [
          { feeHeadId: tuitionH.id, amount: 60000 },
          { feeHeadId: labH.id, amount: 5000 },
          { feeHeadId: libraryH.id, amount: 2000 },
        ],
      },
    },
  });

  // ─── 10. STUDENTS ───
  console.log('🎓 Creating students with installment plans...');

  const firstNames = ['Ali', 'Hamza', 'Usama', 'Areeba', 'Zainab', 'Saad', 'Mehreen', 'Faizan', 'Hira', 'Adeel',
    'Nida', 'Asim', 'Saba', 'Kamran', 'Bushra', 'Waqas', 'Rabia', 'Junaid', 'Ayesha', 'Shoaib',
    'Maira', 'Usman', 'Iqra', 'Danish', 'Nimra', 'Farhan', 'Amna', 'Hassan', 'Maryam', 'Tariq'];
  const lastNames = ['Khan', 'Shah', 'Ahmed', 'Ali', 'Malik', 'Iqbal', 'Hussain', 'Noor', 'Raza', 'Akram',
    'Afridi', 'Yousufzai', 'Bangash', 'Khattak', 'Durrani', 'Mohmand', 'Orakzai', 'Shinwari'];
  const fatherNames = ['Muhammad Akbar', 'Abdul Rashid', 'Sher Muhammad', 'Niaz Muhammad', 'Gul Nawaz',
    'Fazal-ur-Rehman', 'Ihsan Ullah', 'Muhammad Zahid', 'Ghulam Haider', 'Syed Kamal'];

  interface StudentConfig {
    programId: number;
    classId: number;
    sectionId: number;
    prefix: string;
    tuitionFee: number;
    installments: number;
    lateFeeFine: number;
    count: number;
  }

  const studentConfigs: StudentConfig[] = [
    { programId: fscPM.id, classId: pm1.id, sectionId: pm1A.id, prefix: 'PSH-PM26', tuitionFee: 30000, installments: 3, lateFeeFine: 100, count: 8 },
    { programId: fscPM.id, classId: pm1.id, sectionId: pm1B.id, prefix: 'PSH-PM26', tuitionFee: 28000, installments: 3, lateFeeFine: 100, count: 6 },
    { programId: fscPM.id, classId: pm2.id, sectionId: pm2A.id, prefix: 'PSH-PM25', tuitionFee: 30000, installments: 3, lateFeeFine: 100, count: 5 },
    { programId: fscPE.id, classId: pe1.id, sectionId: pe1A.id, prefix: 'PSH-PE26', tuitionFee: 28000, installments: 3, lateFeeFine: 100, count: 7 },
    { programId: fscPE.id, classId: pe1.id, sectionId: pe1B.id, prefix: 'PSH-PE26', tuitionFee: 25000, installments: 3, lateFeeFine: 80, count: 4 },
    { programId: ics.id, classId: ics1.id, sectionId: ics1A.id, prefix: 'PSH-ICS26', tuitionFee: 25000, installments: 3, lateFeeFine: 80, count: 6 },
    { programId: genSci.id, classId: gs1.id, sectionId: gs1A.id, prefix: 'PSH-GS26', tuitionFee: 20000, installments: 2, lateFeeFine: 50, count: 4 },
    { programId: humanities.id, classId: hu1.id, sectionId: hu1A.id, prefix: 'PSH-HU26', tuitionFee: 18000, installments: 2, lateFeeFine: 50, count: 3 },
    { programId: bscs.id, classId: bscs1.id, sectionId: bscs1M.id, prefix: 'PSH-BSCS26', tuitionFee: 50000, installments: 2, lateFeeFine: 200, count: 8 },
    { programId: bscs.id, classId: bscs1.id, sectionId: bscs1E.id, prefix: 'PSH-BSCS26', tuitionFee: 45000, installments: 2, lateFeeFine: 200, count: 5 },
    { programId: bscs.id, classId: bscs2.id, sectionId: bscs2M.id, prefix: 'PSH-BSCS25', tuitionFee: 50000, installments: 2, lateFeeFine: 200, count: 4 },
    { programId: bsNursing.id, classId: bsn1.id, sectionId: bsn1A.id, prefix: 'PSH-BSN26', tuitionFee: 60000, installments: 3, lateFeeFine: 150, count: 5 },
    { programId: bsEnglish.id, classId: bse1.id, sectionId: bse1A.id, prefix: 'PSH-BSE26', tuitionFee: 35000, installments: 2, lateFeeFine: 100, count: 3 },
  ];
  
  const CURRENT_SESSION = '2023-2025'; // Fallback session label

  let studentCounter = 0;
  const allStudents: any[] = [];

  for (const config of studentConfigs) {
    for (let i = 0; i < config.count; i++) {
      studentCounter++;
      const fIdx = (studentCounter - 1) % firstNames.length;
      const lIdx = (studentCounter - 1) % lastNames.length;
      const fatherIdx = (studentCounter - 1) % fatherNames.length;
      const rollNum = `${config.prefix}-${String(studentCounter).padStart(3, '0')}`;

      // Generate installment due dates (monthly from August 2026)
      const installmentData: { installmentNumber: number; amount: number; dueDate: Date; month: string; session: string }[] = [];
      const perInstallment = Math.floor(config.tuitionFee / config.installments);
      const lastInstallmentAmt = config.tuitionFee - perInstallment * (config.installments - 1);

      for (let inst = 1; inst <= config.installments; inst++) {
        // Start from August (Month Index 7)
        const monthIdx = (7 + (inst - 1)) % 12;
        const yearOffset = Math.floor((7 + (inst - 1)) / 12);
        const year = 2026 + yearOffset;
        
        installmentData.push({
          installmentNumber: inst,
          amount: inst === config.installments ? lastInstallmentAmt : perInstallment,
          dueDate: new Date(year, monthIdx, 10), 
          month: MONTH_NAMES[monthIdx],
          session: config.prefix.includes('25') ? '2024-2026' : '2023-2025',
        });
      }

      const student = await prisma.student.create({
        data: {
          fName: firstNames[fIdx],
          lName: lastNames[lIdx],
          fatherOrguardian: fatherNames[fatherIdx],
          rollNumber: rollNum,
          session: config.prefix.includes('25') ? '2024-2026' : '2023-2025',
          gender: studentCounter % 3 === 0 ? 'Female' : 'Male',
          dob: new Date(2006 + (studentCounter % 5), (studentCounter % 12), 1 + (studentCounter % 28)),
          parentOrGuardianPhone: `03${String(10 + (studentCounter % 90)).padStart(2, '0')}-${String(1000000 + studentCounter * 1111).slice(0, 7)}`,
          address: `House ${studentCounter}, Street ${(studentCounter % 20) + 1}, Hayatabad Phase ${(studentCounter % 7) + 1}, Peshawar`,
          programId: config.programId,
          classId: config.classId,
          sectionId: config.sectionId,
          tuitionFee: config.tuitionFee,
          numberOfInstallments: config.installments,
          lateFeeFine: config.lateFeeFine,
          status: 'ACTIVE',
          feeInstallments: {
            create: installmentData.map((inst) => ({
              classId: config.classId,
              installmentNumber: inst.installmentNumber,
              amount: inst.amount,
              dueDate: inst.dueDate,
              month: inst.month,
              session: inst.session,
              paidAmount: 0,
              status: 'PENDING',
              remainingAmount: inst.amount,
            })),
          },
        },
      });
      allStudents.push({ ...student, config });
    }
  }
  console.log(`  ✅ Created ${allStudents.length} students with installment plans`);

  // ─── 11. FEE CHALLANS - Mix of paid, pending, partial ───
  console.log('🧾 Creating fee challans with various statuses...');
  let challanCount = 0;

  for (const s of allStudents) {
    const cfg = s.config;

    // Get fee structure for this student's program/class
    const structure = await prisma.feeStructure.findUnique({
      where: { programId_classId: { programId: cfg.programId, classId: cfg.classId } },
    });

    const structureId = structure?.id || null;
    const perInstallment = Math.floor(cfg.tuitionFee / cfg.installments);

    // Fetch student's installment records
    const installments = await prisma.studentFeeInstallment.findMany({
      where: { studentId: s.id, classId: cfg.classId },
      orderBy: { installmentNumber: 'asc' },
    });

    // For variety: some students pay 1st installment, some pay 1st+2nd, some pay nothing
    const payPattern = s.id % 5;
    // 0 → all paid, 1 → first paid, 2 → first+second paid partial, 3 → nothing paid, 4 → first paid + 2nd pending

    for (let instIdx = 0; instIdx < installments.length; instIdx++) {
      const inst = installments[instIdx];
      let shouldCreate = false;
      let status: 'PAID' | 'PENDING' | 'PARTIAL' = 'PENDING';
      let paidAmount = 0;
      let paidDate: Date | null = null;

      if (payPattern === 0) {
        // All installments paid
        shouldCreate = true;
        status = 'PAID';
        paidAmount = inst.amount;
        paidDate = new Date(2026, instIdx, 12);
      } else if (payPattern === 1) {
        // Only 1st installment paid
        shouldCreate = true;
        if (instIdx === 0) {
          status = 'PAID';
          paidAmount = inst.amount;
          paidDate = new Date(2026, 0, 15);
        } else {
          status = 'PENDING';
        }
      } else if (payPattern === 2) {
        // 1st paid, 2nd partial
        shouldCreate = true;
        if (instIdx === 0) {
          status = 'PAID';
          paidAmount = inst.amount;
          paidDate = new Date(2026, 0, 11);
        } else if (instIdx === 1) {
          status = 'PARTIAL';
          paidAmount = Math.floor(inst.amount / 2);
          paidDate = new Date(2026, 1, 14);
        }
      } else if (payPattern === 3) {
        // Nothing paid - only create for 1st installment
        if (instIdx === 0) {
          shouldCreate = true;
          status = 'PENDING';
        }
      } else if (payPattern === 4) {
        // 1st paid, 2nd challan exists pending
        shouldCreate = instIdx <= 1;
        if (instIdx === 0) {
          status = 'PAID';
          paidAmount = inst.amount;
          paidDate = new Date(2026, 0, 10);
        } else {
          status = 'PENDING';
        }
      }

      if (shouldCreate) {
        challanCount++;
        const challan = await prisma.feeChallan.create({
          data: {
            challanNumber: generateChallanNumber(),
            studentId: s.id,
            feeStructureId: structureId,
            amount: inst.amount,
            paidAmount,
            discount: 0,
            fineAmount: 0,
            dueDate: inst.dueDate,
            paidDate,
            status,
            installmentNumber: inst.installmentNumber,
            month: inst.month,
            session: inst.session,
            studentClassId: cfg.classId,
            studentProgramId: cfg.programId,
            studentSectionId: cfg.sectionId,
            studentFeeInstallmentId: inst.id,
            challanType: 'INSTALLMENT',
           remarks: `Installment ${inst.installmentNumber} - ${inst.month} ${inst.session}`,
          },
        });

        // Update installment record
        if (paidAmount > 0) {
          await prisma.studentFeeInstallment.update({
            where: { id: inst.id },
            data: {
              paidAmount,
              status: status === 'PAID' ? 'PAID' : status === 'PARTIAL' ? 'PARTIAL' : 'PENDING',
            },
          });
        }
      }
    }
  }
  console.log(`  ✅ Created ${challanCount} fee challans`);

  // ─── 12. STUDENT ARREARS (for some students) ───
  console.log('📊 Creating arrears for some students...');
  // Pick some 2nd year / semester 2+ students and give them arrears from previous class
  const pm2Students = allStudents.filter((s) => s.config.classId === pm2.id);
  for (const s of pm2Students.slice(0, 3)) {
    await prisma.studentArrear.create({
      data: {
        studentId: s.id,
        classId: pm1.id, // Arrears from 1st year
        programId: fscPM.id,
        arrearAmount: 10000,
        lastInstallmentNumber: 2,
      },
    });
  }
  const bscs2Students = allStudents.filter((s) => s.config.classId === bscs2.id);
  for (const s of bscs2Students.slice(0, 2)) {
    await prisma.studentArrear.create({
      data: {
        studentId: s.id,
        classId: bscs1.id, // Arrears from Sem 1
        programId: bscs.id,
        arrearAmount: 25000,
        lastInstallmentNumber: 1,
      },
    });
  }

  // ─── 13. SOME EXTRA CHALLANS (fee heads only - for variety) ───
  console.log('📄 Creating extra fee-head challans...');
  const someStudents = allStudents.slice(0, 10);
  for (const s of someStudents) {
    challanCount++;
    await prisma.feeChallan.create({
      data: {
        challanNumber: generateChallanNumber(),
        studentId: s.id,
        amount: 5000,
        paidAmount: s.id % 2 === 0 ? 5000 : 0,
        discount: 0,
        fineAmount: 0,
        dueDate: new Date(2026, 0, 15),
        paidDate: s.id % 2 === 0 ? new Date(2026, 0, 16) : null,
        status: s.id % 2 === 0 ? 'PAID' : 'PENDING',
        installmentNumber: 0,
        studentClassId: s.config.classId,
        studentProgramId: s.config.programId,
        studentSectionId: s.config.sectionId,
        challanType: 'FEE_HEADS_ONLY',
        selectedHeads: JSON.stringify([
          { id: admissionH.id, name: 'Admission Fee', amount: 5000, type: 'additional' },
        ]),
        remarks: 'Admission Fee Payment',
      },
    });
  }

  // ─── 14. FINANCE INCOME & EXPENSES ───
  console.log('📈 Creating finance records...');
  const months = ['January', 'February', 'March'];
  for (let m = 0; m < 3; m++) {
    await prisma.financeIncome.create({
      data: {
        category: 'Fee Collection',
        amount: 500000 + m * 50000,
        date: new Date(2026, m, 20),
        description: `Total fee revenue for ${months[m]} 2026`,
      },
    });
    await prisma.financeIncome.create({
      data: {
        category: 'Admission',
        amount: 50000 + m * 10000,
        date: new Date(2026, m, 15),
        description: `Admission fee revenue for ${months[m]} 2026`,
      },
    });
    await prisma.financeExpense.create({
      data: {
        category: 'Salary',
        amount: 350000 + m * 20000,
        date: new Date(2026, m, 28),
        description: `Staff salaries for ${months[m]} 2026`,
      },
    });
    await prisma.financeExpense.create({
      data: {
        category: 'Utilities',
        amount: 40000 + m * 5000,
        date: new Date(2026, m, 25),
        description: `Utility bills for ${months[m]} 2026`,
      },
    });
    await prisma.financeExpense.create({
      data: {
        category: 'Maintenance',
        amount: 15000 + m * 3000,
        date: new Date(2026, m, 18),
        description: `Building maintenance for ${months[m]} 2026`,
      },
    });
  }

  // ─── 15. HOSTEL ROOMS ───
  console.log('🏠 Creating hostel rooms...');
  for (let floor = 1; floor <= 3; floor++) {
    for (let room = 1; room <= 5; room++) {
      await prisma.room.create({
        data: {
          roomNumber: `${floor}0${room}`,
          roomType: room <= 2 ? 'single' : room <= 4 ? 'double' : 'triple',
          capacity: room <= 2 ? 1 : room <= 4 ? 2 : 3,
          currentOccupancy: 0,
          status: 'vacant',
        },
      });
    }
  }

  // ─── 16. HOLIDAYS ───
  console.log('📅 Creating holidays...');
  await Promise.all([
    prisma.holiday.create({ data: { title: 'Pakistan Day', date: new Date(2026, 2, 23), type: 'National', description: 'National holiday' } }),
    prisma.holiday.create({ data: { title: 'Labour Day', date: new Date(2026, 4, 1), type: 'National', description: 'International Labour Day' } }),
    prisma.holiday.create({ data: { title: 'Independence Day', date: new Date(2026, 7, 14), type: 'National', description: 'Pakistan Independence Day' } }),
    prisma.holiday.create({ data: { title: 'Iqbal Day', date: new Date(2026, 10, 9), type: 'National', description: 'Allama Iqbal Day' } }),
    prisma.holiday.create({ data: { title: 'Quaid-e-Azam Day', date: new Date(2026, 11, 25), type: 'National', description: 'Birthday of Quaid-e-Azam' } }),
  ]);

  // ─── 17. PAYROLL SETTINGS ───
  console.log('💼 Creating payroll settings...');
  await prisma.payrollSettings.create({
    data: {
      absentDeduction: 500,
      leaveDeduction: 300,
      leavesAllowed: 3,
      absentsAllowed: 2,
    },
  });

  // ─── 18. CHALLAN TEMPLATE ───
  console.log('📋 Creating default challan template...');
  await prisma.feeChallanTemplate.create({
    data: {
      name: 'Default Fee Challan',
      isDefault: true,
      htmlContent: `<div style="font-family: Arial; padding: 20px; border: 2px solid #333;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h2 style="margin: 0;">{{instituteName}}</h2>
    <p style="margin: 5px 0;">{{instituteAddress}}</p>
    <h3 style="margin: 10px 0;">FEE CHALLAN</h3>
  </div>
  <table style="width:100%; border-collapse: collapse;">
    <tr><td><b>Challan No:</b></td><td>{{challanNumber}}</td><td><b>Date:</b></td><td>{{issueDate}}</td></tr>
    <tr><td><b>Student:</b></td><td>{{studentName}}</td><td><b>Roll No:</b></td><td>{{rollNumber}}</td></tr>
    <tr><td><b>Class:</b></td><td>{{className}}</td><td><b>Program:</b></td><td>{{programName}}</td></tr>
    <tr><td><b>Due Date:</b></td><td>{{dueDate}}</td><td><b>Installment:</b></td><td>{{installmentNumber}}</td></tr>
  </table>
  <hr/>
  <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
    <tr style="background: #f0f0f0;"><th style="text-align:left;padding:5px;">Description</th><th style="text-align:right;padding:5px;">Amount</th></tr>
    <tr><td style="padding:5px;">Tuition Fee</td><td style="text-align:right;padding:5px;">{{amount}}</td></tr>
    <tr><td style="padding:5px;">Discount</td><td style="text-align:right;padding:5px;">-{{discount}}</td></tr>
    <tr><td style="padding:5px;">Fine</td><td style="text-align:right;padding:5px;">{{fineAmount}}</td></tr>
    <tr style="font-weight:bold;border-top:2px solid #333;"><td style="padding:5px;">Net Payable</td><td style="text-align:right;padding:5px;">{{netPayable}}</td></tr>
  </table>
  <p style="margin-top:20px;font-size:11px;">This is a computer-generated challan. Please pay before the due date to avoid late fees.</p>
</div>`,
    },
  });

  console.log('\n✅ SEED COMPLETE! Summary:');
  console.log('  📋 1 Institute Settings');
  console.log(`  🏢 ${depts.length} Departments`);
  console.log(`  📚 ${programs.length} Programs`);
  console.log(`  🏫 ${classes.length} Classes`);
  console.log(`  📖 ${sections.length} Sections`);
  console.log(`  👨‍🏫 ${staff.length} Staff Members`);
  console.log(`  📝 ${subjects.length} Subjects`);
  console.log(`  💰 ${feeHeads.length} Fee Heads`);
  console.log('  🏗️ 7 Fee Structures');
  console.log(`  🎓 ${allStudents.length} Students`);
  console.log(`  🧾 ${challanCount} Fee Challans`);
  console.log('  📊 5 Arrear Records');
  console.log('  📈 9 Finance Records');
  console.log('  🏠 15 Hostel Rooms');
  console.log('  📅 5 Holidays');
  console.log('  💼 1 Payroll Settings');
  console.log('  📋 1 Challan Template');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
