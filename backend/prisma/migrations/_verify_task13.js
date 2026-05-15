const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const challans = await prisma.feeChallan.findMany({
    take: 5,
    select: {
      id: true,
      challanNumber: true,
      amount: true,
      baseAmount: true,
      totalAmount: true,
      computedTotalDue: true,
      paidAmount: true,
      amountReceived: true,
      outstandingAmount: true,
    }
  });

  let allOk = true;
  challans.forEach(c => {
    console.log('Challan #' + c.challanNumber + ':');
    console.log('  Legacy:  amount=' + c.amount + ', totalAmount=' + c.totalAmount + ', paidAmount=' + c.paidAmount);
    console.log('  Frozen:  baseAmount=' + c.baseAmount + ', computedTotalDue=' + c.computedTotalDue + ', amountReceived=' + c.amountReceived + ', outstandingAmount=' + c.outstandingAmount);

    const baseOk = Number(c.baseAmount) === Number(c.amount || 0);
    const totalOk = Number(c.computedTotalDue) === Number(c.totalAmount || 0);
    const receivedOk = Number(c.amountReceived) === Number(c.paidAmount || 0);
    const expectedOutstanding = Math.max(0, Number(c.totalAmount || 0) - Number(c.paidAmount || 0));
    const outstandingOk = Math.abs(Number(c.outstandingAmount) - expectedOutstanding) < 0.01;

    console.log('  baseAmount == amount: ' + (baseOk ? 'OK' : 'FAIL'));
    console.log('  computedTotalDue == totalAmount: ' + (totalOk ? 'OK' : 'FAIL'));
    console.log('  amountReceived == paidAmount: ' + (receivedOk ? 'OK' : 'FAIL'));
    console.log('  outstandingAmount == GREATEST(0, totalAmount-paidAmount): ' + (outstandingOk ? 'OK (expected=' + expectedOutstanding + ')' : 'FAIL (expected=' + expectedOutstanding + ', got=' + c.outstandingAmount + ')'));

    if (!baseOk || !totalOk || !receivedOk || !outstandingOk) allOk = false;
  });

  console.log('\nOverall: ' + (allOk ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'));
  await prisma.$disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
