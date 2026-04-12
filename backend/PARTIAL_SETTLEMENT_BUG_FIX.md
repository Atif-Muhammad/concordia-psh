# Partial Settlement Bug Fix

## Problem Description

When a payment was made on a superseding challan that should settle multiple VOID (superseded) challans, the payment distribution was incorrect, leading to:

1. **Incorrect settlement amounts** on VOID challans
2. **Incorrect installment paidAmount** values
3. **Incorrect installment status** (should be PAID but showing PARTIAL)

### Example Scenario (from user data)

**Setup:**
- Challan #99 (September, VOID): Rs. 16,666 tuition + Rs. 1,384 fine + Rs. 31,950 late fee = Rs. 50,000 total
- Challan #100 (October, VOID): Rs. 16,666 tuition + Rs. 27,150 late fee = Rs. 43,816 total  
- Challan #101 (November, PARTIAL): Paid Rs. 93,816

**Expected behavior:**
1. Challan #99 fully settled: Rs. 50,000
   - Installment #1 marked PAID with paidAmount = Rs. 48,616 (tuition + late fee)
2. Challan #100 fully settled: Rs. 43,816 (from remaining Rs. 93,816 - Rs. 50,000)
   - Installment #2 marked PAID with paidAmount = Rs. 43,816
3. Challan #101 has Rs. 0 remaining for itself (all went to arrears)

**Actual behavior (BEFORE FIX):**
1. Challan #99 fully settled: Rs. 50,000 ✅
   - Installment #1 marked PAID with paidAmount = Rs. 48,616 ✅
2. Challan #100 partially settled: Rs. 4,350 ❌ (should be Rs. 43,816)
   - Installment #2 marked PARTIAL with paidAmount = Rs. 4,350 ❌
3. Challan #101 has Rs. 39,466 remaining ❌ (should have Rs. 0 remaining)

## Root Causes

### Bug #1: Incorrect Payment Distribution Logic

**Location**: `backend/src/fee-management/fee-management.service.ts` (lines ~2287-2290)

**Problem**: The code was subtracting the current challan's own `totalAmount` from the payment BEFORE distributing to VOID predecessors:

```typescript
// INCORRECT CODE (BEFORE FIX):
let remaining = updatedChallan.paidAmount || 0;

// Subtract this challan's own totalAmount first
const ownTotal = (updatedChallan as any).totalAmount || 0;
if (ownTotal > 0) {
  remaining = Math.max(0, remaining - ownTotal);
}

for (const pred of voidPredecessors) {
  // Only Rs. 54,350 available for VOID predecessors (Rs. 93,816 - Rs. 39,466)
  if (remaining <= 0) break;
  // ...
}
```

**Why this is wrong:**
- Payment of Rs. 93,816 - Rs. 39,466 (own total) = Rs. 54,350 available for VOID predecessors
- But Challan #99 needs Rs. 50,000 and Challan #100 needs Rs. 43,816 = Rs. 93,816 total
- Only Rs. 54,350 is distributed, leaving Challan #100 with only Rs. 4,350

**Correct logic**: The FULL payment should be used to settle VOID predecessors first (FIFO), then any remainder applies to the current challan. The current challan's own amount is already accounted for in its `remainingAmount` calculation.

**Fix**:
```typescript
// CORRECT CODE (AFTER FIX):
let remaining = updatedChallan.paidAmount || 0;

// CRITICAL FIX: Do NOT subtract the challan's own totalAmount first!
// The payment should settle VOID predecessors FIRST (FIFO), then apply remainder to current challan.
// The current challan's own amount is already included in its remainingAmount calculation.

for (const pred of voidPredecessors) {
  if (remaining <= 0) break;
  // Full Rs. 93,816 available for VOID predecessors
  // ...
}
```

### Bug #2: Incorrect Installment paidAmount Calculation

**Location**: `backend/src/fee-management/fee-management.service.ts` (lines ~2340-2350)

**Problem**: When partially settling a VOID challan, the code was applying the full `settledAmount` (including fines and late fees) to the installment's `paidAmount`:

```typescript
// INCORRECT CODE (BEFORE FIX):
const newInstPaid = Math.min(newSettled, instTotalAmount);
```

**Why this is wrong:**
- `newSettled` includes tuition + fines + late fees
- Installment `paidAmount` should only track the tuition portion
- This causes installments to show inflated `paidAmount` values

**Fix**: Calculate the tuition portion proportionally:

```typescript
// CORRECT CODE (AFTER FIX):
const tuitionPortion = pred.amount || 0;
const finesPortion = (pred.fineAmount || 0) + (pred.lateFeeFine || 0) - (pred.discount || 0);
const totalDueForPred = tuitionPortion + finesPortion;

// Calculate how much of the settlement goes to tuition vs fines
// Allocate proportionally: if 60% of total is tuition, 60% of payment goes to tuition
const tuitionRatio = totalDueForPred > 0 ? tuitionPortion / totalDueForPred : 1;
const tuitionSettled = Math.min(newSettled * tuitionRatio, tuitionPortion);

const newInstPaid = predInst.paidAmount + tuitionSettled;
```

## Implementation

### Fix #1: Remove Incorrect Subtraction

