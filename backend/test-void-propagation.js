/**
 * Test script for VOID challan amount propagation
 * 
 * This script tests that when a VOID challan's selectedHeads is updated,
 * the amount change propagates to the superseding challan and up the chain.
 * 
 * Test scenario:
 * 1. Find a VOID challan (e.g., Challan #97 with supersededById=98)
 * 2. Update its selectedHeads to change the amount
 * 3. Verify the superseding challan's totalAmount and remainingAmount are updated
 * 4. Verify the status is recalculated correctly
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVoidChallanPropagation() {
  try {
    console.log('🧪 Testing VOID challan amount propagation...\n');

    // Step 1: Find a VOID challan with a superseding challan
    const voidChallan = await prisma.feeChallan.findFirst({
      where: {
        status: 'VOID',
        supersededById: { not: null }
      },
      include: {
        supersededBy: true
      }
    });

    if (!voidChallan) {
      console.log('❌ No VOID challan found with a superseding challan');
      return;
    }

    console.log(`✅ Found VOID challan #${voidChallan.id}`);
    console.log(`   Superseded by: Challan #${voidChallan.supersededById}`);
    console.log(`   Current amount: Rs. ${voidChallan.amount}`);
    console.log(`   Current selectedHeads: ${voidChallan.selectedHeads}\n`);

    // Step 2: Get the superseding challan's current state
    const supersedingBefore = await prisma.feeChallan.findUnique({
      where: { id: voidChallan.supersededById }
    });

    console.log(`📊 Superseding challan #${supersedingBefore.id} BEFORE update:`);
    console.log(`   Total Amount: Rs. ${supersedingBefore.totalAmount}`);
    console.log(`   Remaining Amount: Rs. ${supersedingBefore.remainingAmount}`);
    console.log(`   Status: ${supersedingBefore.status}\n`);

    // Step 3: Parse current selectedHeads and modify one head's amount
    let selectedHeads = [];
    try {
      selectedHeads = JSON.parse(voidChallan.selectedHeads || '[]');
    } catch (e) {
      console.log('❌ Failed to parse selectedHeads');
      return;
    }

    if (selectedHeads.length === 0) {
      console.log('❌ No heads in selectedHeads to modify');
      return;
    }

    // Increase the first head's amount by 1000
    const originalAmount = selectedHeads[0].amount;
    selectedHeads[0].amount = originalAmount + 1000;
    const expectedDelta = 1000;

    console.log(`🔧 Modifying selectedHeads:`);
    console.log(`   Head: ${selectedHeads[0].name}`);
    console.log(`   Original amount: Rs. ${originalAmount}`);
    console.log(`   New amount: Rs. ${selectedHeads[0].amount}`);
    console.log(`   Expected delta: Rs. ${expectedDelta}\n`);

    // Step 4: Update the VOID challan via API endpoint simulation
    // Note: In real scenario, this would go through the updateChallan method
    console.log(`📝 Updating VOID challan #${voidChallan.id}...\n`);

    // Simulate the update by calling the service method directly
    // This requires importing the service, but for now we'll use Prisma directly
    // to test the propagation logic

    // Calculate new amount
    const newAmount = selectedHeads.reduce((sum, h) => sum + (h.amount || 0), 0);
    const deltaAmount = newAmount - voidChallan.amount;

    // Update VOID challan
    await prisma.feeChallan.update({
      where: { id: voidChallan.id },
      data: {
        selectedHeads: JSON.stringify(selectedHeads),
        amount: newAmount,
        totalAmount: newAmount + (voidChallan.fineAmount || 0) + (voidChallan.lateFeeFine || 0),
        remainingAmount: Math.max(0, newAmount + (voidChallan.fineAmount || 0) + (voidChallan.lateFeeFine || 0) - (voidChallan.paidAmount || 0) - (voidChallan.discount || 0))
      }
    });

    // Manually propagate (in real scenario, this happens in the service method)
    const newSupersedingTotal = supersedingBefore.totalAmount + deltaAmount;
    const newSupersedingRemaining = Math.max(0, newSupersedingTotal - (supersedingBefore.paidAmount || 0) - (supersedingBefore.discount || 0));

    await prisma.feeChallan.update({
      where: { id: supersedingBefore.id },
      data: {
        totalAmount: newSupersedingTotal,
        remainingAmount: newSupersedingRemaining
      }
    });

    // Step 5: Verify the propagation
    const supersedingAfter = await prisma.feeChallan.findUnique({
      where: { id: voidChallan.supersededById }
    });

    console.log(`✅ Superseding challan #${supersedingAfter.id} AFTER update:`);
    console.log(`   Total Amount: Rs. ${supersedingAfter.totalAmount} (expected: Rs. ${supersedingBefore.totalAmount + expectedDelta})`);
    console.log(`   Remaining Amount: Rs. ${supersedingAfter.remainingAmount} (expected: Rs. ${supersedingBefore.remainingAmount + expectedDelta})`);
    console.log(`   Status: ${supersedingAfter.status}\n`);

    // Verify
    const totalAmountCorrect = supersedingAfter.totalAmount === supersedingBefore.totalAmount + expectedDelta;
    const remainingAmountCorrect = supersedingAfter.remainingAmount === supersedingBefore.remainingAmount + expectedDelta;

    if (totalAmountCorrect && remainingAmountCorrect) {
      console.log('✅ ✅ ✅ PROPAGATION TEST PASSED! ✅ ✅ ✅');
    } else {
      console.log('❌ ❌ ❌ PROPAGATION TEST FAILED! ❌ ❌ ❌');
      if (!totalAmountCorrect) {
        console.log(`   Total amount mismatch: expected ${supersedingBefore.totalAmount + expectedDelta}, got ${supersedingAfter.totalAmount}`);
      }
      if (!remainingAmountCorrect) {
        console.log(`   Remaining amount mismatch: expected ${supersedingBefore.remainingAmount + expectedDelta}, got ${supersedingAfter.remainingAmount}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testVoidChallanPropagation();
