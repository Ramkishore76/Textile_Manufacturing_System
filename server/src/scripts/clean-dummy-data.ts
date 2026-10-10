import { prisma } from '../db/prisma';

async function cleanDummyData() {
  console.log('=== STARTING CLEANUP OF DUMMY DATA ===\n');

  // 1. Remove payments linked to dummy invoices
  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`✓ Deleted ${deletedPayments.count} dummy payments.`);

  // 2. Remove invoices and items
  const deletedInvoiceItems = await prisma.invoiceItem.deleteMany({});
  console.log(`✓ Deleted ${deletedInvoiceItems.count} dummy invoice items.`);
  const deletedInvoices = await prisma.invoice.deleteMany({});
  console.log(`✓ Deleted ${deletedInvoices.count} dummy invoices.`);

  // 3. Remove dispatches and dispatch items
  const deletedDispatchItems = await prisma.dispatchItem.deleteMany({});
  console.log(`✓ Deleted ${deletedDispatchItems.count} dummy dispatch items.`);
  const deletedDispatches = await prisma.dispatch.deleteMany({});
  console.log(`✓ Deleted ${deletedDispatches.count} dummy dispatches.`);

  // 4. Remove rolls and inspections
  const deletedReworks = await prisma.reworkRecord.deleteMany({});
  console.log(`✓ Deleted ${deletedReworks.count} dummy rework records.`);
  const deletedInspections = await prisma.qualityInspection.deleteMany({});
  console.log(`✓ Deleted ${deletedInspections.count} dummy quality inspections.`);
  const deletedIssues = await prisma.qualityIssue.deleteMany({});
  console.log(`✓ Deleted ${deletedIssues.count} dummy quality issues.`);
  const deletedRolls = await prisma.roll.deleteMany({});
  console.log(`✓ Deleted ${deletedRolls.count} dummy finished rolls.`);

  // 5. Remove production jobs and logs
  const deletedLogs = await prisma.productionLog.deleteMany({});
  console.log(`✓ Deleted ${deletedLogs.count} dummy production logs.`);
  const deletedJobs = await prisma.productionJob.deleteMany({});
  console.log(`✓ Deleted ${deletedJobs.count} dummy production jobs.`);

  // 6. Clean order-linked expense and purchase requests
  const deletedExpenses = await prisma.expenseRecord.deleteMany({
    where: { orderId: { not: null } },
  });
  console.log(`✓ Deleted ${deletedExpenses.count} order-linked expense records.`);

  const deletedPurchaseRequests = await prisma.purchaseRequest.deleteMany({
    where: { orderId: { not: null } },
  });
  console.log(`✓ Deleted ${deletedPurchaseRequests.count} order-linked purchase requests.`);

  // 7. Remove order items and orders
  const deletedOrderItems = await prisma.orderItem.deleteMany({});
  console.log(`✓ Deleted ${deletedOrderItems.count} dummy order items.`);
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✓ Deleted ${deletedOrders.count} dummy orders.`);

  // 8. Remove dummy test products
  const deletedTestBOMs = await prisma.billOfMaterials.deleteMany({
    where: { fabricProduct: { code: { startsWith: 'FAB-TEST' } } },
  });
  console.log(`✓ Deleted ${deletedTestBOMs.count} BOMs for test products.`);
  const deletedTestProducts = await prisma.fabricProduct.deleteMany({
    where: { code: { startsWith: 'FAB-TEST' } },
  });
  console.log(`✓ Deleted ${deletedTestProducts.count} dummy test fabric products.`);

  // 9. Remove dummy test buyers
  const dummyBuyers = await prisma.buyer.findMany({
    where: {
      OR: [
        { email: { contains: 'testbuyer' } },
        { companyName: { contains: 'Nordic Designs Ltd' } },
        { email: { contains: 'test' } },
      ],
    },
    include: { accounts: true },
  });

  for (const b of dummyBuyers) {
    await prisma.user.deleteMany({ where: { buyerAccountId: { in: b.accounts.map(a => a.id) } } });
    await prisma.buyerAccount.deleteMany({ where: { buyerId: b.id } });
    await prisma.buyer.delete({ where: { id: b.id } });
    console.log(`✓ Removed dummy test buyer: ${b.companyName} (${b.email})`);
  }

  // 10. Remove dummy test users created with timestamps
  const deletedTestUsers = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { contains: '17916' } },
        { email: { startsWith: 'test_' } },
        { email: { startsWith: 'verify_' } },
      ],
    },
  });
  console.log(`✓ Deleted ${deletedTestUsers.count} temporary/dummy test user accounts.`);

  console.log('\n=== DUMMY DATA CLEANUP COMPLETED SUCCESSFULLY ===');
}

cleanDummyData()
  .catch((err) => {
    console.error('Error cleaning dummy data:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
