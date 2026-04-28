/**
 * Verification Script: Check Frozen Amounts Backfill
 * 
 * This script verifies that the frozen amounts were correctly backfilled.
 * 
 * Usage: node backend/prisma/migrations/verify_frozen_amounts.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyBackfill() {
  console.log('Verifying frozen amounts backfill...\n');
  
  try {
    // Check total challan count
    const totalCount = await prisma.feeChallan.count();
    console.log(`Total challans in database: ${totalCount}`);
    
    // Check challans with NULL baseAmount
    const nullBaseAmount = await prisma.feeChallan.count({
      where: { baseAmount: null }
    });
    console.log(`Challans with NULL baseAmount: ${nullBaseAmount}`);
    
    // Check challans with NULL computedTotalDue
    const nullComputedTotal = await prisma.feeChallan.count({
      where: { computedTotalDue: null }
    });
    console.log(`Challans with NULL computedTotalDue: ${nullComputedTotal}`);
    
    // Check ChallanSettlement table
    const settlementCount = await prisma.challanSettlement.count();
    console.log(`\nChallanSettlement records: ${settlementCount} (expected 0 for legacy data)`);
    
    // Check StudentFeeInstallment field rename
    const installmentSample = await prisma.studentFeeInstallment.findFirst({
      select: {
        id: true,
        outstandingPrincipal: true,
        lateFeeSnapshot: true,
        lateFeeSnapshotAt: true
      }
    });
    console.log(`\nStudentFeeInstallment sample:`, installmentSample);
    
    // Sample a few challans to verify data
    const sampleChallans = await prisma.feeChallan.findMany({
      take: 3,
      select: {
        id: true,
        challanNumber: true,
        amount: true,
        baseAmount: true,
        totalAmount: true,
        computedTotalDue: true,
        paidAmount: true,
        amountReceived: true,
        remainingAmount: true,
        outstandingAmount: true,
        settlementSnapshot: true
      }
    });
    
    console.log(`\nSample challans (showing legacy vs new fields):`);
    sampleChallans.forEach(challan => {
      console.log(`\nChallan #${challan.challanNumber}:`);
      console.log(`  Legacy: amount=${challan.amount}, totalAmount=${challan.totalAmount}, paidAmount=${challan.paidAmount}, remainingAmount=${challan.remainingAmount}`);
      console.log(`  New: baseAmount=${challan.baseAmount}, computedTotalDue=${challan.computedTotalDue}, amountReceived=${challan.amountReceived}, outstandingAmount=${challan.outstandingAmount}`);
      console.log(`  settlementSnapshot: ${challan.settlementSnapshot ? 'NOT NULL (should be NULL)' : 'NULL ✓'}`);
    });
    
    console.log('\n✓ Verification complete!');
    
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyBackfill()
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
