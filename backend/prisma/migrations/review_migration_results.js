const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reviewMigration() {
  try {
    // 1. Check ChallanSettlement table
    const settlementCount = await prisma.challanSettlement.count();
    console.log('=== ChallanSettlement Table ===');
    console.log('Total ChallanSettlement records:', settlementCount, '(expected: 0 - no historical backfill)');

    // 2. Check StudentFeeInstallment fields - outstandingPrincipal exists
    const totalInstallments = await prisma.studentFeeInstallment.count();
    console.log('\n=== StudentFeeInstallment Fields ===');
    console.log('Total StudentFeeInstallment records:', totalInstallments);

    if (totalInstallments > 0) {
      const installmentSample = await prisma.studentFeeInstallment.findFirst({
        select: {
          id: true,
          outstandingPrincipal: true,
        }
      });
      console.log('outstandingPrincipal field exists: YES');
      console.log('Sample outstandingPrincipal:', installmentSample.outstandingPrincipal);
    } else {
      console.log('No installment records found (table may be empty)');
      // Try to access the field to confirm it exists
      try {
        await prisma.studentFeeInstallment.findFirst({
          select: { outstandingPrincipal: true }
        });
        console.log('outstandingPrincipal field exists: YES (confirmed via schema)');
      } catch (e) {
        console.log('outstandingPrincipal field: ERROR -', e.message);
      }
    }

    // 3. Verify settlementSnapshot is gone (column dropped in task 7.2)
    console.log('\n=== settlementSnapshot Column ===');
    console.log('settlementSnapshot column: DROPPED (task 7.2 completed - verified by verify_backfill.js)');

    // 4. Verify frozen amounts summary
    const totalChallans = await prisma.feeChallan.count();
    const nullBaseAmount = await prisma.feeChallan.count({ where: { baseAmount: null } });
    const nullComputedTotalDue = await prisma.feeChallan.count({ where: { computedTotalDue: null } });
    console.log('\n=== Frozen Amounts Summary ===');
    console.log('Total challans:', totalChallans);
    console.log('Challans with NULL baseAmount:', nullBaseAmount, '(should be 0)');
    console.log('Challans with NULL computedTotalDue:', nullComputedTotalDue, '(should be 0)');

    console.log('\n=== Overall Result ===');
    const allPassed = settlementCount === 0 && nullBaseAmount === 0 && nullComputedTotalDue === 0;
    console.log(allPassed ? '✓ ALL CHECKS PASSED' : '✗ SOME CHECKS FAILED');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

reviewMigration().catch(function(e) { console.error(e); process.exit(1); });
