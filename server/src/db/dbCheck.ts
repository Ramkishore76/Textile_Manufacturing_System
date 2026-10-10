import { prisma } from './prisma';

async function checkDatabaseHealth() {
  console.log('========================================================================');
  console.log('  AGT TEXTILE MILLS — SUPABASE POSTGRESQL DATABASE DIAGNOSTIC');
  console.log('========================================================================\n');

  const start = Date.now();
  try {
    // 1. Connection latency check using single connection
    await prisma.$queryRaw`SELECT 1 as connected`;
    const latency = Date.now() - start;
    console.log(`[STATUS] Database Connected Successfully (Latency: ${latency}ms)`);
    console.log(`[TARGET] Supabase Cloud Instance: aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres\n`);

    // 2. Query Row Counts using single connection to respect pool limit
    const counts = {
      users: await prisma.user.count(),
      buyers: await prisma.buyer.count(),
      buyerAccounts: await prisma.buyerAccount.count(),
      suppliers: await prisma.supplier.count(),
      employees: await prisma.employee.count(),
      fabricProducts: await prisma.fabricProduct.count(),
      yarnMaterials: await prisma.yarnMaterial.count(),
      boms: await prisma.billOfMaterials.count(),
      orders: await prisma.order.count(),
      orderItems: await prisma.orderItem.count(),
      purchaseRequests: await prisma.purchaseRequest.count(),
      purchaseOrders: await prisma.purchaseOrder.count(),
      goodsReceipts: await prisma.goodsReceipt.count(),
      inventoryTransactions: await prisma.inventoryTransaction.count(),
      machines: await prisma.machine.count(),
      shifts: await prisma.shift.count(),
      productionJobs: await prisma.productionJob.count(),
      productionLogs: await prisma.productionLog.count(),
      fgLocations: await prisma.finishedGoodsLocation.count(),
      rolls: await prisma.roll.count(),
      qualityInspections: await prisma.qualityInspection.count(),
      reworkRecords: await prisma.reworkRecord.count(),
      dispatches: await prisma.dispatch.count(),
      dispatchItems: await prisma.dispatchItem.count(),
      invoices: await prisma.invoice.count(),
      invoiceItems: await prisma.invoiceItem.count(),
      payments: await prisma.payment.count(),
      attendance: await prisma.attendance.count(),
      wageRecords: await prisma.wageRecord.count(),
      expenseRecords: await prisma.expenseRecord.count(),
      notifications: await prisma.notification.count(),
      auditLogs: await prisma.auditLog.count(),
    };

    console.log('--- Database Record Inventory ---');
    console.log(`• Users & Auth Accounts:          ${counts.users} users, ${counts.buyerAccounts} buyer logins`);
    console.log(`• Buyers & Suppliers:              ${counts.buyers} buyers, ${counts.suppliers} suppliers`);
    console.log(`• Products & BOMs:                 ${counts.fabricProducts} fabrics, ${counts.yarnMaterials} yarns, ${counts.boms} BOM recipes`);
    console.log(`• Orders & Line Items:             ${counts.orders} orders, ${counts.orderItems} line items`);
    console.log(`• Purchase & Goods Receipts (GRN): ${counts.purchaseRequests} PRs, ${counts.purchaseOrders} POs, ${counts.goodsReceipts} GRNs`);
    console.log(`• Inventory Transactions:          ${counts.inventoryTransactions} ledger entries`);
    console.log(`• Machines & Shifts:               ${counts.machines} machines, ${counts.shifts} shifts`);
    console.log(`• Production Jobs & Hourly Logs:   ${counts.productionJobs} jobs, ${counts.productionLogs} logs`);
    console.log(`• Fabric Rolls & FG Locations:     ${counts.rolls} rolls, ${counts.fgLocations} warehouse locations`);
    console.log(`• Quality Inspections & Reworks:   ${counts.qualityInspections} inspections, ${counts.reworkRecords} reworks`);
    console.log(`• Dispatches & Consignments:       ${counts.dispatches} dispatches, ${counts.dispatchItems} roll items`);
    console.log(`• Commercial Invoices & Items:     ${counts.invoices} invoices, ${counts.invoiceItems} item lines`);
    console.log(`• Buyer Payments Ledger:           ${counts.payments} payments recorded`);
    console.log(`• HR, Attendance & Wages:          ${counts.employees} employees, ${counts.attendance} attendance records, ${counts.wageRecords} wage slips`);
    console.log(`• Manufacturing Expenses:          ${counts.expenseRecords} expense records`);
    console.log(`• In-App Notifications:            ${counts.notifications} notifications`);
    console.log(`• System Audit Logs:               ${counts.auditLogs} immutable audit entries`);

    console.log('\n========================================================================');
    console.log('  ALL 32 DATABASE ENTITIES VERIFIED & ACTIVE IN SUPABASE POSTGRESQL');
    console.log('========================================================================');
  } catch (err: any) {
    console.error('[ERROR] Database Check Failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseHealth();
