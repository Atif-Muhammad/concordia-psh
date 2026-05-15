import { PrismaClient, Prisma, ProgramLevel, Role, AttendanceStatus, StaffType, StaffStatus, EmployeeDepartment, StaffLeaveType, StaffLeaveStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const random = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickN = <T>(items: T[], count: number): T[] => {
  const copy = [...items];
  const out: T[] = [];
  while (copy.length && out.length < count) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

const toMonth = (d: Date) => `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`;

async function createInstituteSettingsCompat() {
  const data = {
    instituteName: 'Concordia Colleges Peshawar',
    phone: '091-5619915',
    email: 'info@concordiacolleges.edu.pk',
    address: 'University Town, Peshawar, Khyber Pakhtunkhwa, Pakistan',
    facebook: 'https://facebook.com/concordiacollegespeshawar',
    instagram: 'https://instagram.com/concordiacollegespeshawar',
    challanPrefix: 'CCP',
    lateFeeFine: 0,
    hostelLateFee: 0,
    lateFeeRatePerDay: 0,
    extraChallanLateFee: 0,
  };

  const optionalKeys: (keyof typeof data)[] = [
    'extraChallanLateFee',
    'lateFeeRatePerDay',
    'hostelLateFee',
    'lateFeeFine',
    'challanPrefix',
    'instagram',
    'facebook',
    'address',
    'email',
    'phone',
  ];

  let payload: Prisma.InstituteSettingsCreateInput = { ...data };
  for (let i = 0; i <= optionalKeys.length; i++) {
    try {
      await prisma.instituteSettings.create({
        data: payload,
        select: { id: true },
      });
      return { instituteName: data.instituteName };
    } catch (e: any) {
      if (e?.code === 'P2022' && e?.meta?.column) {
        const missing = String(e.meta.column);
        if (missing !== 'instituteName') {
          delete (payload as Record<string, unknown>)[missing];
        }
        continue;
      }
      if (e?.code === 'P2002') {
        return { instituteName: data.instituteName };
      }
      throw e;
    }
  }

  return { instituteName: data.instituteName };
}

async function resetDb() {
  const safeDelete = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e: any) {
      if (e?.code === 'P2021' || e?.code === 'P2022') {
        console.log(`Skipping ${label} cleanup (missing in current DB).`);
        return;
      }
      throw e;
    }
  };

  // Reverse-ish dependency order using Prisma-only operations.
  await safeDelete('inventoryExpense', () => prisma.inventoryExpense.deleteMany());
  await safeDelete('schoolInventory', () => prisma.schoolInventory.deleteMany());
  await safeDelete('hostelInventory', () => prisma.hostelInventory.deleteMany());
  await safeDelete('hostelExpense', () => prisma.hostelExpense.deleteMany());
  await safeDelete('roomAllocation', () => prisma.roomAllocation.deleteMany());
  await safeDelete('room', () => prisma.room.deleteMany());
  await safeDelete('hostelRegistration', () => prisma.hostelRegistration.deleteMany());
  await safeDelete('position', () => prisma.position.deleteMany());
  await safeDelete('result', () => prisma.result.deleteMany());
  await safeDelete('marks', () => prisma.marks.deleteMany());
  await safeDelete('examSchedule', () => prisma.examSchedule.deleteMany());
  await safeDelete('exam', () => prisma.exam.deleteMany());
  await safeDelete('attendance', () => prisma.attendance.deleteMany());
  await safeDelete('attendanceSkip', () => prisma.attendanceSkip.deleteMany());
  await safeDelete('leave', () => prisma.leave.deleteMany());
  await safeDelete('staffAttendance', () => prisma.staffAttendance.deleteMany());
  await safeDelete('staffLeave', () => prisma.staffLeave.deleteMany());
  await safeDelete('payrollPayment', () => prisma.payrollPayment.deleteMany());
  await safeDelete('payroll', () => prisma.payroll.deleteMany());
  await safeDelete('advanceSalary', () => prisma.advanceSalary.deleteMany());
  await safeDelete('teacherSubjectMapping', () => prisma.teacherSubjectMapping.deleteMany());
  await safeDelete('teacherClassSectionMapping', () => prisma.teacherClassSectionMapping.deleteMany());
  await safeDelete('classTimetable', () => prisma.classTimetable.deleteMany());
  await safeDelete('subjectClassMapping', () => prisma.subjectClassMapping.deleteMany());
  await safeDelete('subject', () => prisma.subject.deleteMany());
  await safeDelete('studentAcademicRecord', () => prisma.studentAcademicRecord.deleteMany());
  await safeDelete('studentStatusHistory', () => prisma.studentStatusHistory.deleteMany());
  await safeDelete('student', () => prisma.student.deleteMany());
  await safeDelete('section', () => prisma.section.deleteMany());
  await safeDelete('class', () => prisma.class.deleteMany());
  await safeDelete('program', () => prisma.program.deleteMany());
  await safeDelete('department', () => prisma.department.deleteMany());
  await safeDelete('academicSession', () => prisma.academicSession.deleteMany());
  await safeDelete('staffLeaveSettings', () => prisma.staffLeaveSettings.deleteMany());
  await safeDelete('staff', () => prisma.staff.deleteMany());
  await safeDelete('admin', () => prisma.admin.deleteMany());
  await safeDelete('payrollSettings', () => prisma.payrollSettings.deleteMany());
  await safeDelete('instituteSettings', () => prisma.instituteSettings.deleteMany());
}

