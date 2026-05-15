import { PrismaClient } from '@prisma/client';

async function check() {
  const prisma = new PrismaClient();
  try {
    const settings = await prisma.instituteSettings.findFirst();
    console.log('Institute Settings:', JSON.stringify(settings, null, 2));

    const overdue = await prisma.feeInstallment.findMany({
      where: {
        status: 'OVERDUE'
      },
      take: 5
    });
    console.log('Overdue Installments:', JSON.stringify(overdue, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

check();
