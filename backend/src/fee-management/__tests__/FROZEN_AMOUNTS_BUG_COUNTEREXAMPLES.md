# Frozen Amounts Bug Condition - Counterexamples

This document records the counterexamples discovered by running the bug condition exploration tests on UNFIXED code.

**Test Execution Date**: 2026-04-27 (Latest: 2026-04-27T19:45:47Z)
**Test File**: `frozenAmountsBugCondition.spec.ts`
**Status**: All 4 tests FAILED as expected (confirms bugs exist)

---

## Test Case 1: Mutable Amount Test

**Scenario**: Generate a challan, modify its selected fee heads, verify that totalAmount recalculates

**Expected Outcome**: Test FAILS (totalAmount is mutable and recalculates, confirms bug exists)

**Actual Result**: ✅ Test FAILED as expected

**Counterexample**:
```
Initial challan: {
  id: 248,
  challanNumber: 'TEST-MUTABLE-1777319147775',
  amount: 5000,
  totalAmount: 5000,
  selectedHeads: '[1,2,3]'
}

Updated challan: {
  id: 248,
  amount: 7000,
  totalAmount: 7000,
  selectedHeads: '[1,2,3,4,5]'
}
```

**Bug Confirmed**: 
- Challan amounts ARE mutable (amount changed from 5000 to 7000)
- No frozen amount fields exist (`baseAmount`, `computedTotalDue`, `frozenArrearsAmount`, `frozenArrearsFine`, `frozenBaseFine`)
- `isLocked` field is `false` (should be `true` after generation)

**Error Message**:
```
expect(received).toHaveProperty(path)
Expected path: "baseAmount"
Received path: []
```

---

## Test Case 2: Missing Settlement Table Test

**Scenario**: Record a payment that settles arrears, verify that no ChallanSettlement records are created

**Expected Outcome**: Test FAILS (no ChallanSettlement table exists, confirms bug)

**Actual Result**: ✅ Test FAILED as expected

**Counterexample**:
```
Challans before payment: {
  arrearsChallan: { id: 249, amount: 3000, status: 'PENDING' },
  currentChallan: { id: 250, totalAmount: 8000, status: 'PENDING' }
}

Challans after payment: {
  arrearsChallan: { id: 249, status: 'PAID', paidAmount: 3000 },
  currentChallan: { id: 250, status: 'PAID', paidAmount: 8000 }
}

ChallanSettlement table does not exist (expected on unfixed code)
Settlement records: null
```

**Bug Confirmed**:
- ChallanSettlement table does NOT exist
- Settlement tracking uses JSON blobs instead of relational tables
- Cannot query "show me all payments that settled Challan #243" without parsing JSON

**Error Message**:
```
expect(received).not.toBeNull()
Received: null
```

---

## Test Case 3: Missing Fingerprint Test

**Scenario**: Generate a challan with arrears, modify the source challan, verify that no integrity check detects the mismatch

**Expected Outcome**: Test FAILS (no arrearsFingerprint field exists, confirms bug)

**Actual Result**: ✅ Test FAILED as expected

**Counterexample**:
```
Challans before modification: {
  sourceChallan: { id: 251, amount: 3000, remainingAmount: 3000 },
  challanWithArrears: { id: 252, totalAmount: 8000 }
}

Challan with arrears check: {
  id: 252,
  totalAmount: 8000,
  arrearsFingerprint: undefined,
  arrearsBreakdown: undefined
}
```

**Bug Confirmed**:
- No `arrearsFingerprint` field exists
- No `arrearsBreakdown` field exists
- No integrity validation when upstream challans are modified
- Downstream challans can reference incorrect arrears amounts with no detection

**Error Message**:
```
expect(received).toHaveProperty(path)
Expected path: "arrearsFingerprint"
Received path: []
```

---

## Test Case 4: Out-of-Sequence Test

**Scenario**: Attempt to generate challan for month 3 before month 2, verify that it's allowed

**Expected Outcome**: Test FAILS (out-of-sequence generation is allowed, confirms bug)

**Actual Result**: ✅ Test FAILED as expected

**Counterexample**:
```
Installments created: {
  installment1: { id: 62, installmentNumber: 1, month: 'August' },
  installment2: { id: 63, installmentNumber: 2, month: 'September' },
  installment3: { id: 64, installmentNumber: 3, month: 'October' }
}

Challan 3 created (out-of-sequence): {
  id: 253,
  challanNumber: 'TEST-CHALLAN-3-1777319148284',
  installmentNumber: 3,
  month: 'October'
}
```

**Bug Confirmed**:
- Out-of-sequence challan generation IS allowed
- System allows generating challan for installment 3 (October) without generating challan for installment 2 (September)
- No sequential validation exists
- This breaks the arrears chain and causes incorrect carry-forward amounts

**Error Message**:
```
expect(received).toBe(expected) // Object.is equality
Expected: false
Received: true
```

---

## Summary

All 4 bug condition tests FAILED as expected, confirming the following bugs exist in the unfixed code:

1. ✅ **Mutable Amounts**: Challan amounts are mutable and recalculate when fee heads change
2. ✅ **Missing Settlement Table**: No ChallanSettlement relational table exists for tracking settlements
3. ✅ **Missing Fingerprint**: No arrearsFingerprint field for integrity validation of arrears
4. ✅ **Out-of-Sequence Generation**: No sequential validation prevents out-of-order challan generation

These counterexamples validate the root cause analysis in the design document and confirm that the hypothesized issues are correct.

---

## Next Steps

1. Implement database schema changes (frozen amount fields, ChallanSettlement table, arrearsFingerprint)
2. Implement sequential validation in generateFeeChallan
3. Implement frozen amount logic in generateFeeChallan
4. Implement ChallanSettlement record creation in recordPayment
5. Re-run these tests to verify the fix works correctly
