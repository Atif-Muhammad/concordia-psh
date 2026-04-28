# Settlement Snapshot Backfill Migration

## Overview

This data migration script backfills settlement snapshots for existing superseded challans in the database. It analyzes existing `settledAmount` values on VOID challans and creates retroactive settlement snapshots with proper locking.

## What It Does

1. **Identifies VOID Challans**: Finds all VOID challans with `settledAmount > 0`
2. **Finds Superseding Challans**: Locates the superseding challans that settled them
3. **Creates Settlement Snapshots**: Generates retroactive settlement snapshots based on payment history
4. **Locks Superseded Challans**: Sets `isLocked = true` for all superseded challans that have been settled

## Requirements Addressed

- **2.1**: Track and display settled portions with clear attribution
- **2.2**: Automatically lock superseded challans to read-only mode
- **2.4**: Use settlement snapshot approach for clear tracking
- **2.5**: Store JSON snapshots with settlement details

## How to Run

### Prerequisites

- Ensure the database schema migration `20260427174432_add_settlement_tracking` has been applied
- Ensure you have a backup of your database before running data migrations

### Execution

From the `backend` directory:

**Using npm script (recommended):**
```bash
npm run migrate:backfill-settlements
```

**Or directly with node:**
```bash
node prisma/migrations/backfill_settlement_snapshots.js
```

### Expected Output

The script will:
- Display progress as it processes each superseding challan
- Show how many challans were processed, skipped, and locked
- Provide a summary at the end

Example output:
```
🚀 Starting Settlement Snapshot Backfill Migration...

📊 Step 1: Identifying VOID challans with settled amounts...
   Found 15 VOID challans with settled amounts

📊 Step 2: Grouping by superseding challans...
   Grouped into 8 superseding challans

📊 Step 3: Creating settlement snapshots...

   Processing Challan CH-2024-001 (ID: 123)
   - Status: PAID
   - Supersedes 2 challan(s)
   ✅ Created settlement snapshot (total settled: 5000)
   🔒 Locked 2 superseded challan(s)

═══════════════════════════════════════════════════════
📊 Migration Summary:
   ✅ Processed: 8 superseding challans
   ⏭️  Skipped: 0 challans
   🔒 Locked: 15 superseded challans
═══════════════════════════════════════════════════════

✨ Settlement Snapshot Backfill Migration Completed Successfully!
```

## Safety Features

- **Idempotent**: Can be run multiple times safely - skips challans that already have settlement snapshots
- **Read-Only Check**: Only processes PAID challans to ensure data consistency
- **Validation**: Warns about VOID challans with settled amounts but no superseding challan
- **Detailed Logging**: Provides clear output for auditing and troubleshooting

## Settlement Snapshot Structure

The created settlement snapshots follow this JSON structure:

```json
{
  "settledChallans": [
    {
      "challanId": 101,
      "challanNumber": "CH-2024-001",
      "amountSettled": 5000,
      "settlementDate": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalSettled": 5000,
  "paymentDate": "2024-01-15T10:30:00.000Z",
  "migratedAt": "2024-01-20T14:00:00.000Z",
  "migrationNote": "Retroactively created from existing settledAmount data"
}
```

## Troubleshooting

### Warning: Challan has settledAmount but no superseding challan

This indicates data inconsistency where a VOID challan has a settled amount but no `supersededById` reference. These should be investigated manually.

### Skipped: Already has settlement snapshot

This is normal behavior - the script is idempotent and won't overwrite existing snapshots.

### Skipped: Not PAID

The script only creates snapshots for PAID superseding challans to ensure the settlement data is accurate and final.

## Post-Migration Verification

After running the migration, you can verify the results using the verification script:

**Using npm script (recommended):**
```bash
npm run migrate:verify-settlements
```

**Or directly with node:**
```bash
node prisma/migrations/verify_backfill.js
```

This will check:
- Count of VOID challans with settled amounts
- Count of locked VOID challans
- Count of challans with settlement snapshots
- Consistency checks (all settled challans should be locked)
- Verification that all PAID superseding challans have snapshots

You can also verify manually with SQL queries:

```sql
-- Check how many challans now have settlement snapshots
SELECT COUNT(*) FROM feechallan WHERE settlementSnapshot IS NOT NULL;

-- Check how many superseded challans are now locked
SELECT COUNT(*) FROM feechallan WHERE isLocked = true AND status = 'VOID';

-- View a sample settlement snapshot
SELECT challanNumber, settlementSnapshot FROM feechallan 
WHERE settlementSnapshot IS NOT NULL LIMIT 1;
```

## Rollback

If you need to rollback this migration:

```sql
-- Remove settlement snapshots
UPDATE feechallan SET settlementSnapshot = NULL WHERE settlementSnapshot IS NOT NULL;

-- Unlock challans
UPDATE feechallan SET isLocked = false WHERE isLocked = true;
```

**Note**: Only rollback if absolutely necessary, as this removes the audit trail of settlements.
