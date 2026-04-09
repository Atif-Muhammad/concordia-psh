const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const challans = await prisma.feeChallan.findMany({
    where: { studentId: 70 }
  });
  console.log(JSON.stringify(challans, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
