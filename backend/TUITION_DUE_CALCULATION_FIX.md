# Tuition Due Calculation Fix

## Problem Description

When a challan received multiple payments (first payment settling arrears, second payment for the current installment), the second payment was not being applied to the current installment. The installment remained with amount in `pendingAmount` instead of moving to `paidAmount`.

### Example Scenario (from user data)

**Setup:**
- Challan #111 (November) supersedes Challans #109 (Sept) and #110 (Oct)
- Installment #3 (November): `pendingAmount` = Rs. 39,466

**Payment sequence:**
1. First payment on Challan #111: Rs. 92,432
   - Settles Challan #109: Rs. 48,616 ✅
   - Settles Challan #110: Rs. 43,816 ✅
   - Installment #3 remains: `paidAmount` = 0, `pendingAmount` = Rs. 39,466 ✅

2. Second payment on Challan #111: Rs. 39,466
   - Should move Installment #3's `pendingAmount` to `paidAmount`
   - But it didn't! ❌

**Expected behavior after second payment:**
- Challan #111: `paidAmount` = Rs. 131,898, status = PAID ✅
- Installment #3: `paidAmount` = Rs. 39,466, `pendingAmount` = 0, status = PAID ✅

**Actual behavior (BEFORE FIX):**
- Challan #111: `paidAmount` = Rs. 131,898, status = PAID ✅
- Installment #3: `paidAmount` = 0, `pendingAmount` = Rs. 39,466, status = PENDING ❌

## Root Cause

**Location**: `backend/src/fee-management/fee-management.service.ts` (lines ~1950-1960)

**Problem**: The `tuitionDue` calculation was based on the challan's `paidAmount`:

```typescript
// INCORRECT CODE (BEFORE FIX):
const netTuitionTotal = Math.max(0, currentTotal - discount);
const tuitionDue = Math.max(0, netTuitionTotal - challan.paidAmount);
const additionalDue = Math.max(0, currentFine);

const tuitionPaymentSnapshot = Math.min(remainingPayment, tuitionDue);
```

**Why this is wrong:**
- `challan.paidAmount` includes ALL payments made on the challan, including payments that went to arrears
- On the second payment:
  - `currentTotal` = Rs. 16,666 (challan's tuition amount)
  - `challan.paidAmount` = Rs. 92,432 (from first payment, which went to arrears)
  - `tuitionDue` = Rs. 16,666 - Rs. 92,432 = **negative** → Rs. 0
  - `tuitionPaymentSnapshot` = Rs. 0
  - So the installment doesn't get updated!

**The fundamental issue**: The challan's `paidAmount` is not a reliable indicator of how much has been paid to the **current installment**. It includes payments to arrears, so it can be much larger than the current installment's amount.

**Correct logic**: Calculate `tuitionDue` based on the **installment's `pendingAmount`** (amount that's billed but unpaid), not the challan's `paidAmount`.

## Implementation

**File**: `backend/src/fee-management/fee-management.service.ts`  
**Lines**: ~1950-1965

**Change**:
```diff
  // Payment priority: VOID chain first, then current challan's own tuition/heads/late fee
  let remainingPayment = paymentIncrease;

  // Reserve payment for VOID chain — tuitionPaymentSnapshot is only what's left after VOID chain
  const voidChainPayment = Math.min(remainingPayment, voidChainTotal);
  remainingPayment -= voidChainPayment;

+ // CRITICAL FIX: Calculate tuitionDue based on installment's pending amount, not challan's paidAmount
+ // The challan's paidAmount includes payments to arrears, so it's not accurate for current installment
+ let tuitionDue = currentTotal;
+ if (challan.studentFeeInstallmentId) {
+   const currentInst = await (prisma.studentFeeInstallment.findUnique as any)({
+     where: { id: challan.studentFeeInstallmentId },
+     select: { id: true, amount: true, totalAmount: true, paidAmount: true, pendingAmount: true }
+   });
+   if (currentInst) {
+     // Tuition due = installment's pending amount (billed but unpaid)
+     tuitionDue = Math.max(0, currentInst.pendingAmount || 0);
+   }
+ }
+ 
  const netTuitionTotal = Math.max(0, currentTotal - discount);
- const tuitionDue = Math.max(0, netTuitionTotal - challan.paidAmount);
  const additionalDue = Math.max(0, currentFine);

  const tuitionPaymentSnapshot = Math.min(remainingPayment, tuitionDue);
  remainingPayment -= tuitionPaymentSnapshot;
  const additionalPayment = Math.min(remainingPayment, additionalDue);
  remainingPayment -= additionalPayment;
```

