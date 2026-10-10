import { prisma } from '../db/prisma';

async function seedCleanOrders() {
  console.log('=== SEEDING CLEAN ACTIVE ORDERS FOR PRODUCTION ===\n');

  // Find base buyers
  const buyers = await prisma.buyer.findMany();
  if (buyers.length === 0) {
    throw new Error('No buyers found. Run seed first.');
  }

  // Find fabric products
  const products = await prisma.fabricProduct.findMany({
    orderBy: { code: 'asc' },
  });
  if (products.length < 2) {
    throw new Error('No products found.');
  }

  const buyer1 = buyers[0]; // Nordic Apparel Corp
  const buyer2 = buyers[1] || buyers[0]; // CasualLine Garments Ltd

  // Order 1: Material Allocated, ready for Production loom scheduling
  const poplin = products.find(p => p.code === 'FAB-COT-101') || products[0];
  const twill = products.find(p => p.code === 'FAB-COT-201') || products[1];

  const qty1 = 2000;
  const qty2 = 1200;
  const price1 = poplin.unitPricePerMeter;
  const price2 = twill.unitPricePerMeter;
  const subtotal1 = (qty1 * price1) + (qty2 * price2);
  const total1 = subtotal1 * 1.05;

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'PO-2026-101',
      buyerId: buyer1.id,
      orderDate: new Date(),
      requiredDeliveryDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      priority: 'HIGH',
      status: 'MATERIAL_ALLOCATED',
      totalAmount: total1,
      notes: 'Export shirting & chino order. Yarn cones allocated from warehouse.',
      items: {
        create: [
          {
            fabricProductId: poplin.id,
            requiredQuantity: qty1,
            color: 'Bleached White',
            unitPrice: price1,
            totalPrice: qty1 * price1,
            specifications: `${poplin.name} | ${poplin.gsm} GSM | ${poplin.widthInches}" | Bleached White`,
          },
          {
            fabricProductId: twill.id,
            requiredQuantity: qty2,
            color: 'Khaki Olive',
            unitPrice: price2,
            totalPrice: qty2 * price2,
            specifications: `${twill.name} | ${twill.gsm} GSM | ${twill.widthInches}" | Khaki Olive`,
          },
        ],
      },
    },
    include: { items: true },
  });

  console.log(`✓ Created Order #${order1.orderNumber} (${order1.status}) with ${order1.items.length} products for ${buyer1.companyName}`);

  // Order 2: Confirmed order
  const shirting = products.find(p => p.code === 'FAB-PLY-301') || products[0];
  const qty3 = 3500;
  const price3 = shirting.unitPricePerMeter;
  const subtotal2 = qty3 * price3;
  const total2 = subtotal2 * 1.05;

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'PO-2026-102',
      buyerId: buyer2.id,
      orderDate: new Date(),
      requiredDeliveryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      priority: 'NORMAL',
      status: 'CONFIRMED',
      totalAmount: total2,
      notes: 'Corporate uniform collection. Requires air-jet loom weaving.',
      items: {
        create: [
          {
            fabricProductId: shirting.id,
            requiredQuantity: qty3,
            color: 'Sky Blue',
            unitPrice: price3,
            totalPrice: qty3 * price3,
            specifications: `${shirting.name} | ${shirting.gsm} GSM | ${shirting.widthInches}" | Sky Blue`,
          },
        ],
      },
    },
    include: { items: true },
  });

  console.log(`✓ Created Order #${order2.orderNumber} (${order2.status}) with ${order2.items.length} product for ${buyer2.companyName}`);

  console.log('\n=== CLEAN ACTIVE ORDERS SUCCESSFULLY READY FOR PRODUCTION ===');
}

seedCleanOrders()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
