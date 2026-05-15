import { PrismaClient } from '@prisma/client';

async function check() {
  const prisma = new PrismaClient();
  try {
    const student = await prisma.student.findFirst();
    console.log('Student fields:', Object.keys(student || {}));
    console.log('Sample student:', JSON.stringify(student, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

check();
