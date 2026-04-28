// Arrears Fingerprint Computation Logic for Task 5.1
// This code should be inserted into createFeeChallan method before the return statement

// Step 1: Build arrearsBreakdown array
// Fetch all unpaid/partially paid installments for this student
const unpaidInstallments = await this.prisma.studentFeeInstallment.findMany({
  where: {
    studentId: payload.studentId,
    outstandingPrincipal: { gt: 0 },
    installmentNumber: { lt: installmentNumber }, // Only prior installments
  },
  orderBy: {
    installmentNumber: 'asc',
  },
});

const arrearsBreakdown: Array<{
  installmentId: number;
  installmentNumber: number;
  month: string;
  principalOwed: number;
  lateFeeOwed: number;
  challanId: number | null;
  challanNumber: string | null;
}> = [];

let frozenArrearsAmount = 0;
let frozenArrearsFine = 0;
const coveredInstallmentIds: number[] = [];

for (const installment of unpaidInstallments) {
  // Find the most recent non-VOID challan for this installment
  const sourceChallan = await this.prisma.feeChallan.findFirst({
    where: {
      studentFeeInstallmentId: installment.id,
      status: { not: 'VOID' },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const principalOwed = Number(installment.outstandingPrincipal);
  const lateFeeOwed = Number(installment.lateFeeAccrued || 0);

  arrearsBreakdown.push({
    installmentId: installment.id,
    installmentNumber: installment.installmentNumber,
    month: installment.month || `Installment ${installment.installmentNumber}`,
    principalOwed,
    lateFeeOwed,
    challanId: sourceChallan?.id || null,
    challanNumber: sourceChallan?.challanNumber || null,
  });

  frozenArrearsAmount += principalOwed;
  frozenArrearsFine += lateFeeOwed;
  coveredInstallmentIds.push(installment.id);
}

// Step 2: Compute frozen amounts from breakdown (frozenArrearsAmount, frozenArrearsFine computed above)

// Step 3: Sort array by installmentId ascending
arrearsBreakdown.sort((a, b) => a.installmentId - b.installmentId);

// Step 4: Compute SHA-256 hash
const crypto = require('crypto');
const arrearsFingerprint = arrearsBreakdown.length > 0
  ? crypto.createHash('sha256').update(JSON.stringify(arrearsBreakdown)).digest('hex')
  : null;

// Step 5: MANDATORY INTEGRITY VALIDATION - For each arrears entry
for (const arrears of arrearsBreakdown) {
  if (arrears.challanId) {
    // Fetch the source challan by challanId
    const sourceChallan = await this.prisma.feeChallan.findUnique({
      where: { id: arrears.challanId },
    });

    if (sourceChallan) {
      // Recompute source challan's outstanding
      const sourceOutstanding = Number(sourceChallan.computedTotalDue || sourceChallan.totalAmount || 0) 
        - Number(sourceChallan.amountReceived || sourceChallan.paidAmount || 0);

      // Compare with principalOwed in breakdown
      if (Math.abs(sourceOutstanding - arrears.principalOwed) > 0.01) {
        throw new BadRequestException(
          `Integrity mismatch: Challan #${arrears.challanNumber} for ${arrears.month} shows outstanding amount ${sourceOutstanding.toFixed(2)} but arrears calculation used ${arrears.principalOwed.toFixed(2)}. The challan may have been modified externally. Please refresh and retry.`
        );
      }
    }
  }
}

// Compute base amount from selected heads
const baseAmount = amount || 0;

// Compute frozen base fine (late fee on current installment)
const frozenBaseFine = payload.fineAmount || 0;

// Compute total discount
const totalDiscount = payload.discount || 0;

// Step 6 & 7: Compute computedTotalDue and store all frozen amounts
const computedTotalDue = baseAmount + frozenArrearsAmount + frozenArrearsFine + frozenBaseFine - totalDiscount;
const amountReceived = payload.paidAmount || 0;
const outstandingAmount = computedTotalDue - amountReceived;

// Step 8: Add these fields to the prisma.feeChallan.create() data object:
// discount: totalDiscount,
// paidAmount: amountReceived,
// remainingAmount: outstandingAmount,
// status: amountReceived >= computedTotalDue ? 'PAID' : (amountReceived > 0 ? 'PARTIAL' : 'PENDING'),
// // Frozen amount fields
// baseAmount,
// frozenArrearsAmount,
// frozenArrearsFine,
// frozenBaseFine,
// totalDiscount,
// computedTotalDue,
// amountReceived,
// outstandingAmount,
// // Arrears tracking fields
// arrearsBreakdown: arrearsBreakdown.length > 0 ? JSON.stringify(arrearsBreakdown) : null,
// arrearsFingerprint,
// coveredInstallmentIds: coveredInstallmentIds.length > 0 ? JSON.stringify(coveredInstallmentIds) : null,
// isLocked: true, // Lock the challan after generation
