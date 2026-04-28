const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Data Migration Script: Backfill Settlement Snapshots
 * 
 * This script identifies existing VOID challans with settledAmount > 0,
 * finds their superseding challans, and creates retroactive settlement
 * snapshots based on payment history.
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */

async function main() {
  console.log('🚀 Starting Settlement Snapshot Backfill Migration...\n');

  try {
    // Step 1: Find all VOID challans with settledAmount > 0
    console.log('📊 Step 1: Identifying VOID challans with settled amounts...');
    const voidChallansWithSettlement = await prisma.feeChallan.findMany({
      where: {
        status: 'VOID',
        settledAmount: {
          gt: 0
        }
      },
      include: {
        supersededBy: {
          include: {
            supersedes: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log(`   Found ${voidChallansWithSettlement.length} VOID challans with settled amounts\n`);

    if (voidChallansWithSettlement.length === 0) {
      console.log('✅ No challans to migrate. Exiting.');
      return;
    }

    // Step 2: Group by superseding challan
    console.log('📊 Step 2: Grouping by superseding challans...');
    const supersedingChallanMap = new Map();

    for (const voidChallan of voidChallansWithSettlement) {
      if (!voidChallan.supersededBy) {
        console.log(`   ⚠️  Warning: Challan ${voidChallan.challanNumber} (ID: ${voidChallan.id}) has settledAmount but no superseding challan`);
        continue;
      }

      const supersedingId = voidChallan.supersededBy.id;
      if (!supersedingChallanMap.has(supersedingId)) {
        supersedingChallanMap.set(supersedingId, {
          challan: voidChallan.supersededBy,
          supersededChallans: []
        });
      }

      supersedingChallanMap.get(supersedingId).supersededChallans.push(voidChallan);
    }

    console.log(`   Grouped into ${supersedingChallanMap.size} superseding challans\n`);

    // Step 3: Create settlement snapshots for each superseding challan
    console.log('📊 Step 3: Creating settlement snapshots...\n');
    let processedCount = 0;
    let skippedCount = 0;
    let lockedCount = 0;

    for (const [supersedingId, data] of supersedingChallanMap) {
      const { challan: supersedingChallan, supersededChallans } = data;

      console.log(`   Processing Challan ${supersedingChallan.challanNumber} (ID: ${supersedingChallan.id})`);
      console.log(`   - Status: ${supersedingChallan.status}`);
      console.log(`   - Supersedes ${supersededChallans.length} challan(s)`);

      // Skip if already has settlement snapshot
      if (supersedingChallan.settlementSnapshot && 
          supersedingChallan.settlementSnapshot !== null &&
          typeof supersedingChallan.settlementSnapshot === 'object' &&
          Object.keys(supersedingChallan.settlementSnapshot).length > 0) {
        console.log(`   ⏭️  Skipping: Already has settlement snapshot\n`);
        skippedCount++;
        continue;
      }

      // Only create snapshots for PAID challans
      if (supersedingChallan.status !== 'PAID') {
        console.log(`   ⏭️  Skipping: Not PAID (status: ${supersedingChallan.status})\n`);
        skippedCount++;
        continue;
      }

      // Build settlement snapshot
      const settledChallans = supersededChallans.map(voidChallan => ({
        challanId: voidChallan.id,
        challanNumber: voidChallan.challanNumber,
        amountSettled: voidChallan.settledAmount || 0,
        settlementDate: supersedingChallan.paidDate 
          ? supersedingChallan.paidDate.toISOString() 
          : supersedingChallan.updatedAt.toISOString()
      }));

      const totalSettled = settledChallans.reduce((sum, item) => sum + item.amountSettled, 0);

      const settlementSnapshot = {
        settledChallans,
        totalSettled,
        paymentDate: supersedingChallan.paidDate 
          ? supersedingChallan.paidDate.toISOString() 
          : supersedingChallan.updatedAt.toISOString(),
        migratedAt: new Date().toISOString(),
        migrationNote: 'Retroactively created from existing settledAmount data'
      };

      // Update superseding challan with settlement snapshot
      await prisma.feeChallan.update({
        where: { id: supersedingChallan.id },
        data: {
          settlementSnapshot: settlementSnapshot
        }
      });

      console.log(`   ✅ Created settlement snapshot (total settled: ${totalSettled})`);

      // Step 4: Lock all superseded challans
      const challanIdsToLock = supersededChallans.map(c => c.id);
      const lockResult = await prisma.feeChallan.updateMany({
        where: {
          id: { in: challanIdsToLock },
          isLocked: false
        },
        data: {
          isLocked: true
        }
      });

      console.log(`   🔒 Locked ${lockResult.count} superseded challan(s)\n`);
      
      processedCount++;
      lockedCount += lockResult.count;
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Processed: ${processedCount} superseding challans`);
    console.log(`   ⏭️  Skipped: ${skippedCount} challans`);
    console.log(`   🔒 Locked: ${lockedCount} superseded challans`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('✨ Settlement Snapshot Backfill Migration Completed Successfully!');

  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    throw error;
  }
}

// Run the migration
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
