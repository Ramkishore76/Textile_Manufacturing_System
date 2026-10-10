import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding AGT Textile Mills Database ---');

  // Clear existing records in proper dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.dispatchItem.deleteMany();
  await prisma.dispatch.deleteMany();
  await prisma.qualityInspection.deleteMany();
  await prisma.reworkRecord.deleteMany();
  await prisma.roll.deleteMany();
  await prisma.finishedGoodsLocation.deleteMany();
  await prisma.productionLog.deleteMany();
  await prisma.productionJob.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.wageRecord.deleteMany();
  await prisma.expenseRecord.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.goodsReceipt.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.billOfMaterials.deleteMany();
  await prisma.fabricProduct.deleteMany();
  await prisma.yarnMaterial.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.buyerAccount.deleteMany();
  await prisma.buyer.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Admin@123', salt);
  const buyerPasswordHash = await bcrypt.hash('Buyer@123', salt);

  // 1. Create Buyers
  const buyer1 = await prisma.buyer.create({
    data: {
      name: 'Anders Lindqvist',
      companyName: 'Nordic Apparel Corp',
      email: 'buyer@nordicapparel.com',
      phone: '+46 8 123 4567',
      address: 'Hamngatan 15, Stockholm, Sweden',
      taxNumber: 'SE556123456701',
      creditLimit: 3000000,
    },
  });

  const buyer2 = await prisma.buyer.create({
    data: {
      name: 'Priya Sharma',
      companyName: 'CasualLine Garments Ltd',
      email: 'buyer@casualline.com',
      phone: '+91 98765 43210',
      address: 'Electronic City, Bengaluru, Karnataka, India',
      taxNumber: '29ABCDE1234F1Z5',
      creditLimit: 1500000,
    },
  });

  // Buyer Accounts
  const buyer1Account = await prisma.buyerAccount.create({
    data: {
      buyerId: buyer1.id,
      status: 'ACTIVE',
    },
  });

  const buyer2Account = await prisma.buyerAccount.create({
    data: {
      buyerId: buyer2.id,
      status: 'ACTIVE',
    },
  });

  // 2. Create Users
  // Internal Users
  const usersData = [
    {
      name: 'Rajendran Murthy (Owner)',
      email: 'admin@agttextile.com',
      password: defaultPasswordHash,
      role: 'ADMIN',
      phone: '+91 98422 10001',
    },
    {
      name: 'Vikram Seth (Sales Head)',
      email: 'sales@agttextile.com',
      password: await bcrypt.hash('Sales@123', salt),
      role: 'SALES',
      phone: '+91 98422 10002',
    },
    {
      name: 'Gopalakrishnan N (Store Manager)',
      email: 'store@agttextile.com',
      password: await bcrypt.hash('Store@123', salt),
      role: 'STORE',
      phone: '+91 98422 10003',
    },
    {
      name: 'Karthik Raman (Production Mgr)',
      email: 'production@agttextile.com',
      password: await bcrypt.hash('Prod@123', salt),
      role: 'PRODUCTION',
      phone: '+91 98422 10004',
    },
    {
      name: 'Subramanian V (Quality Inspector)',
      email: 'quality@agttextile.com',
      password: await bcrypt.hash('Quality@123', salt),
      role: 'QUALITY',
      phone: '+91 98422 10005',
    },
    {
      name: 'Selvam D (Dispatch Supervisor)',
      email: 'dispatch@agttextile.com',
      password: await bcrypt.hash('Dispatch@123', salt),
      role: 'DISPATCH',
      phone: '+91 98422 10006',
    },
    {
      name: 'Meenakshi Sundaram (Finance/Accounts)',
      email: 'accounts@agttextile.com',
      password: await bcrypt.hash('Accounts@123', salt),
      role: 'ACCOUNTS',
      phone: '+91 98422 10007',
    },
    // Buyer Users
    {
      name: 'Nordic Apparel Portal User',
      email: 'buyer@nordicapparel.com',
      password: buyerPasswordHash,
      role: 'BUYER',
      phone: '+46 8 123 4567',
      buyerAccountId: buyer1Account.id,
    },
    {
      name: 'CasualLine Portal User',
      email: 'buyer@casualline.com',
      password: buyerPasswordHash,
      role: 'BUYER',
      phone: '+91 98765 43210',
      buyerAccountId: buyer2Account.id,
    },
  ];

  for (const u of usersData) {
    await prisma.user.create({ data: u });
  }

  // 3. Create Suppliers
  const sup1 = await prisma.supplier.create({
    data: {
      name: 'Sri Lakshmi Cotton Spinners',
      contactPerson: 'K. Rangarajan',
      email: 'sales@srilakshmicotton.in',
      phone: '+91 94431 12345',
      address: 'Avanashi Road, Coimbatore, Tamil Nadu',
      yarnTypesSupplied: '100% Combed Cotton, Carded Cotton (20s - 60s)',
      paymentTerms: '30 Days Net',
    },
  });

  const sup2 = await prisma.supplier.create({
    data: {
      name: 'Vardhman Yarns & Threads Ltd',
      contactPerson: 'Amit Aggarwal',
      email: 'orders@vardhmanyarns.com',
      phone: '+91 161 222 8900',
      address: 'Chandigarh Road, Ludhiana, Punjab',
      yarnTypesSupplied: 'Polyester, Poly-Cotton Blends (30s - 40s)',
      paymentTerms: '45 Days Net',
    },
  });

  const sup3 = await prisma.supplier.create({
    data: {
      name: 'Reliance Polyester Division',
      contactPerson: 'Rajesh Mehta',
      email: 'textile@ril.com',
      phone: '+91 22 3555 5000',
      address: 'Hazira Petrochemical Complex, Surat, Gujarat',
      yarnTypesSupplied: 'Micro-Denier Polyester, Filament Yarns',
      paymentTerms: 'Advance / 15 Days',
    },
  });

  // 4. Create Employees
  const emp1 = await prisma.employee.create({
    data: {
      employeeCode: 'EMP001',
      name: 'Murugan S',
      department: 'SPINNING',
      role: 'Senior Ring Frame Operator',
      phone: '+91 98421 11001',
      hourlyRate: 110,
      dailyBaseWage: 880,
      overtimeHourlyRate: 165,
      status: 'ACTIVE',
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      employeeCode: 'EMP002',
      name: 'Kavitha R',
      department: 'WEAVING',
      role: 'Senior Air Jet Weaver',
      phone: '+91 98421 11002',
      hourlyRate: 120,
      dailyBaseWage: 960,
      overtimeHourlyRate: 180,
      status: 'ACTIVE',
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      employeeCode: 'EMP003',
      name: 'Sundarraj P',
      department: 'DYEING',
      role: 'Master Dyer & Chemical Specialist',
      phone: '+91 98421 11003',
      hourlyRate: 140,
      dailyBaseWage: 1120,
      overtimeHourlyRate: 210,
      status: 'ACTIVE',
    },
  });

  const emp4 = await prisma.employee.create({
    data: {
      employeeCode: 'EMP004',
      name: 'Dinesh Kumar',
      department: 'QUALITY',
      role: 'Lead Fabric Quality Inspector',
      phone: '+91 98421 11004',
      hourlyRate: 130,
      dailyBaseWage: 1040,
      overtimeHourlyRate: 195,
      status: 'ACTIVE',
    },
  });

  const emp5 = await prisma.employee.create({
    data: {
      employeeCode: 'EMP005',
      name: 'Velusamy M',
      department: 'DISPATCH',
      role: 'Packing & Loading Officer',
      phone: '+91 98421 11005',
      hourlyRate: 100,
      dailyBaseWage: 800,
      overtimeHourlyRate: 150,
      status: 'ACTIVE',
    },
  });

  // 5. Create Shifts
  const shiftA = await prisma.shift.create({
    data: {
      name: 'Shift A (Morning)',
      startTime: '06:00',
      endTime: '14:00',
      isActive: true,
    },
  });

  const shiftB = await prisma.shift.create({
    data: {
      name: 'Shift B (Evening)',
      startTime: '14:00',
      endTime: '22:00',
      isActive: true,
    },
  });

  const shiftC = await prisma.shift.create({
    data: {
      name: 'Shift C (Night)',
      startTime: '22:00',
      endTime: '06:00',
      isActive: true,
    },
  });

  // 6. Create Machines
  const mSpin1 = await prisma.machine.create({
    data: {
      code: 'M-SPIN-01',
      name: 'Rieter Ring Frame G38 #1',
      type: 'SPINNING',
      model: 'Rieter G38 Compact',
      status: 'RUNNING',
      capacityPerHour: 45.0, // kg/hr
      hourlyOperatingCost: 180.0,
      location: 'Spinning Shed A',
      lastMaintenanceDate: new Date('2026-09-15'),
    },
  });

  const mSpin2 = await prisma.machine.create({
    data: {
      code: 'M-SPIN-02',
      name: 'Rieter Ring Frame G38 #2',
      type: 'SPINNING',
      model: 'Rieter G38 Compact',
      status: 'IDLE',
      capacityPerHour: 45.0,
      hourlyOperatingCost: 180.0,
      location: 'Spinning Shed A',
      lastMaintenanceDate: new Date('2026-09-20'),
    },
  });

  const mWeav1 = await prisma.machine.create({
    data: {
      code: 'M-WEAV-01',
      name: 'Toyota JAT810 Air Jet Loom #1',
      type: 'WEAVING',
      model: 'Toyota JAT810 230cm',
      status: 'RUNNING',
      capacityPerHour: 28.0, // m/hr
      hourlyOperatingCost: 220.0,
      location: 'Weaving Shed B',
      lastMaintenanceDate: new Date('2026-09-10'),
    },
  });

  const mWeav2 = await prisma.machine.create({
    data: {
      code: 'M-WEAV-02',
      name: 'Toyota JAT810 Air Jet Loom #2',
      type: 'WEAVING',
      model: 'Toyota JAT810 230cm',
      status: 'IDLE',
      capacityPerHour: 28.0,
      hourlyOperatingCost: 220.0,
      location: 'Weaving Shed B',
      lastMaintenanceDate: new Date('2026-09-25'),
    },
  });

  const mWeav3 = await prisma.machine.create({
    data: {
      code: 'M-WEAV-03',
      name: 'Picanol OmniPlus-i Loom #3',
      type: 'WEAVING',
      model: 'Picanol OmniPlus-i 220cm',
      status: 'MAINTENANCE',
      capacityPerHour: 32.0,
      hourlyOperatingCost: 240.0,
      location: 'Weaving Shed B',
      lastMaintenanceDate: new Date('2026-10-01'),
    },
  });

  const mDye1 = await prisma.machine.create({
    data: {
      code: 'M-DYE-01',
      name: 'Thies Eco-Soft Soft-Flow Dyeing Machine',
      type: 'DYEING',
      model: 'Thies Eco-Soft 400KG',
      status: 'RUNNING',
      capacityPerHour: 50.0, // m/hr equiv
      hourlyOperatingCost: 450.0,
      location: 'Dye House Section 1',
      lastMaintenanceDate: new Date('2026-09-18'),
    },
  });

  const mDye2 = await prisma.machine.create({
    data: {
      code: 'M-DYE-02',
      name: 'Fongs High-Temp Jet Dyeing Unit',
      type: 'DYEING',
      model: 'Fongs Superwin 500KG',
      status: 'BREAKDOWN',
      capacityPerHour: 60.0,
      hourlyOperatingCost: 500.0,
      location: 'Dye House Section 2',
      lastMaintenanceDate: new Date('2026-08-30'),
    },
  });

  // 7. Finished Goods Locations
  const loc1 = await prisma.finishedGoodsLocation.create({
    data: {
      locationCode: 'WH-FG-A1',
      zone: 'Zone A (Poplin & Shirting)',
      capacityRolls: 80,
      currentRollCount: 15,
    },
  });

  const loc2 = await prisma.finishedGoodsLocation.create({
    data: {
      locationCode: 'WH-FG-B1',
      zone: 'Zone B (Twill & Denim)',
      capacityRolls: 60,
      currentRollCount: 8,
    },
  });

  const loc3 = await prisma.finishedGoodsLocation.create({
    data: {
      locationCode: 'WH-FG-DSP',
      zone: 'Dispatch Ready Dock',
      capacityRolls: 50,
      currentRollCount: 4,
    },
  });

  // 8. Raw Yarn Materials
  const yarn1 = await prisma.yarnMaterial.create({
    data: {
      code: 'YRN-COT-40S',
      name: '40s Combed Cotton Cone Yarn',
      yarnType: 'Cotton',
      count: '40s',
      color: 'Natural White',
      unit: 'KG',
      currentStock: 3500.0,
      reservedStock: 450.0,
      minimumStockAlert: 500.0,
      costPerUnit: 285.0,
      storageLocation: 'WH-RAW-A1',
    },
  });

  const yarn2 = await prisma.yarnMaterial.create({
    data: {
      code: 'YRN-COT-20S',
      name: '20s Carded Cotton Yarn',
      yarnType: 'Cotton',
      count: '20s',
      color: 'Natural White',
      unit: 'KG',
      currentStock: 2200.0,
      reservedStock: 280.0,
      minimumStockAlert: 400.0,
      costPerUnit: 215.0,
      storageLocation: 'WH-RAW-A2',
    },
  });

  const yarn3 = await prisma.yarnMaterial.create({
    data: {
      code: 'YRN-PLY-30S',
      name: '30s Spun Polyester Yarn',
      yarnType: 'Polyester',
      count: '30s',
      color: 'Bright White',
      unit: 'KG',
      currentStock: 95.0, // Shortage / low stock example!
      reservedStock: 0.0,
      minimumStockAlert: 200.0,
      costPerUnit: 165.0,
      storageLocation: 'WH-RAW-B1',
    },
  });

  const yarn4 = await prisma.yarnMaterial.create({
    data: {
      code: 'YRN-IND-10S',
      name: '10s Ring Spun Indigo Slub Yarn',
      yarnType: 'Cotton',
      count: '10s',
      color: 'Deep Indigo',
      unit: 'KG',
      currentStock: 1800.0,
      reservedStock: 0.0,
      minimumStockAlert: 350.0,
      costPerUnit: 330.0,
      storageLocation: 'WH-RAW-A3',
    },
  });

  // 9. Fabric Products
  const fab1 = await prisma.fabricProduct.create({
    data: {
      code: 'FAB-COT-101',
      name: '100% Combed Cotton Poplin',
      fabricType: 'Cotton',
      gsm: 125.0,
      widthInches: 58.0,
      weaveType: 'Plain',
      unitPricePerMeter: 145.0,
      requiresSpinning: true,
      description: 'Fine premium cotton poplin suitable for export shirts and blouses.',
    },
  });

  const fab2 = await prisma.fabricProduct.create({
    data: {
      code: 'FAB-COT-201',
      name: 'Heavy Cotton Twill 3/1',
      fabricType: 'Cotton',
      gsm: 240.0,
      widthInches: 60.0,
      weaveType: 'Twill',
      unitPricePerMeter: 225.0,
      requiresSpinning: true,
      description: 'Durable structured twill fabric for workwear and chinos.',
    },
  });

  const fab3 = await prisma.fabricProduct.create({
    data: {
      code: 'FAB-PLY-301',
      name: 'Poly-Cotton Shirting 65/35',
      fabricType: 'Poly-Cotton',
      gsm: 115.0,
      widthInches: 56.0,
      weaveType: 'Plain',
      unitPricePerMeter: 115.0,
      requiresSpinning: false, // Configurable bypass spinning!
      description: 'Wrinkle-resistant poly-cotton blend shirting fabric.',
    },
  });

  const fab4 = await prisma.fabricProduct.create({
    data: {
      code: 'FAB-DNM-401',
      name: 'Indigo Ring Slub Denim 12oz',
      fabricType: 'Denim',
      gsm: 340.0,
      widthInches: 62.0,
      weaveType: 'Twill',
      unitPricePerMeter: 310.0,
      requiresSpinning: true,
      description: 'Heavy authentic vintage indigo denim fabric.',
    },
  });

  // 10. Bill of Materials
  await prisma.billOfMaterials.create({
    data: {
      fabricProductId: fab1.id,
      yarnMaterialId: yarn1.id,
      yarnQuantityPerMeter: 0.15, // 150g per meter
      wastagePercentage: 3.0,
    },
  });

  await prisma.billOfMaterials.create({
    data: {
      fabricProductId: fab2.id,
      yarnMaterialId: yarn2.id,
      yarnQuantityPerMeter: 0.28,
      wastagePercentage: 4.0,
    },
  });

  await prisma.billOfMaterials.create({
    data: {
      fabricProductId: fab3.id,
      yarnMaterialId: yarn3.id,
      yarnQuantityPerMeter: 0.14,
      wastagePercentage: 3.0,
    },
  });

  await prisma.billOfMaterials.create({
    data: {
      fabricProductId: fab4.id,
      yarnMaterialId: yarn4.id,
      yarnQuantityPerMeter: 0.40,
      wastagePercentage: 5.0,
    },
  });

  // 11. Create Sample Orders
  // Order 1: Completed & Dispatched with payment
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-001',
      buyerId: buyer1.id,
      orderDate: new Date('2026-09-01'),
      requiredDeliveryDate: new Date('2026-09-28'),
      priority: 'HIGH',
      status: 'DISPATCHED',
      totalAmount: 290000.0,
      notes: 'Initial autumn collection batch for Nordic Apparel.',
    },
  });

  const order1Item = await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      fabricProductId: fab1.id,
      color: 'Crisp Bleached White',
      requiredQuantity: 2000.0,
      unit: 'METERS',
      unitPrice: 145.0,
      totalPrice: 290000.0,
      producedQuantity: 2000.0,
      passedQuantity: 2000.0,
      reworkQuantity: 0.0,
      rejectedQuantity: 0.0,
      dispatchedQuantity: 2000.0,
    },
  });

  // Rolls for Order 1 (dispatched)
  const roll1 = await prisma.roll.create({
    data: {
      rollId: 'ROLL-2026-0001',
      orderId: order1.id,
      orderItemId: order1Item.id,
      fabricType: fab1.name,
      color: 'Crisp Bleached White',
      lengthMeters: 1000.0,
      weightKg: 155.0,
      qualityStatus: 'PASSED',
      inventoryStatus: 'DISPATCHED',
      locationId: loc3.id,
    },
  });

  const roll2 = await prisma.roll.create({
    data: {
      rollId: 'ROLL-2026-0002',
      orderId: order1.id,
      orderItemId: order1Item.id,
      fabricType: fab1.name,
      color: 'Crisp Bleached White',
      lengthMeters: 1000.0,
      weightKg: 155.0,
      qualityStatus: 'PASSED',
      inventoryStatus: 'DISPATCHED',
      locationId: loc3.id,
    },
  });

  // Dispatch for Order 1
  const dispatch1 = await prisma.dispatch.create({
    data: {
      dispatchNumber: 'DSP-2026-001',
      orderId: order1.id,
      buyerId: buyer1.id,
      dispatchDate: new Date('2026-09-26'),
      carrierName: 'AGT Global Cargo / Maersk Sea Freight',
      vehicleNumber: 'TN-38-BZ-4412',
      trackingNumber: 'AGT-SEAFRT-99812',
      status: 'DELIVERED',
      totalMeters: 2000.0,
      totalRolls: 2,
      notes: 'Shipped in full, container seal verified intact.',
    },
  });

  await prisma.dispatchItem.create({
    data: {
      dispatchId: dispatch1.id,
      orderItemId: order1Item.id,
      rollId: roll1.id,
      meters: 1000.0,
    },
  });

  await prisma.dispatchItem.create({
    data: {
      dispatchId: dispatch1.id,
      orderItemId: order1Item.id,
      rollId: roll2.id,
      meters: 1000.0,
    },
  });

  // Commercial Invoice & Payment for Order 1
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-001',
      orderId: order1.id,
      buyerId: buyer1.id,
      dispatchId: dispatch1.id,
      subtotal: 290000.0,
      taxRate: 5.0,
      taxAmount: 14500.0,
      totalAmount: 304500.0,
      paidAmount: 304500.0,
      balanceAmount: 0.0,
      status: 'PAID',
      issueDate: new Date('2026-09-26'),
      dueDate: new Date('2026-10-26'),
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: inv1.id,
      description: '100% Combed Cotton Poplin (Bleached White) - 2000 Meters',
      quantity: 2000.0,
      unit: 'METERS',
      unitPrice: 145.0,
      amount: 290000.0,
    },
  });

  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-001',
      invoiceId: inv1.id,
      buyerId: buyer1.id,
      amount: 304500.0,
      paymentDate: new Date('2026-10-02'),
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: 'TXN-SWIFT-SE-9081234',
      notes: 'Full payment received through Handelsbanken wire transfer.',
    },
  });

  // Order 2: Active in Production (Weaving / Dyeing)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-002',
      buyerId: buyer1.id,
      orderDate: new Date('2026-10-01'),
      requiredDeliveryDate: new Date('2026-10-28'),
      priority: 'NORMAL',
      status: 'IN_PRODUCTION',
      totalAmount: 450000.0,
      notes: 'Chino pants twill fabric order.',
    },
  });

  const order2Item = await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      fabricProductId: fab2.id,
      color: 'Khaki Sand',
      requiredQuantity: 2000.0,
      unit: 'METERS',
      unitPrice: 225.0,
      totalPrice: 450000.0,
      producedQuantity: 1000.0,
      passedQuantity: 500.0,
      reworkQuantity: 0.0,
      rejectedQuantity: 0.0,
      dispatchedQuantity: 0.0,
    },
  });

  // Production Job for Order 2
  const jobSpin = await prisma.productionJob.create({
    data: {
      jobNumber: 'JOB-2026-001',
      orderId: order2.id,
      orderItemId: order2Item.id,
      stage: 'SPINNING',
      machineId: mSpin1.id,
      shiftId: shiftA.id,
      assignedEmployeeId: emp1.id,
      plannedQuantity: 600.0, // kg
      actualQuantity: 600.0,
      wastageQuantity: 18.0,
      startTime: new Date('2026-10-02T06:00:00'),
      completionTime: new Date('2026-10-03T14:00:00'),
      status: 'COMPLETED',
      operatorRemarks: 'Yarn spun to 20s specification with excellent uniformity.',
    },
  });

  const jobWeav = await prisma.productionJob.create({
    data: {
      jobNumber: 'JOB-2026-002',
      orderId: order2.id,
      orderItemId: order2Item.id,
      stage: 'WEAVING',
      machineId: mWeav1.id,
      shiftId: shiftB.id,
      assignedEmployeeId: emp2.id,
      plannedQuantity: 2000.0,
      actualQuantity: 1000.0,
      wastageQuantity: 24.0,
      startTime: new Date('2026-10-04T08:00:00'),
      status: 'IN_PROGRESS',
      operatorRemarks: 'First 1000m woven smoothly, continuing on second half.',
    },
  });

  // Roll 3: Quality Passed, in finished stock ready for dispatch
  const roll3 = await prisma.roll.create({
    data: {
      rollId: 'ROLL-2026-0003',
      orderId: order2.id,
      orderItemId: order2Item.id,
      productionJobId: jobWeav.id,
      fabricType: fab2.name,
      color: 'Khaki Sand',
      lengthMeters: 500.0,
      weightKg: 145.0,
      qualityStatus: 'PASSED',
      inventoryStatus: 'IN_FINISHED_STOCK',
      locationId: loc2.id,
    },
  });

  await prisma.qualityInspection.create({
    data: {
      rollId: roll3.id,
      inspectorId: emp4.id,
      inspectorName: emp4.name,
      result: 'PASSED',
      defectCategory: 'NONE',
      remarks: 'Zero structural flaws, color consistent across roll.',
    },
  });

  // Roll 4: Pending Inspection
  const roll4 = await prisma.roll.create({
    data: {
      rollId: 'ROLL-2026-0004',
      orderId: order2.id,
      orderItemId: order2Item.id,
      productionJobId: jobWeav.id,
      fabricType: fab2.name,
      color: 'Khaki Sand',
      lengthMeters: 500.0,
      weightKg: 144.0,
      qualityStatus: 'PENDING_INSPECTION',
      inventoryStatus: 'IN_PROCESS',
    },
  });

  // Order 3: Buyer 2 Order showing Material Shortage (Poly-cotton)
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-003',
      buyerId: buyer2.id,
      orderDate: new Date('2026-10-05'),
      requiredDeliveryDate: new Date('2026-11-05'),
      priority: 'HIGH',
      status: 'CONFIRMED',
      totalAmount: 345000.0,
      notes: 'Poly-Cotton corporate shirting order.',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order3.id,
      fabricProductId: fab3.id,
      color: 'Sky Blue Melange',
      requiredQuantity: 3000.0,
      unit: 'METERS',
      unitPrice: 115.0,
      totalPrice: 345000.0,
      producedQuantity: 0.0,
      passedQuantity: 0.0,
      reworkQuantity: 0.0,
      rejectedQuantity: 0.0,
      dispatchedQuantity: 0.0,
    },
  });

  // Purchase Request for Order 3 material shortage (needs 420kg, current stock is 95kg)
  const pr1 = await prisma.purchaseRequest.create({
    data: {
      requestNumber: 'PR-2026-001',
      yarnMaterialId: yarn3.id,
      orderId: order3.id,
      requestedQuantity: 500.0,
      requiredByDate: new Date('2026-10-15'),
      reason: 'Shortage for Order ORD-2026-003: required 432.6 KG, current available 95 KG.',
      status: 'PENDING',
    },
  });

  // Attendance Records for current month
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const sampleEmployees = [emp1, emp2, emp3, emp4, emp5];
  for (const emp of sampleEmployees) {
    await prisma.attendance.create({
      data: {
        employeeId: emp.id,
        date: new Date(`${dateStr}T08:00:00Z`),
        shiftId: shiftA.id,
        status: 'PRESENT',
        hoursWorked: 8.0,
        overtimeHours: emp.id === emp2.id ? 2.0 : 0.0,
        remarks: 'On time for standard shift.',
      },
    });
  }

  // Sample Expenses
  await prisma.expenseRecord.create({
    data: {
      expenseNumber: 'EXP-2026-001',
      category: 'ELECTRICITY_UTILITIES',
      amount: 45000.0,
      description: 'Factory power grid tariff for spinning & weaving halls',
      receiptReference: 'TANGEDCO-EB-882194',
    },
  });

  await prisma.expenseRecord.create({
    data: {
      expenseNumber: 'EXP-2026-002',
      category: 'DYEING_PROCESSING',
      amount: 18500.0,
      description: 'Reactive dyes & softeners batch for Order ORD-2026-001',
      orderId: order1.id,
      receiptReference: 'CHEM-INV-9901',
    },
  });

  // Sample Notifications
  await prisma.notification.create({
    data: {
      buyerId: buyer1.id,
      title: 'Order ORD-2026-001 Dispatched',
      message: 'Your order of 2,000 meters has been loaded and dispatched via AGT Global Cargo. Tracking: AGT-SEAFRT-99812',
      type: 'SUCCESS',
      link: '/buyer/dispatch',
    },
  });

  await prisma.notification.create({
    data: {
      title: 'Low Yarn Stock Alert',
      message: '30s Spun Polyester Yarn (YRN-PLY-30S) is at 95 KG, below minimum alert threshold of 200 KG.',
      type: 'WARNING',
      link: '/app/inventory',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
