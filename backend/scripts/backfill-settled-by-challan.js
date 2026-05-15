/**
 * One-time backfill: set settledByChallanNumber on SUPERSEDED challans that have null.
 * Run: node scripts/backfill-settled-by-challan.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  const superseded = await prisma.feeInstallmentChallan.findMany({
    where: { status: 'SUPERSEDED', settledByChallanNumber: null },
    select: { id: true, installmentId: true, challanNumber: true },
  });

  console.log(`Found ${superseded.length} SUPERSEDED challans with no settledByChallanNumber`);

  for (const sc of superseded) {
    if (!sc.installmentId) continue;

    const inst = await prisma.feeInstallment.findUnique({
      where: { id: sc.installmentId },
      select: { studentId: true },
    });
    if (!inst) continue;

    // The leading challan is the active (non-SUPERSEDED/VOID/SETTLED) challan
    // with the highest installmentNo for this student
    const leader = await prisma.feeInstallmentChallan.findFirst({
      where: {
        installment: { studentId: inst.studentId },
        status: { notIn: ['SUPERSEDED', 'VOID', 'SETTLED'] },
      },
      orderBy: { installmentNo: 'desc' },
      select: { challanNumber: true },
    });

    if (!leader) {
      console.log(`  No active leader found for challan ${sc.challanNumber} — skipping`);
      continue;
    }

    console.log(`  Challan ${sc.challanNumber} -> settledByChallanNumber = ${leader.challanNumber}`);
    await prisma.feeInstallmentChallan.update({
      where: { id: sc.id },
      data: { settledByChallanNumber: leader.challanNumber },
    });
  }

  console.log('Backfill complete');
  await prisma.$disconnect();
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});