## Expected Behavior After Fix

Using the same scenario:

**First payment**: Rs. 92,432 on Challan #111
- Settles Challan #109: Rs. 48,616 ✅
- Settles Challan #110: Rs. 43,816 ✅
- Installment #3: `paidAmount` = 0, `pendingAmount` = Rs. 39,466 ✅
- `tuitionPaymentSnapshot` = Rs. 0 (all payment went to arrears) ✅

**Second payment**: Rs. 39,466 on Challan #111
- `paymentIncrease` = Rs. 39,466
- `voidChainTotal` = Rs. 0 (all arrears settled)
- `remainingPayment` = Rs. 39,466
- Fetch Installment #3: `pendingAmount` = Rs. 39,466
- `tuitionDue` = Rs. 39,466 (from installment's pendingAmount) ✅
- `tuitionPaymentSnapshot` = Rs. 39,466 ✅
- Section 7 updates Installment #3:
  - `paidAmount` = Rs. 39,466 ✅
  - `pendingAmount` = 0 ✅
  - `status` = PAID ✅

## Key Insights

1. **Challan paidAmount ≠ Installment paidAmount**: The challan's `paidAmount` includes payments to arrears, so it's not a reliable indicator of the current installment's paid amount.

2. **Use installment's pendingAmount**: The installment's `pendingAmount` field accurately tracks how much is billed but unpaid for that specific installment.

3. **Separation of concerns**:
   - Challan tracks: Total payments received (including arrears)
   - Installment tracks: Payments for that specific installment only

4. **Payment flow**:
   - Payment → VOID chain (arrears) → Current installment → Next installment (advance)
   - Each step should check the actual amount due at that level, not rely on challan's total paidAmount

## Testing

To test this fix:

1. **Test multiple payments on superseding challan**:
   - Create VOID challans for Sept & Oct
   - Pay superseding challan (Nov) to settle Sept & Oct only
   - Verify: Installment #3 (Nov) still has amount in `pendingAmount`
   - Pay superseding challan again to settle Nov
   - Verify: Installment #3 moves amount from `pendingAmount` to `paidAmount`, status = PAID

2. **Test single payment covering all**:
   - Create VOID challans for Sept & Oct
   - Pay superseding challan (Nov) with full amount to settle Sept, Oct, AND Nov
   - Verify: All installments marked PAID

3. **Test partial payments**:
   - Make multiple small payments on a superseding challan
   - Verify: Each payment is applied correctly (arrears first, then current)

## Impact

This fix ensures:
1. **Correct installment updates**: Installments are updated correctly even when challans receive multiple payments
2. **Accurate pending tracking**: The `pendingAmount` field correctly moves to `paidAmount` when paid
3. **Proper payment allocation**: Payments are allocated based on actual amounts due, not challan's total paidAmount
4. **Consistent financial tracking**: Installments accurately reflect their payment status

## Files Modified

1. `backend/src/fee-management/fee-management.service.ts`
   - Changed tuitionDue calculation to use installment's pendingAmount (lines ~1950-1965)

## Related Issues

- Advance Payment Bug Fix (see `ADVANCE_PAYMENT_BUG_FIX.md`)
- Installment Status Bug Fix (see `INSTALLMENT_STATUS_BUG_FIX.md`)
- Partial Settlement Bug Fix (see `PARTIAL_SETTLEMENT_BUG_FIX.md`)
- VOID Challan Propagation Implementation (see `VOID_CHALLAN_PROPAGATION_IMPLEMENTATION.md`)

## Conclusion

The tuition due calculation bug has been fixed by using the installment's `pendingAmount` instead of calculating based on the challan's `paidAmount`. This ensures that subsequent payments on a challan are correctly applied to the current installment, even after previous payments have settled arrears.
