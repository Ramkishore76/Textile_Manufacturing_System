import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedHistoricalFinancials() {
  console.log('--- Checking Historical Financial Data ---');
  const expenseCount = await prisma.expenseRecord.count();
  if (expenseCount > 5) {
    console.log(`Historical expenses already populated (${expenseCount} records). Skipping.`);
    return;
  }

  const buyers = await prisma.buyer.findMany();
  if (buyers.length === 0) {
    console.log('No buyers found. Skipping.');
    return;
  }
  const buyer1 = buyers[0];
  const buyer2 = buyers.length > 1 ? buyers[1] : buyers[0];

  const employees = await prisma.employee.findMany();

  console.log('Populating historical financial data for Plant Owner Analytics...');

  // 1. Seed 2025 Data (Full fiscal year baseline)
  const monthly2025 = [
    { month: 1, rev: 240000, elec: 36000, maint: 12000, dye: 18000, other: 8000 },
    { month: 2, rev: 260000, elec: 38000, maint: 14000, dye: 20000, other: 9000 },
    { month: 3, rev: 290000, elec: 40000, maint: 15000, dye: 22000, other: 10000 },
    { month: 4, rev: 275000, elec: 39000, maint: 11000, dye: 19000, other: 8500 },
    { month: 5, rev: 310000, elec: 42000, maint: 16000, dye: 24000, other: 11000 },
    { month: 6, rev: 330000, elec: 44000, maint: 18000, dye: 26000, other: 12000 },
    { month: 7, rev: 285000, elec: 40000, maint: 13000, dye: 21000, other: 9500 },
    { month: 8, rev: 320000, elec: 43000, maint: 17000, dye: 25000, other: 11500 },
    { month: 9, rev: 350000, elec: 45000, maint: 19000, dye: 28000, other: 13000 },
    { month: 10, rev: 340000, elec: 44000, maint: 18000, dye: 27000, other: 12500 },
    { month: 11, rev: 360000, elec: 46000, maint: 20000, dye: 29000, other: 14000 },
    { month: 12, rev: 380000, elec: 48000, maint: 22000, dye: 31000, other: 15000 },
  ];

  for (const item of monthly2025) {
    const d = new Date(2025, item.month - 1, 15);
    const mStr = String(item.month).padStart(2, '0');

    // Create Invoice
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2025-${mStr}`,
        buyerId: item.month % 2 === 0 ? buyer1.id : buyer2.id,
        orderId: 'cmv1xi6ro001jiso1x3zepzcw', // ORD-2026-001 reference
        subtotal: item.rev,
        taxAmount: item.rev * 0.05,
        totalAmount: item.rev * 1.05,
        paidAmount: item.rev * 1.05,
        balanceAmount: 0,
        status: 'PAID',
        issueDate: d,
        dueDate: new Date(2025, item.month - 1, 28),
      },
    });

    // Create Expenses
    await prisma.expenseRecord.createMany({
      data: [
        {
          expenseNumber: `EXP-2025-${mStr}-01`,
          category: 'ELECTRICITY_UTILITIES',
          amount: item.elec,
          expenseDate: new Date(2025, item.month - 1, 5),
          description: `TANGEDCO Electricity Grid Tariff - Month ${mStr}/2025`,
        },
        {
          expenseNumber: `EXP-2025-${mStr}-02`,
          category: 'MAINTENANCE',
          amount: item.maint,
          expenseDate: new Date(2025, item.month - 1, 12),
          description: `Loom preventative maintenance and parts - Month ${mStr}/2025`,
        },
        {
          expenseNumber: `EXP-2025-${mStr}-03`,
          category: 'DYEING_PROCESSING',
          amount: item.dye,
          expenseDate: new Date(2025, item.month - 1, 18),
          description: `Reactive Dyes & softening auxiliaries - Month ${mStr}/2025`,
        },
        {
          expenseNumber: `EXP-2025-${mStr}-04`,
          category: 'OTHER',
          amount: item.other,
          expenseDate: new Date(2025, item.month - 1, 25),
          description: `Plant consumables, logistics & overheads - Month ${mStr}/2025`,
        },
      ],
    });

    // Create Wages for employees
    for (const emp of employees) {
      await prisma.wageRecord.create({
        data: {
          employeeId: emp.id,
          periodMonth: item.month,
          periodYear: 2025,
          basePay: emp.dailyBaseWage * 24,
          overtimePay: 1200,
          netWage: emp.dailyBaseWage * 24 + 1200,
          status: 'PAID',
          paymentDate: new Date(2025, item.month - 1, 28),
        },
      });
    }
  }

  // 2. Seed 2026 Data (Months 1 to 9 baseline)
  const monthly2026 = [
    { month: 1, rev: 350000, elec: 42000, maint: 16000, dye: 22000, other: 10000 },
    { month: 2, rev: 380000, elec: 44000, maint: 18000, dye: 24000, other: 11000 },
    { month: 3, rev: 410000, elec: 46000, maint: 20000, dye: 27000, other: 12500 },
    { month: 4, rev: 395000, elec: 45000, maint: 17000, dye: 25000, other: 11000 },
    { month: 5, rev: 430000, elec: 48000, maint: 21000, dye: 29000, other: 13000 },
    { month: 6, rev: 450000, elec: 49000, maint: 22000, dye: 30000, other: 14000 },
    { month: 7, rev: 420000, elec: 47000, maint: 19000, dye: 28000, other: 12000 },
    { month: 8, rev: 460000, elec: 50000, maint: 23000, dye: 31000, other: 14500 },
    { month: 9, rev: 480000, elec: 51000, maint: 24000, dye: 32000, other: 15000 },
  ];

  for (const item of monthly2026) {
    const d = new Date(2026, item.month - 1, 15);
    const mStr = String(item.month).padStart(2, '0');

    // Create Invoice
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2026-H${mStr}`,
        buyerId: item.month % 2 === 0 ? buyer1.id : buyer2.id,
        orderId: 'cmv1xi6ro001jiso1x3zepzcw',
        subtotal: item.rev,
        taxAmount: item.rev * 0.05,
        totalAmount: item.rev * 1.05,
        paidAmount: item.rev * 1.05,
        balanceAmount: 0,
        status: 'PAID',
        issueDate: d,
        dueDate: new Date(2026, item.month - 1, 28),
      },
    });

    // Create Expenses
    await prisma.expenseRecord.createMany({
      data: [
        {
          expenseNumber: `EXP-2026-H${mStr}-01`,
          category: 'ELECTRICITY_UTILITIES',
          amount: item.elec,
          expenseDate: new Date(2026, item.month - 1, 5),
          description: `TANGEDCO High-Tension Grid Power - Month ${mStr}/2026`,
        },
        {
          expenseNumber: `EXP-2026-H${mStr}-02`,
          category: 'MAINTENANCE',
          amount: item.maint,
          expenseDate: new Date(2026, item.month - 1, 12),
          description: `Rapier & Airjet Loom overhaul & lubrication - Month ${mStr}/2026`,
        },
        {
          expenseNumber: `EXP-2026-H${mStr}-03`,
          category: 'DYEING_PROCESSING',
          amount: item.dye,
          expenseDate: new Date(2026, item.month - 1, 18),
          description: `Eco-grade Reactive Colorants & fixing salts - Month ${mStr}/2026`,
        },
        {
          expenseNumber: `EXP-2026-H${mStr}-04`,
          category: 'OTHER',
          amount: item.other,
          expenseDate: new Date(2026, item.month - 1, 25),
          description: `Packaging boxes, logistics, quality audits & plant overheads - Month ${mStr}/2026`,
        },
      ],
    });

    // Create Wages for employees
    for (const emp of employees) {
      await prisma.wageRecord.create({
        data: {
          employeeId: emp.id,
          periodMonth: item.month,
          periodYear: 2026,
          basePay: emp.dailyBaseWage * 24,
          overtimePay: 1500,
          netWage: emp.dailyBaseWage * 24 + 1500,
          status: 'PAID',
          paymentDate: new Date(2026, item.month - 1, 28),
        },
      });
    }
  }

  console.log('Historical financial records successfully populated for Plant Owner Analytics!');
}

if (require.main === module) {
  seedHistoricalFinancials()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      prisma.$disconnect();
    });
}
