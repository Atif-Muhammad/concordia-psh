import { PrismaClient, Prisma, ProgramLevel, Role, AttendanceStatus, StaffType, StaffStatus, EmployeeDepartment, StaffLeaveType, StaffLeaveStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();


async function main() {
 

  const password = await bcrypt.hash('ijlalHayat@2026', 10);

  const superAdmin = await prisma.admin.create({
    data: {
      name: 'Super Admin',
      email: 'concordiacollegepeshawar@gmail.com',
      password,
      role: Role.SUPER_ADMIN,
      permissions: { modules: ['Dashboard', 'Front Office', 'Students', 'Staff', 'Attendance', 'Fee Management', 'Examination', 'Academics', 'HR & Payroll', 'Boarding', 'Finance', 'Inventory', 'Complaints', 'Configuration'] },
    },
  });

}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