**File**: `backend/src/fee-management/fee-management.service.ts`  
**Lines**: ~2283-2290

**Change**:
```diff
  // Build chain: all VOID challans this one superseded (directly or transitively), oldest first
  const voidPredecessors = await collectVoidChain(id);

  // Total amount paid on the superseding challan
  let remaining = updatedChallan.paidAmount || 0;

- // Subtract this challan's own totalAmount first — only genuine overpayment goes to next installment
- const ownTotal = (updatedChallan as any).totalAmount || 0;
- if (ownTotal > 0) {
-   remaining = Math.max(0, remaining - ownTotal);
- }
+ // CRITICAL FIX: Do NOT subtract the challan's own totalAmount first!
+ // The payment should settle VOID predecessors FIRST (FIFO), then apply remainder to current challan.
+ // The current challan's own amount is already included in its remainingAmount calculation.

  for (const pred of voidPredecessors) {
    if (remaining <= 0) break;
```

### Fix #2: Proportional Tuition Allocation

**File**: `backend/src/fee-management/fee-management.service.ts`  
**Lines**: ~2340-2360

**Change**:
```diff
  } else {
-   // Partially settled: reflect the settled amount on the installment
-   const newInstPaid = Math.min(newSettled, instTotalAmount);
-   const newInstRemaining = Math.max(0, instTotalAmount - newInstPaid);
+   // Partially settled: reflect the settled amount on the installment
+   // CRITICAL: Only apply the tuition portion to the installment, not fines/late fees
+   const tuitionPortion = pred.amount || 0;
+   const finesPortion = (pred.fineAmount || 0) + (pred.lateFeeFine || 0) - (pred.discount || 0);
+   const totalDueForPred = tuitionPortion + finesPortion;
+   
+   // Calculate how much of the settlement goes to tuition vs fines
+   // Allocate proportionally: if 60% of total is tuition, 60% of payment goes to tuition
+   const tuitionRatio = totalDueForPred > 0 ? tuitionPortion / totalDueForPred : 1;
+   const tuitionSettled = Math.min(newSettled * tuitionRatio, tuitionPortion);
+   
+   const newInstPaid = predInst.paidAmount + tuitionSettled;
+   const newInstRemaining = Math.max(0, instTotalAmount - newInstPaid);
    await (prisma.studentFeeInstallment.update as any)({
      where: { id: instId },
      data: {
        paidAmount: newInstPaid,
-       pendingAmount: Math.max(0, predInst.pendingAmount - newInstPaid),
+       pendingAmount: Math.max(0, predInst.pendingAmount - tuitionSettled),
        remainingAmount: newInstRemaining,
-       status: newInstPaid > 0 ? 'PARTIAL' : predInst.status,
+       status: newInstPaid >= instTotalAmount ? 'PAID' : (newInstPaid > 0 ? 'PARTIAL' : predInst.status),
      }
    });
  }
```

## Expected Behavior After Fix

Using the same scenario:

**Payment**: Rs. 93,816 on Challan #101

**Distribution**:
1. Challan #99 (September): Rs. 50,000 allocated
   - `settledAmount` = Rs. 50,000 ✅
   - Installment #1: `paidAmount` = Rs. 48,616 (tuition + late fee), status = PAID ✅
   
2. Challan #100 (October): Rs. 43,816 allocated (remaining from Rs. 93,816 - Rs. 50,000)
   - `settledAmount` = Rs. 43,816 ✅
   - Installment #2: `paidAmount` = Rs. 43,816, status = PAID ✅
   
3. Challan #101 (November): Rs. 0 remaining
   - `remainingAmount` = Rs. 39,466 (its own tuition + late fee, not yet paid) ✅
   - Status = PARTIAL ✅

## Testing

To test this fix:

1. Create a scenario with multiple VOID challans
2. Make a payment on the superseding challan that should settle all VOID predecessors
3. Verify:
   - Each VOID challan's `settledAmount` is correct
   - Each installment's `paidAmount` reflects only tuition (not fines/late fees)
   - Each installment's `status` is correct (PAID when fully settled)
   - The superseding challan's `remainingAmount` is correct

## Impact

This fix ensures:
1. **Accurate financial records**: Payments are correctly distributed to settle arrears
2. **Correct installment tracking**: Installments show accurate paid amounts and status
3. **Proper FIFO settlement**: Oldest debts are settled first, as expected
4. **Separation of concerns**: Installments track tuition, challans track total (tuition + fines + late fees)

## Files Modified

1. `backend/src/fee-management/fee-management.service.ts`
   - Removed incorrect subtraction of own totalAmount (lines ~2287-2290)
   - Added proportional tuition allocation for partial settlements (lines ~2340-2360)

## Related Issues

- VOID Challan Propagation Implementation (see `VOID_CHALLAN_PROPAGATION_IMPLEMENTATION.md`)
- Late Fee Accrual System
- Arrears Management

## Conclusion

The partial settlement bug has been fixed by:
1. Removing the incorrect subtraction of the current challan's own totalAmount before distributing to VOID predecessors
2. Calculating installment paidAmount proportionally based on tuition portion only

This ensures accurate financial tracking and correct settlement of arrears in FIFO order.
