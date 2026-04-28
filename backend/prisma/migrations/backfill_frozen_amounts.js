/**
 * Data Migration Script: Backfill Frozen Amounts for Legacy Challans
 * 
 * This script populates the new frozen amount fields from legacy fields for all existing challans.
 * It should be run once after the schema migration is applied.
 * 
 * Usage: node backend/prisma/migrations/backfill_frozen_amounts.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfillFrozenAmounts() {
  console.log('Starting backfill of frozen amounts for legacy challans...');
  
  try {
    // Backfill frozen amounts from legacy fields
    const result = await prisma.$executeRaw`
      UPDATE feechallan 
      SET 
        baseAmount = COALESCE(amount, 0),
        computedTotalDue = COALESCE(totalAmount, 0),
        amountReceived = COALESCE(paidAmount, 0),
        outstandingAmount = GREATEST(0, COALESCE(totalAmount, 0) - COALESCE(paidAmount, 0))
      WHERE baseAmount IS NULL
    `;
    
    console.log(`✓ Backfilled frozen amounts for ${result} challans`);
    
    // Clear legacy settlementSnapshot JSON blobs (deprecated field)
    const clearResult = await prisma.$executeRaw`
      UPDATE feechallan 
      SET settlementSnapshot = NULL 
      WHERE settlementSnapshot IS NOT NULL
    `;
    
    console.log(`✓ Cleared settlementSnapshot for ${clearResult} challans`);
    
    // Verify the backfill
    const verifyCount = await prisma.feeChallan.count({
      where: {
        baseAmount: null
      }
    });
    
    if (verifyCount > 0) {
      console.warn(`⚠️  Warning: ${verifyCount} challans still have NULL baseAmount`);
    } else {
      console.log('✓ All challans have been backfilled successfully');
    }
    
    console.log('\nBackfill complete!');
    console.log('\nNOTE: Historical data will not have ChallanSettlement records.');
    console.log('Only new payments after this migration will create relational audit trail.');
    
  } catch (error) {
    console.error('Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillFrozenAmounts()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
