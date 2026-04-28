const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Verification Script: Check Settlement Snapshot Backfill Results
 * 
 * This script verifies that the backfill migration completed successfully
 * by checking the state of settlement snapshots and locked challans.
 */

async function main() {
  console.log('🔍 Verifying Settlement Snapshot Backfill Results...\n');

  try {
    // Check 1: Count VOID challans with settledAmount > 0
    const voidWithSettlement = await prisma.feeChallan.count({
      where: {
        status: 'VOID',
        settledAmount: { gt: 0 }
      }
    });
    console.log(`📊 VOID challans with settledAmount > 0: ${voidWithSettlement}`);

    // Check 2: Count locked VOID challans
    const lockedVoidChallans = await prisma.feeChallan.count({
      where: {
        status: 'VOID',
        isLocked: true
      }
    });
    console.log(`🔒 Locked VOID challans: ${lockedVoidChallans}`);

    // Check 3: Count challans with settlement snapshots
    const challansWithSnapshots = await prisma.feeChallan.count({
      where: {
        settlementSnapshot: { not: null }
      }
    });
    console.log(`📸 Challans with settlement snapshots: ${challansWithSnapshots}`);

    // Check 4: Sample settlement snapshot
    const sampleChallan = await prisma.feeChallan.findFirst({
      where: {
        settlementSnapshot: { not: null }
      },
      select: {
        id: true,
        challanNumber: true,
        status: true,
        settlementSnapshot: true
      }
    });

    if (sampleChallan) {
      console.log('\n📋 Sample Settlement Snapshot:');
      console.log(`   Challan: ${sampleChallan.challanNumber} (ID: ${sampleChallan.id})`);
      console.log(`   Status: ${sampleChallan.status}`);
      console.log(`   Snapshot:`, JSON.stringify(sampleChallan.settlementSnapshot, null, 2));
    }

    // Check 5: Verify consistency - VOID challans with settledAmount should be locked
    const unlockedSettledChallans = await prisma.feeChallan.findMany({
      where: {
        status: 'VOID',
        settledAmount: { gt: 0 },
        isLocked: false
      },
      select: {
        id: true,
        challanNumber: true,
        settledAmount: true,
        supersededById: true
      }
    });

    if (unlockedSettledChallans.length > 0) {
      console.log('\n⚠️  Warning: Found VOID challans with settledAmount but not locked:');
      unlockedSettledChallans.forEach(c => {
        console.log(`   - ${c.challanNumber} (ID: ${c.id}, Settled: ${c.settledAmount}, SupersededBy: ${c.supersededById})`);
      });
    } else {
      console.log('\n✅ All VOID challans with settledAmount are properly locked');
    }

    // Check 6: Verify superseding challans have snapshots
    const paidSupersedingChallans = await prisma.feeChallan.findMany({
      where: {
        status: 'PAID',
        supersedes: {
          some: {
            status: 'VOID',
            settledAmount: { gt: 0 }
          }
        }
      },
      select: {
        id: true,
        challanNumber: true,
        settlementSnapshot: true,
        supersedes: {
          select: {
            id: true,
            challanNumber: true,
            settledAmount: true
          }
        }
      }
    });

    const missingSnapshots = paidSupersedingChallans.filter(c => !c.settlementSnapshot);
    
    if (missingSnapshots.length > 0) {
      console.log('\n⚠️  Warning: PAID superseding challans missing settlement snapshots:');
      missingSnapshots.forEach(c => {
        console.log(`   - ${c.challanNumber} (ID: ${c.id})`);
        console.log(`     Supersedes: ${c.supersedes.map(s => `${s.challanNumber} (${s.settledAmount})`).join(', ')}`);
      });
    } else {
      console.log('\n✅ All PAID superseding challans have settlement snapshots');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 Verification Summary:');
    console.log(`   VOID with settlement: ${voidWithSettlement}`);
    console.log(`   Locked VOID: ${lockedVoidChallans}`);
    console.log(`   With snapshots: ${challansWithSnapshots}`);
    console.log(`   Unlocked settled: ${unlockedSettledChallans.length}`);
    console.log(`   Missing snapshots: ${missingSnapshots.length}`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (unlockedSettledChallans.length === 0 && missingSnapshots.length === 0) {
      console.log('✨ Verification Passed! Migration completed successfully.');
    } else {
      console.log('⚠️  Verification found issues. Review warnings above.');
    }

  } catch (error) {
    console.error('❌ Verification failed with error:', error);
    throw error;
  }
}

// Run the verification
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
