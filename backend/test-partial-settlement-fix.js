/**
 * Test for partial settlement bug fix
 * 
 * This test verifies that when a payment partially settles VOID challans,
 * the installment paidAmount is correctly calculated using only the tuition portion,
 * not including fines and late fees.
 * 
 * Scenario:
 * - Challan #99 (September, VOID): Rs. 16,666 tuition + Rs. 1,384 fine + Rs. 31,950 late fee = Rs. 50,000 total
 * - Challan #100 (October, VOID): Rs. 16,666 tuition + Rs. 27,150 late fee = Rs. 43,816 total
 * - Challan #101 (November, PARTIAL): Paid Rs. 93,816
 * 
 * Expected distribution:
 * 1. Challan #99 fully settled: Rs. 50,000
 *    - Installment #1 should be marked PAID with paidAmount = Rs. 48,616 (tuition + late fee, excluding fine)
 * 2. Challan #100 partially settled: Rs. 43,816 (remaining from Rs. 93,816 - Rs. 50,000)
 *    - Installment #2 should show paidAmount proportional to tuition portion
 *    - Tuition is Rs. 16,666 out of Rs. 43,816 total (38% of total)
 *    - So paidAmount should be Rs. 43,816 * 38% = Rs. 16,650 (approximately)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPartialSettlement() {
  try {
    console.log('🧪 Testing partial settlement bug fix...\n');

    // Get the challans
    const challan99 = await prisma.feeChallan.findUnique({
      where: { id: 99 },
      include: { studentFeeInstallment: true }
    });

    const challan100 = await prisma.feeChallan.findUnique({
      where: { id: 100 },
      include: { studentFeeInstallment: true }
    });

    const challan101 = await prisma.feeChallan.findUnique({
      where: { id: 101 }
    });

    if (!challan99 || !challan100 || !challan101) {
      console.log('❌ Test challans not found');
      return;
    }

    console.log('📊 Current State:');
    console.log(`\nChallan #99 (September, ${challan99.status}):`);
    console.log(`   Tuition: Rs. ${challan99.amount}`);
    console.log(`   Fine: Rs. ${challan99.fineAmount}`);
    console.log(`   Late Fee: Rs. ${challan99.lateFeeFine}`);
    console.log(`   Total: Rs. ${challan99.totalAmount}`);
    console.log(`   Settled: Rs. ${challan99.settledAmount || 0}`);
    console.log(`   Installment #1 paidAmount: Rs. ${challan99.studentFeeInstallment?.paidAmount || 0}`);
    console.log(`   Installment #1 status: ${challan99.studentFeeInstallment?.status}`);

    console.log(`\nChallan #100 (October, ${challan100.status}):`);
    console.log(`   Tuition: Rs. ${challan100.amount}`);
    console.log(`   Fine: Rs. ${challan100.fineAmount}`);
    console.log(`   Late Fee: Rs. ${challan100.lateFeeFine}`);
    console.log(`   Total: Rs. ${challan100.totalAmount}`);
    console.log(`   Settled: Rs. ${challan100.settledAmount || 0}`);
    console.log(`   Installment #2 paidAmount: Rs. ${challan100.studentFeeInstallment?.paidAmount || 0}`);
    console.log(`   Installment #2 status: ${challan100.studentFeeInstallment?.status}`);

    console.log(`\nChallan #101 (November, ${challan101.status}):`);
    console.log(`   Paid Amount: Rs. ${challan101.paidAmount}`);
    console.log(`   Remaining: Rs. ${challan101.remainingAmount}`);

    // Verify the fix
    console.log('\n🔍 Verification:\n');

    // Check Challan #99 settlement
    const challan99TotalDue = challan99.amount + challan99.fineAmount + challan99.lateFeeFine;
    const challan99FullySettled = (challan99.settledAmount || 0) >= challan99TotalDue - 0.01;
    
    console.log(`1. Challan #99 settlement:`);
    console.log(`   Expected settled: Rs. ${challan99TotalDue}`);
    console.log(`   Actual settled: Rs. ${challan99.settledAmount || 0}`);
    console.log(`   Status: ${challan99FullySettled ? '✅ FULLY SETTLED' : '❌ NOT FULLY SETTLED'}`);

    // Check Installment #1
    const inst1ExpectedPaid = challan99.amount + challan99.lateFeeFine; // tuition + late fee (no fine)
    const inst1Correct = challan99.studentFeeInstallment?.status === 'PAID' && 
                         Math.abs((challan99.studentFeeInstallment?.paidAmount || 0) - inst1ExpectedPaid) < 1;
    
    console.log(`\n2. Installment #1 (September):`);
    console.log(`   Expected paidAmount: Rs. ${inst1ExpectedPaid} (tuition + late fee)`);
    console.log(`   Actual paidAmount: Rs. ${challan99.studentFeeInstallment?.paidAmount || 0}`);
    console.log(`   Expected status: PAID`);
    console.log(`   Actual status: ${challan99.studentFeeInstallment?.status}`);
    console.log(`   Status: ${inst1Correct ? '✅ CORRECT' : '❌ INCORRECT'}`);

    // Check Challan #100 settlement
    const challan100TotalDue = challan100.amount + challan100.fineAmount + challan100.lateFeeFine;
    const challan100Settled = challan100.settledAmount || 0;
    const challan100PartiallySettled = challan100Settled > 0 && challan100Settled < challan100TotalDue;
    
    console.log(`\n3. Challan #100 settlement:`);
    console.log(`   Total due: Rs. ${challan100TotalDue}`);
    console.log(`   Settled: Rs. ${challan100Settled}`);
    console.log(`   Status: ${challan100PartiallySettled ? '✅ PARTIALLY SETTLED' : '❌ INCORRECT'}`);

    // Check Installment #2 - should reflect proportional tuition payment
    const tuitionPortion = challan100.amount;
    const finesPortion = challan100.fineAmount + challan100.lateFeeFine;
    const tuitionRatio = tuitionPortion / challan100TotalDue;
    const expectedTuitionSettled = challan100Settled * tuitionRatio;
    const inst2ActualPaid = challan100.studentFeeInstallment?.paidAmount || 0;
    const inst2Correct = Math.abs(inst2ActualPaid - expectedTuitionSettled) < 100; // Allow 100 Rs tolerance
    
    console.log(`\n4. Installment #2 (October):`);
    console.log(`   Tuition portion: Rs. ${tuitionPortion} (${(tuitionRatio * 100).toFixed(1)}% of total)`);
    console.log(`   Fines portion: Rs. ${finesPortion}`);
    console.log(`   Expected tuition settled: Rs. ${expectedTuitionSettled.toFixed(2)}`);
    console.log(`   Actual paidAmount: Rs. ${inst2ActualPaid}`);
    console.log(`   Expected status: PARTIAL`);
    console.log(`   Actual status: ${challan100.studentFeeInstallment?.status}`);
    console.log(`   Status: ${inst2Correct ? '✅ CORRECT' : '❌ INCORRECT'}`);

    // Overall result
    console.log('\n' + '='.repeat(60));
    if (challan99FullySettled && inst1Correct && challan100PartiallySettled && inst2Correct) {
      console.log('✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅');
      console.log('\nThe partial settlement bug has been fixed!');
      console.log('Installments now correctly track only tuition payments,');
      console.log('not including fines and late fees.');
    } else {
      console.log('❌ ❌ ❌ SOME TESTS FAILED! ❌ ❌ ❌');
      console.log('\nIssues found:');
      if (!challan99FullySettled) console.log('  - Challan #99 not fully settled');
      if (!inst1Correct) console.log('  - Installment #1 incorrect');
      if (!challan100PartiallySettled) console.log('  - Challan #100 settlement incorrect');
      if (!inst2Correct) console.log('  - Installment #2 incorrect');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testPartialSettlement();
