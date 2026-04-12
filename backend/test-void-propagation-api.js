/**
 * Integration test for VOID challan amount propagation via API
 * 
 * This test calls the actual updateFeeChallan API endpoint to verify
 * that the propagation logic works correctly through the service layer.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVoidChallanPropagationViaAPI() {
  try {
    console.log('🧪 Testing VOID challan amount propagation via API...\n');

    // Step 1: Find a VOID challan with a superseding challan
    const voidChallan = await prisma.feeChallan.findFirst({
      where: {
        status: 'VOID',
        supersededById: { not: null }
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

    // Step 4: Call the API endpoint
    console.log(`📝 Calling API to update VOID challan #${voidChallan.id}...\n`);

    const response = await fetch(`http://localhost:3000/fee-management/challan/update?id=${voidChallan.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedHeads: selectedHeads
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ API call failed: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${error}`);
      return;
    }

    const result = await response.json();
    console.log(`✅ API call successful\n`);

    // Step 5: Verify the propagation
    const voidChallanAfter = await prisma.feeChallan.findUnique({
      where: { id: voidChallan.id }
    });

    const supersedingAfter = await prisma.feeChallan.findUnique({
      where: { id: voidChallan.supersededById }
    });

    console.log(`📊 VOID challan #${voidChallanAfter.id} AFTER update:`);
    console.log(`   Amount: Rs. ${voidChallanAfter.amount} (expected: Rs. ${voidChallan.amount + expectedDelta})`);
    console.log(`   Total Amount: Rs. ${voidChallanAfter.totalAmount}\n`);

    console.log(`📊 Superseding challan #${supersedingAfter.id} AFTER update:`);
    console.log(`   Total Amount: Rs. ${supersedingAfter.totalAmount} (expected: Rs. ${supersedingBefore.totalAmount + expectedDelta})`);
    console.log(`   Remaining Amount: Rs. ${supersedingAfter.remainingAmount} (expected: Rs. ${supersedingBefore.remainingAmount + expectedDelta})`);
    console.log(`   Status: ${supersedingAfter.status}\n`);

    // Verify
    const voidAmountCorrect = voidChallanAfter.amount === voidChallan.amount + expectedDelta;
    const totalAmountCorrect = supersedingAfter.totalAmount === supersedingBefore.totalAmount + expectedDelta;
    const remainingAmountCorrect = supersedingAfter.remainingAmount === supersedingBefore.remainingAmount + expectedDelta;

    if (voidAmountCorrect && totalAmountCorrect && remainingAmountCorrect) {
      console.log('✅ ✅ ✅ PROPAGATION TEST PASSED! ✅ ✅ ✅');
      console.log('\nThe VOID challan amount change successfully propagated to the superseding challan.');
    } else {
      console.log('❌ ❌ ❌ PROPAGATION TEST FAILED! ❌ ❌ ❌');
      if (!voidAmountCorrect) {
        console.log(`   VOID challan amount mismatch: expected ${voidChallan.amount + expectedDelta}, got ${voidChallanAfter.amount}`);
      }
      if (!totalAmountCorrect) {
        console.log(`   Superseding total amount mismatch: expected ${supersedingBefore.totalAmount + expectedDelta}, got ${supersedingAfter.totalAmount}`);
      }
      if (!remainingAmountCorrect) {
        console.log(`   Superseding remaining amount mismatch: expected ${supersedingBefore.remainingAmount + expectedDelta}, got ${supersedingAfter.remainingAmount}`);
      }
    }

    // Rollback the change for clean state
    console.log('\n🔄 Rolling back the change...');
    selectedHeads[0].amount = originalAmount;
    await fetch(`http://localhost:3000/fee-management/challan/update?id=${voidChallan.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedHeads: selectedHeads
      })
    });
    console.log('✅ Rollback complete\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if server is running before running test
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/fee-management/head/get/all');
    if (response.ok) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Backend server is not running on http://localhost:3000');
    console.log('   Please start the server with: npm run start:dev');
    process.exit(1);
  }

  await testVoidChallanPropagationViaAPI();
}

main();