async function main() {
  console.log('Seeding comprehensive demo data...');
  await resetDb();

  const password = await bcrypt.hash('123', 10);

  const institute = await createInstituteSettingsCompat();

  const superAdmin = await prisma.admin.create({
    data: {
      name: 'Super Admin',
      email: 'concordiasuper1@gmail.com',
      password,
      role: Role.SUPER_ADMIN,
      permissions: { modules: ['Dashboard', 'Front Office', 'Students', 'Staff', 'Attendance', 'Fee Management', 'Examination', 'Academics', 'HR & Payroll', 'Boarding', 'Finance', 'Inventory', 'Complaints', 'Configuration'] },
    },
  });

  const sessions = await Promise.all([
    prisma.academicSession.create({ data: { name: '2024-2025', startDate: new Date('2024-08-01'), endDate: new Date('2025-06-30'), isActive: false } }),
    prisma.academicSession.create({ data: { name: '2025-2026', startDate: new Date('2025-08-01'), endDate: new Date('2026-06-30'), isActive: true } }),
    prisma.academicSession.create({ data: { name: '2026-2027', startDate: new Date('2026-08-01'), endDate: new Date('2027-06-30'), isActive: false } }),
  ]);
  const activeSession = sessions[1];

  const departmentsData = [
    { name: 'Computer Science', description: 'Computing and software studies' },
    { name: 'Medical', description: 'Pre-medical and life sciences' },
    { name: 'Physics', description: 'Physical sciences and mathematics' },
    { name: 'Commerce', description: 'Business and accounting studies' },
    { name: 'Humanities', description: 'Arts and social sciences' },
  ];

  const departments = [] as Awaited<ReturnType<typeof prisma.department.create>>[];
  for (const d of departmentsData) {
    departments.push(await prisma.department.create({ data: d }));
  }

  const getDept = (name: string) => departments.find((d) => d.name === name)!;

  const programs = await Promise.all([
    prisma.program.create({ data: { name: 'FSc Pre-Medical', level: ProgramLevel.INTERMEDIATE, duration: '2 Years', rollPrefix: 'FSCM', departmentId: getDept('Medical').id } }),
    prisma.program.create({ data: { name: 'FSc Pre-Engineering', level: ProgramLevel.INTERMEDIATE, duration: '2 Years', rollPrefix: 'FSCE', departmentId: getDept('Physics').id } }),
    prisma.program.create({ data: { name: 'ICS', level: ProgramLevel.INTERMEDIATE, duration: '2 Years', rollPrefix: 'ICS', departmentId: getDept('Computer Science').id } }),
    prisma.program.create({ data: { name: 'FA', level: ProgramLevel.INTERMEDIATE, duration: '2 Years', rollPrefix: 'FA', departmentId: getDept('Humanities').id } }),
    prisma.program.create({ data: { name: 'ICom', level: ProgramLevel.INTERMEDIATE, duration: '2 Years', rollPrefix: 'ICOM', departmentId: getDept('Commerce').id } }),
    prisma.program.create({ data: { name: 'BS Computer Science', level: ProgramLevel.UNDERGRADUATE, duration: '4 Years', rollPrefix: 'BSCS', departmentId: getDept('Computer Science').id } }),
    prisma.program.create({ data: { name: 'BS Physics', level: ProgramLevel.UNDERGRADUATE, duration: '4 Years', rollPrefix: 'BSPHY', departmentId: getDept('Physics').id } }),
    prisma.program.create({ data: { name: 'BBA', level: ProgramLevel.UNDERGRADUATE, duration: '4 Years', rollPrefix: 'BBA', departmentId: getDept('Commerce').id } }),
  ]);

  const classes: Awaited<ReturnType<typeof prisma.class.create>>[] = [];
  for (const p of programs) {
    if (p.level === ProgramLevel.UNDERGRADUATE) {
      for (let sem = 1; sem <= 4; sem++) {
        classes.push(await prisma.class.create({
          data: {
            name: `Semester ${sem}`,
            year: Math.ceil(sem / 2),
            semester: sem,
            isSemester: true,
            rollPrefix: `${p.rollPrefix}-S${sem}`,
            programId: p.id,
          },
        }));
      }
    } else {
      for (const y of [1, 2]) {
        classes.push(await prisma.class.create({
          data: {
            name: y === 1 ? '1st Year' : '2nd Year',
            year: y,
            isSemester: false,
            rollPrefix: `${p.rollPrefix}-${y}`,
            programId: p.id,
          },
        }));
      }
    }
  }

  const sections: Awaited<ReturnType<typeof prisma.section.create>>[] = [];
  for (const c of classes) {
    for (const sec of ['A', 'B']) {
      sections.push(await prisma.section.create({ data: { name: sec, classId: c.id, capacity: 60, room: `${c.id}${sec}` } }));
    }
  }

  const staffSeed = [
    { name: 'Dr. Ayesha Khan', email: 'ayesha.khan@concordia.edu.pk', designation: 'Lecturer Biology', isTeaching: true, isNonTeaching: false, dept: 'Medical', basicPay: 95000, empDepartment: EmployeeDepartment.OTHER },
    { name: 'Engr. Hamza Ali', email: 'hamza.ali@concordia.edu.pk', designation: 'Lecturer Physics', isTeaching: true, isNonTeaching: false, dept: 'Physics', basicPay: 92000, empDepartment: EmployeeDepartment.OTHER },
    { name: 'Sana Iqbal', email: 'sana.iqbal@concordia.edu.pk', designation: 'Accounts Officer', isTeaching: false, isNonTeaching: true, dept: 'Commerce', basicPay: 85000, empDepartment: EmployeeDepartment.FINANCE },
    { name: 'Bilal Ahmad', email: 'bilal.ahmad@concordia.edu.pk', designation: 'HR Officer', isTeaching: false, isNonTeaching: true, dept: 'Humanities', basicPay: 82000, empDepartment: EmployeeDepartment.ADMIN },
    { name: 'Naveed Raza', email: 'naveed.raza@concordia.edu.pk', designation: 'Lab Assistant', isTeaching: false, isNonTeaching: true, dept: 'Computer Science', basicPay: 80000, empDepartment: EmployeeDepartment.LAB },
    { name: 'Mariam Noor', email: 'mariam.noor@concordia.edu.pk', designation: 'Teacher Coordinator', isTeaching: true, isNonTeaching: true, dept: 'Computer Science', basicPay: 98000, empDepartment: EmployeeDepartment.ADMIN },
    { name: 'Usman Tariq', email: 'usman.tariq@concordia.edu.pk', designation: 'Academic Coordinator', isTeaching: true, isNonTeaching: true, dept: 'Physics', basicPay: 100000, empDepartment: EmployeeDepartment.ADMIN },
  ];

  const staff = [] as Awaited<ReturnType<typeof prisma.staff.create>>[];
  for (let i = 0; i < staffSeed.length; i++) {
    const s = staffSeed[i];
    staff.push(await prisma.staff.create({
      data: {
        name: s.name,
        email: s.email,
        password,
        phone: `03${`${111111110 + i}`}`,
        cnic: `${`${11111 + i}`}-${`${1111111 + i}`}-${(i % 9) + 1}`,
        address: 'Peshawar, KP, Pakistan',
        religion: 'Islam',
        specialization: s.isTeaching ? random(['Biology', 'Physics', 'Computer Science', 'Mathematics']) : null,
        highestDegree: s.isTeaching ? random(['MS', 'MPhil', 'PhD']) : random(['BCom', 'MBA', 'BS']),
        staffType: StaffType.PERMANENT,
        status: StaffStatus.ACTIVE,
        basicPay: s.basicPay,
        joinDate: daysAgo(randomInt(400, 1200)),
        departmentId: getDept(s.dept).id,
        isTeaching: s.isTeaching,
        isNonTeaching: s.isNonTeaching,
        designation: s.designation,
        empDepartment: s.empDepartment,
      },
    }));
  }

  await prisma.payrollSettings.create({
    data: { absentDeduction: 1000, leaveDeduction: 800, leavesAllowed: 2, absentsAllowed: 1 },
  });

  const subjectNames = [
    'English', 'Urdu', 'Pakistan Studies', 'Islamiyat', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Statistics', 'Economics', 'Accounting', 'Programming Fundamentals', 'Object Oriented Programming', 'Data Structures'
  ];
  const subjects: Awaited<ReturnType<typeof prisma.subject.create>>[] = [];
  for (const name of subjectNames) {
    subjects.push(await prisma.subject.create({ data: { name } }));
  }

  for (const c of classes) {
    const mapped = pickN(subjects, c.isSemester ? 6 : 5);
    for (const sub of mapped) {
      await prisma.subjectClassMapping.create({
        data: {
          classId: c.id,
          subjectId: sub.id,
          sessionId: activeSession.id,
          creditHours: c.isSemester ? random([2, 3, 4]) : 0,
          code: `${sub.name.substring(0, 3).toUpperCase()}-${c.id}`,
        },
      });
    }
  }

  const teachers = staff.filter((s) => s.isTeaching);
  for (const t of teachers) {
    const teacherSubjects = pickN(subjects, 4);
    for (const sub of teacherSubjects) {
      await prisma.teacherSubjectMapping.create({ data: { teacherId: t.id, subjectId: sub.id } });
    }
  }

  for (const c of classes) {
    for (const sec of sections.filter((s) => s.classId === c.id)) {
      const teacher = random(teachers);
      await prisma.teacherClassSectionMapping.create({
        data: {
          teacherId: teacher.id,
          classId: c.id,
          sectionId: sec.id,
          sessionId: activeSession.id,
        },
      });
    }
  }

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  for (const c of classes) {
    for (const sec of sections.filter((s) => s.classId === c.id)) {
      const mappedSubs = await prisma.subjectClassMapping.findMany({ where: { classId: c.id, sessionId: activeSession.id } });
      const slots: { dayOfWeek: string; startTime: string; endTime: string; subjectId: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const startHour = 8 + i;
        slots.push({
          dayOfWeek: weekdays[i % weekdays.length],
          startTime: `${`${startHour}`.padStart(2, '0')}:00`,
          endTime: `${`${startHour + 1}`.padStart(2, '0')}:00`,
          subjectId: random(mappedSubs).subjectId,
        });
      }
      await prisma.classTimetable.create({ data: { classId: c.id, sectionId: sec.id, sessionId: activeSession.id, slots } });
    }
  }

  const maleNames = ['Ahmad', 'Ali', 'Hassan', 'Bilal', 'Usman', 'Hamza', 'Saad', 'Ibrahim', 'Zain', 'Daniyal'];
  const femaleNames = ['Areeba', 'Fatima', 'Hira', 'Maham', 'Noor', 'Ayesha', 'Sana', 'Iqra', 'Maryam', 'Laiba'];
  const lastNames = ['Khan', 'Yousafzai', 'Shah', 'Ahmed', 'Qureshi', 'Malik', 'Siddiqui', 'Nawaz'];

  const students: Awaited<ReturnType<typeof prisma.student.create>>[] = [];
  const totalStudents = 50;
  for (let i = 0; i < totalStudents; i++) {
    const cls = random(classes);
    const sec = random(sections.filter((s) => s.classId === cls.id));
    const prog = programs.find((p) => p.id === cls.programId)!;
    const dept = departments.find((d) => d.id === prog.departmentId)!;
    const gender = random(['Male', 'Female']);
    const first = gender === 'Male' ? random(maleNames) : random(femaleNames);
    const last = random(lastNames);

    const student = await prisma.student.create({
      data: {
        fName: first,
        lName: last,
        session: activeSession.name,
        fatherOrguardian: `${random(maleNames)} ${random(lastNames)}`,
        rollNumber: `${prog.rollPrefix}-${`${i + 1}`.padStart(3, '0')}`,
        parentOrGuardianPhone: `03${randomInt(100000000, 499999999)}`,
        address: 'Peshawar, KP, Pakistan',
        gender,
        religion: 'Islam',
        dob: daysAgo(randomInt(6000, 8000)),
        admissionDate: daysAgo(randomInt(120, 500)),
        tuitionFee: random([80000, 90000, 100000, 110000, 120000, 130000, 140000]),
        numberOfInstallments: 8,
        classId: cls.id,
        sectionId: sec.id,
        programId: prog.id,
        departmentId: dept.id,
      },
    });
    students.push(student);

    await prisma.studentAcademicRecord.create({
      data: {
        studentId: student.id,
        sessionId: activeSession.id,
        classId: cls.id,
        sectionId: sec.id,
        programId: prog.id,
        isCurrent: true,
      },
    });
  }

  const examTypes = ['Mid Term', 'Final Term', 'Quiz'];
  const previousExam = await prisma.exam.create({
    data: {
      examName: 'Spring Mid Term 2026',
      programId: programs[0].id,
      classId: classes[0].id,
      session: activeSession.name,
      sessionId: activeSession.id,
      type: examTypes[0],
      startDate: daysAgo(45),
      endDate: daysAgo(35),
      description: 'Completed exam for record history',
    },
  });

  const ongoingExam = await prisma.exam.create({
    data: {
      examName: 'Pre-Board Assessment May 2026',
      programId: programs[2].id,
      classId: classes[4].id,
      session: activeSession.name,
      sessionId: activeSession.id,
      type: examTypes[1],
      startDate: daysAgo(2),
      endDate: daysAgo(-5),
      description: 'Currently running examination',
    },
  });

  const upcomingExam = await prisma.exam.create({
    data: {
      examName: 'Summer Final 2026',
      programId: programs[5].id,
      classId: classes[10].id,
      session: activeSession.name,
      sessionId: activeSession.id,
      type: examTypes[1],
      startDate: daysAgo(-20),
      endDate: daysAgo(-10),
      description: 'Upcoming final exam schedule',
    },
  });

  for (const exam of [previousExam, ongoingExam, upcomingExam]) {
    const cId = exam.classId!;
    const examSubjects = (await prisma.subjectClassMapping.findMany({ where: { classId: cId, sessionId: activeSession.id } })).slice(0, 4);
    for (let i = 0; i < examSubjects.length; i++) {
      await prisma.examSchedule.create({
        data: {
          examId: exam.id,
          subjectId: examSubjects[i].subjectId,
          date: new Date(exam.startDate.getTime() + i * 24 * 60 * 60 * 1000),
          startTime: '09:00',
          endTime: '12:00',
          totalMarks: 100,
          room: `Hall-${i + 1}`,
        },
      });
    }
  }

  const attendanceDays = 60;
  for (let d = 0; d < attendanceDays; d++) {
    const date = daysAgo(d + 1);
    for (const s of students) {
      if (Math.random() < 0.6) {
        const subjectMap = await prisma.subjectClassMapping.findFirst({
          where: { classId: s.classId, sessionId: activeSession.id },
        });
        if (!subjectMap) continue;
        const teacherMap = await prisma.teacherClassSectionMapping.findFirst({
          where: { classId: s.classId, sectionId: s.sectionId ?? undefined, sessionId: activeSession.id },
        });

        await prisma.attendance.create({
          data: {
            studentId: s.id,
            classId: s.classId,
            sectionId: s.sectionId,
            subjectId: subjectMap.subjectId,
            teacherId: teacherMap?.teacherId,
            sessionId: activeSession.id,
            date,
            status: random([AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LEAVE, AttendanceStatus.HALF_DAY]),
            autoGenerated: true,
            generatedAt: date,
            markedAt: date,
          },
        });
      }
    }
  }

  for (let i = 0; i < 10; i++) {
    const target = random(staff);
    const start = daysAgo(20 + i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + randomInt(1, 3));
    await prisma.staffLeave.create({
      data: {
        month: toMonth(start),
        staffId: target.id,
        leaveType: random([StaffLeaveType.CASUAL, StaffLeaveType.SICK, StaffLeaveType.ANNUAL]),
        startDate: start,
        endDate: end,
        days: Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))),
        reason: random(['Medical checkup', 'Family commitment', 'Urgent personal work', 'Travel']),
        status: random([StaffLeaveStatus.APPROVED, StaffLeaveStatus.PENDING, StaffLeaveStatus.REJECTED]),
      },
    });
  }

  const payrollMonths = [
    toMonth(daysAgo(120)),
    toMonth(daysAgo(90)),
    toMonth(daysAgo(60)),
    toMonth(daysAgo(30)),
    toMonth(new Date()),
  ];

  for (const st of staff) {
    for (const month of payrollMonths) {
      const basic = Number(st.basicPay ?? 80000);
      const totalAllowances = random([5000, 7000, 9000]);
      const totalDeductions = random([2000, 3000, 4000]);
      const net = basic + totalAllowances - totalDeductions;
      await prisma.payroll.create({
        data: {
          month,
          staffId: st.id,
          employeeId: st.isNonTeaching ? st.id : null,
          teacherId: st.isTeaching ? st.id : null,
          basicSalary: basic,
          travelAllowance: 2000,
          houseRentAllowance: 3000,
          medicalAllowance: 2000,
          totalAllowances,
          absentDeduction: 1000,
          leaveDeduction: 500,
          incomeTax: 1000,
          eobi: 500,
          totalDeductions,
          netSalary: net,
          paidAmount: random([net, net, net * 0.7]),
          status: random(['PAID', 'PAID', 'PARTIAL_PAID']),
          generatedById: superAdmin.id,
          generatedByName: superAdmin.name,
          paymentDate: daysAgo(randomInt(1, 25)),
        },
      });
    }

    await prisma.advanceSalary.create({
      data: {
        staffId: st.id,
        employeeId: st.isNonTeaching ? st.id : null,
        teacherId: st.isTeaching ? st.id : null,
        amount: random([5000, 10000, 15000, 20000]),
        month: toMonth(daysAgo(35)),
        remarks: 'Historical advance salary',
      },
    });

    await prisma.advanceSalary.create({
      data: {
        staffId: st.id,
        employeeId: st.isNonTeaching ? st.id : null,
        teacherId: st.isTeaching ? st.id : null,
        amount: random([5000, 10000, 15000]),
        month: toMonth(new Date()),
        remarks: 'Current month advance salary',
      },
    });
  }

  for (let d = 0; d < 95; d++) {
    const date = daysAgo(d + 1);
    for (const st of staff) {
      if (Math.random() < 0.85) {
        await prisma.staffAttendance.create({
          data: {
            staffId: st.id,
            date,
            status: random([AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LEAVE, AttendanceStatus.SHORT_LEAVE]),
            markedBy: superAdmin.id,
            generatedAt: date,
            markedAt: date,
            autoGenerated: true,
          },
        });
      }
    }
  }

  const internalBoarders = pickN(students, 10);
  const externalCount = 10;

  const registrations: Awaited<ReturnType<typeof prisma.hostelRegistration.create>>[] = [];
  for (let i = 0; i < internalBoarders.length; i++) {
    registrations.push(await prisma.hostelRegistration.create({
      data: {
        id: `HR-INT-${`${i + 1}`.padStart(3, '0')}`,
        studentId: internalBoarders[i].id,
        decidedFeePerMonth: random([2000, 2500, 3000, 3500, 4000]),
        hostelName: random(['Iqbal Hostel', 'Quaid Hostel']),
        registrationDate: daysAgo(randomInt(30, 200)),
        status: 'active',
      },
    }));
  }

  for (let i = 0; i < externalCount; i++) {
    registrations.push(await prisma.hostelRegistration.create({
      data: {
        id: `HR-EXT-${`${i + 1}`.padStart(3, '0')}`,
        externalName: `${random(maleNames)} ${random(lastNames)}`,
        externalInstitute: random(['Peshawar Model College', 'Islamia College', 'University of Peshawar']),
        externalGuardianName: `${random(maleNames)} ${random(lastNames)}`,
        externalGuardianNumber: `03${randomInt(100000000, 499999999)}`,
        address: 'Peshawar, KP',
        decidedFeePerMonth: random([2000, 2500, 3000, 3500, 4000]),
        hostelName: random(['Iqbal Hostel', 'Quaid Hostel']),
        registrationDate: daysAgo(randomInt(20, 250)),
        status: 'active',
      },
    }));
  }

  const rooms: Awaited<ReturnType<typeof prisma.room.create>>[] = [];
  for (let i = 1; i <= 12; i++) {
    rooms.push(await prisma.room.create({
      data: {
        roomNumber: `R-${`${i}`.padStart(3, '0')}`,
        roomType: random(['double', 'triple']),
        capacity: random([2, 3]),
        currentOccupancy: 0,
        status: 'vacant',
        hostelName: random(['Iqbal Hostel', 'Quaid Hostel']),
      },
    }));
  }

  for (const reg of registrations) {
    const room = random(rooms);
    await prisma.roomAllocation.create({
      data: {
        roomId: room.id,
        studentId: reg.studentId ?? null,
        externalName: reg.externalName ?? null,
        allocationDate: daysAgo(randomInt(1, 90)),
      },
    });
  }

  const hostelExpenseTitles = ['Mess Grocery', 'Electricity Bill', 'Water Bill', 'Gas Refill', 'Maintenance', 'Furniture Repair', 'Cleaning Supplies', 'Security Services', 'Internet Bill', 'Medical First Aid'];
  for (let i = 0; i < 10; i++) {
    await prisma.hostelExpense.create({
      data: {
        expenseTitle: hostelExpenseTitles[i],
        amount: random([5000, 7000, 9000, 12000, 15000]),
        date: daysAgo(randomInt(1, 120)),
        remarks: 'Hostel operating expense',
      },
    });
  }

  const schoolInventoryCategories = ['Lab Equipment', 'Sports Equipment', 'Classroom Furniture', 'IT Equipment', 'Library Assets', 'Electrical'];
  for (let i = 1; i <= 100; i++) {
    const unitPrice = random([2000, 3000, 5000, 8000, 10000, 12000]);
    const quantity = randomInt(1, 25);
    const item = await prisma.schoolInventory.create({
      data: {
        itemName: `Inventory Item ${i}`,
        category: random(schoolInventoryCategories),
        quantity,
        unitPrice,
        totalValue: unitPrice * quantity,
        purchaseDate: daysAgo(randomInt(10, 700)),
        supplier: random(['Pak Traders', 'City Suppliers', 'EduTech Pvt Ltd', 'Star Scientific']),
        condition: random(['New', 'Good', 'Fair']),
        location: random(['Main Campus Store', 'Physics Lab', 'CS Lab', 'Sports Room', 'Library']),
        assignedTo: random(['Department', 'Lab', 'Class', 'Unassigned']),
        assignedToName: random(['Computer Science', 'Physics', 'Medical', 'Commerce', 'General']),
      },
    });

    if (Math.random() < 0.3) {
      await prisma.inventoryExpense.create({
        data: {
          inventoryItemId: item.id,
          expenseType: random(['Maintenance', 'Repair', 'Upgrade']),
          amount: random([1000, 2000, 3000, 5000]),
          date: daysAgo(randomInt(1, 200)),
          description: 'Routine upkeep expense',
          vendor: random(['FixIt Services', 'Lab Care', 'Metro Repairs']),
        },
      });
    }
  }

  console.log('Seed complete.');
  console.log(`Institute: ${institute.instituteName}`);
  console.log(`Students: ${students.length}, Staff: ${staff.length}, Classes: ${classes.length}, Sections: ${sections.length}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
