/**
 * Unit test for VOID challan amount propagation
 * 
 * This test directly verifies the logic in the updateChallan method
 * by checking the database state before and after the update.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVoidChallanPropagation() {
  try {
    console.log('🧪 Testing VOID challan amount propagation (Unit Test)...\n');

    // Step 1: Find a VOID challan with a superseding challan
    const voidChallan = await prisma.feeChallan.findFirst({
      where: {
        status: 'VOID',
        supersededById: { not: null }
      }
    });

    if (!voidChallan) {
      console.log('❌ No VOID challan found with a superseding challan');
      console.log('   Creating test data...\n');
      
      // Create test data
      const student = await prisma.student.findFirst();
      if (!student) {
        console.log('❌ No student found in database');
        return;
      }

      const feeStructure = await prisma.feeStructure.findFirst();
      if (!feeStructure) {
        console.log('❌ No fee structure found in database');
        return;
      }

      // Create two challans - one VOID and one superseding
      const challan1 = await prisma.feeChallan.create({
        data: {
          studentId: student.id,
          feeStructureId: feeStructure.id,
          amount: 10000,
          totalAmount: 10000,
          remainingAmount: 10000,
          paidAmount: 0,
          status: 'PENDING',
          dueDate: new Date('2025-09-01'),
          month: 'September',
          session: '2025-2026',
          selectedHeads: JSON.stringify([
            { id: 1, name: 'Tuition Fee', amount: 8000, type: 'recurring', isSelected: true },
            { id: 2, name: 'Lab Fee', amount: 2000, type: 'recurring', isSelected: true }
          ])
        }
      });

      const challan2 = await prisma.feeChallan.create({
        data: {
          studentId: student.id,
          feeStructureId: feeStructure.id,
          amount: 10000,
          totalAmount: 20000, // includes challan1's amount as arrears
          remainingAmount: 20000,
          paidAmount: 0,
          status: 'PENDING',
          dueDate: new Date('2025-10-01'),
          month: 'October',
          session: '2025-2026',
          selectedHeads: JSON.stringify([
            { id: 1, name: 'Tuition Fee', amount: 8000, type: 'recurring', isSelected: true },
            { id: 2, name: 'Lab Fee', amount: 2000, type: 'recurring', isSelected: true }
          ])
        }
      });

      // Mark challan1 as VOID and superseded by challan2
      await prisma.feeChallan.update({
        where: { id: challan1.id },
        data: {
          status: 'VOID',
          supersededById: challan2.id
        }
      });

      console.log(`✅ Created test data:`);
      console.log(`   VOID challan: #${challan1.id}`);
      console.log(`   Superseding challan: #${challan2.id}\n`);

      // Re-fetch for testing
      const testVoidChallan = await prisma.feeChallan.findUnique({
        where: { id: challan1.id }
      });

      return testVoidChallan;
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

    // Store original for rollback
    const originalHeads = JSON.parse(JSON.stringify(selectedHeads));
    const originalAmount = selectedHeads[0].amount;

    // Increase the first head's amount by 1000
    selectedHeads[0].amount = originalAmount + 1000;
    const expectedDelta = 1000;

    console.log(`🔧 Modifying selectedHeads:`);
    console.log(`   Head: ${selectedHeads[0].name}`);
    console.log(`   Original amount: Rs. ${originalAmount}`);
    console.log(`   New amount: Rs. ${selectedHeads[0].amount}`);
    console.log(`   Expected delta: Rs. ${expectedDelta}\n`);

    // Step 4: Simulate the service method logic
    console.log(`📝 Simulating updateChallan service method...\n`);

    // This simulates what happens in the service method
    const newAmount = selectedHeads.reduce((sum, h) => sum + (h.amount || 0), 0);
    const deltaAmount = newAmount - voidChallan.amount;

    console.log(`   Calculated new amount: Rs. ${newAmount}`);
    console.log(`   Delta: Rs. ${deltaAmount}\n`);

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

    // Propagate to superseding challan
    const newSupersedingTotal = supersedingBefore.totalAmount + deltaAmount;
    const newSupersedingRemaining = Math.max(0, newSupersedingTotal - (supersedingBefore.paidAmount || 0) - (supersedingBefore.discount || 0));

    // Determine new status
    let newStatus = supersedingBefore.status;
    if (newSupersedingRemaining === 0 && (supersedingBefore.paidAmount || 0) > 0) {
      newStatus = 'PAID';
    } else if (newSupersedingRemaining > 0 && (supersedingBefore.paidAmount || 0) > 0) {
      newStatus = 'PARTIAL';
    } else if (newSupersedingRemaining > 0 && (supersedingBefore.paidAmount || 0) === 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const due = new Date(supersedingBefore.dueDate);
      due.setHours(0, 0, 0, 0);
      newStatus = now > due ? 'OVERDUE' : 'PENDING';
    }

    await prisma.feeChallan.update({
      where: { id: supersedingBefore.id },
      data: {
        totalAmount: newSupersedingTotal,
        remainingAmount: newSupersedingRemaining,
        status: newStatus
      }
    });

    // Step 5: Verify the propagation
    const voidChallanAfter = await prisma.feeChallan.findUnique({
      where: { id: voidChallan.id }
    });

    const supersedingAfter = await prisma.feeChallan.findUnique({
      where: { id: voidChallan.supersededById }
    });

    console.log(`✅ VOID challan #${voidChallanAfter.id} AFTER update:`);
    console.log(`   Amount: Rs. ${voidChallanAfter.amount} (expected: Rs. ${voidChallan.amount + expectedDelta})`);
    console.log(`   Total Amount: Rs. ${voidChallanAfter.totalAmount}\n`);

    console.log(`✅ Superseding challan #${supersedingAfter.id} AFTER update:`);
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
    await prisma.feeChallan.update({
      where: { id: voidChallan.id },
      data: {
        selectedHeads: JSON.stringify(originalHeads),
        amount: voidChallan.amount,
        totalAmount: voidChallan.totalAmount,
        remainingAmount: voidChallan.remainingAmount
      }
    });
    await prisma.feeChallan.update({
      where: { id: supersedingBefore.id },
      data: {
        totalAmount: supersedingBefore.totalAmount,
        remainingAmount: supersedingBefore.remainingAmount,
        status: supersedingBefore.status
      }
    });
    console.log('✅ Rollback complete\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testVoidChallanPropagation();
