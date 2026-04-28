# Frozen Amounts and Settlement Tracking Migration Summary

## Migration Details

**Migration Name**: `20260427195850_add_frozen_amounts_and_settlement_table`

**Date**: April 27, 2026

## Changes Applied

### 1. FeeChallan Schema Updates

#### New Frozen Amount Fields (Immutable after generation)
- `baseAmount` (Decimal) - Face-value fee for current installment only
- `frozenArrearsAmount` (Decimal) - Arrears principal frozen at generation
- `frozenArrearsFine` (Decimal) - Late fee on arrears frozen at generation
- `frozenBaseFine` (Decimal) - Late fee on current base frozen at generation
- `totalDiscount` (Decimal) - Total discounts applied
- `computedTotalDue` (Decimal) - Frozen total payable (replaces mutable totalAmount)
- `amountReceived` (Decimal) - Cash/bank actually received (replaces paidAmount)
- `outstandingAmount` (Decimal) - Computed as computedTotalDue - amountReceived

#### New Arrears Tracking Fields
- `arrearsBreakdown` (JSON) - Array of {installmentId, installmentNumber, month, principalOwed, lateFeeOwed}
- `arrearsFingerprint` (String) - SHA-256 of arrearsBreakdown sorted by installmentId
- `coveredInstallmentIds` (JSON) - Array of installment IDs covered by this challan

#### New Indexes
- `arrearsFingerprint` - For integrity validation
- `computedTotalDue` - For amount queries
- `outstandingAmount` - For outstanding balance queries

#### Legacy Fields (Deprecated but retained for backward compatibility)
- `amount` - Use `baseAmount` instead
- `totalAmount` - Use `computedTotalDue` instead
- `paidAmount` - Use `amountReceived` instead
- `remainingAmount` - Use `outstandingAmount` instead
- `settlementSnapshot` - Replaced by ChallanSettlement table (cleared to NULL)
- `settledAmount` - Replaced by ChallanSettlement table

### 2. ChallanSettlement Table (NEW)

Relational audit trail replacing JSON blob settlement tracking.

**Fields**:
- `id` - Primary key
- `payingChallanId` - Foreign key to FeeChallan (the challan making the payment)
- `settledChallanId` - Foreign key to FeeChallan (the challan being settled, NULL for base payment)
- `settledInstallmentId` - Foreign key to StudentFeeInstallment
- `amountApplied` - Amount applied to this settlement
- `settlementDate` - When the payment occurred
- `createdAt` - When the record was created

**Indexes**:
- `payingChallanId`
- `settledChallanId`
- `settledInstallmentId`
- `settlementDate`

**Relations**:
- Cascade delete when challan or installment is deleted

### 3. StudentFeeInstallment Schema Updates

#### Field Renames
- `pendingAmount` → `outstandingPrincipal` (Amount still owed on this installment)

#### Fields Removed
- `remainingAmount` (Duplicate field with conflicting semantics)

#### New Fields
- `lateFeeSnapshot` (Decimal) - Snapshot of late fee at last challan generation
- `lateFeeSnapshotAt` (DateTime) - Timestamp of late fee snapshot
- `settlements` (Relation) - ChallanSettlement records for this installment

## Data Migration

### Backfill Results

**Script**: `backfill_frozen_amounts.js`

**Execution Results**:
- ✓ Backfilled frozen amounts for 60 challans
- ✓ Cleared settlementSnapshot for 44 challans
- ✓ All challans have been backfilled successfully

**Backfill Logic**:
```sql
UPDATE feechallan 
SET 
  baseAmount = COALESCE(amount, 0),
  computedTotalDue = COALESCE(totalAmount, 0),
  amountReceived = COALESCE(paidAmount, 0),
  outstandingAmount = GREATEST(0, COALESCE(totalAmount, 0) - COALESCE(paidAmount, 0))
WHERE baseAmount IS NULL
```

**Note**: `outstandingAmount` is computed as `GREATEST(0, computedTotalDue - amountReceived)`, NOT copied from legacy `remainingAmount` (which was inconsistently calculated).

### Verification Results

**Script**: `verify_frozen_amounts.js`

**Results**:
- Total challans: 60
- Challans with NULL baseAmount: 0 ✓
- Challans with NULL computedTotalDue: 0 ✓
- ChallanSettlement records: 0 (expected for legacy data)
- StudentFeeInstallment.outstandingPrincipal field exists ✓
- settlementSnapshot cleared to NULL ✓

## Important Notes

### Historical Data
- **ChallanSettlement records**: Historical data will NOT have ChallanSettlement records. Only new payments after this migration will create relational audit trail.
- **Legacy fields**: Legacy fields (amount, totalAmount, paidAmount, remainingAmount) are retained for backward compatibility but should not be used in new code.

### Next Steps for Implementation

1. **Service Layer Updates** (Tasks 4-8):
   - Implement sequential generation validation
   - Implement arrears fingerprinting
   - Implement frozen amount calculation
   - Implement ChallanSettlement record creation
   - Implement edit blocking for frozen fields

2. **UI Updates** (Tasks 9-12):
   - Add sequential validation banner
   - Add live preview panel
   - Add payment distribution preview
   - Add edit-blocking message

3. **Cron Job Updates** (Task 13):
   - Update late fee cron to only update StudentFeeInstallment.lateFeeAccrued
   - Never update FeeChallan.lateFeeFine on issued challans

4. **Testing** (Tasks 14-15):
   - Verify bug condition tests pass
   - Verify preservation tests pass
   - Run unit and integration tests

## Field Mapping Reference

| Legacy Field | New Field | Usage |
|--------------|-----------|-------|
| `amount` | `baseAmount` | Face-value fee for current installment |
| `totalAmount` | `computedTotalDue` | Frozen total payable at generation |
| `paidAmount` | `amountReceived` | Cash/bank actually received |
| `remainingAmount` | `outstandingAmount` | Computed as computedTotalDue - amountReceived |
| `pendingAmount` | `outstandingPrincipal` | Amount still owed on installment |
| `settlementSnapshot` | ChallanSettlement table | Relational audit trail |

## Database Schema Version

- **Before**: Schema without frozen amounts, using JSON blob settlement tracking
- **After**: Schema with frozen amounts, relational ChallanSettlement table, and arrears fingerprinting
- **Migration**: `20260427195850_add_frozen_amounts_and_settlement_table`
- **Status**: ✓ Applied and verified
