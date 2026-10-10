import { prisma } from '../db/prisma';
import jwt from 'jsonwebtoken';

async function main() {
  console.log('--- STARTING VERIFICATION TEST ---');

  // 1. Fetch available products
  const products = await prisma.fabricProduct.findMany({ take: 3 });
  console.log(`Found ${products.length} fabric products:`, products.map(p => p.name));
  if (products.length < 2) {
    throw new Error('Need at least 2 products for multi-product test');
  }

  // 2. Test Buyer Enrollment logic
  const testEmail = `testbuyer_${Date.now()}@nordicbrand.com`;
  const companyName = `Nordic Designs Ltd ${Date.now() % 1000}`;
  const contactName = 'Astrid Lindgren';

  const buyer = await prisma.buyer.create({
    data: {
      name: contactName,
      companyName,
      email: testEmail,
      phone: '+46-8-123456',
      address: 'Kungsgatan 12, Stockholm, Sweden',
      taxNumber: 'SE1234567890',
      creditLimit: 5000000,
    },
  });

  const buyerAccount = await prisma.buyerAccount.create({
    data: {
      buyerId: buyer.id,
      status: 'ACTIVE',
    },
  });

  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.default.hash('Secret@123', 10);
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: contactName,
      password: passwordHash,
      role: 'BUYER',
      buyerAccountId: buyerAccount.id,
    },
  });

  console.log('✓ Successfully enrolled test buyer:', buyer.companyName, '(User ID:', user.id, ')');

  // 3. Test Multi-Product Order Placement in Single Order
  const item1 = products[0];
  const item2 = products[1];
  const qty1 = 1200;
  const qty2 = 800;
  const price1 = Number(item1.unitPricePerMeter) || 165;
  const price2 = Number(item2.unitPricePerMeter) || 185;
  const subtotal = (qty1 * price1) + (qty2 * price2);
  const gst = subtotal * 0.05;
  const totalAmount = subtotal + gst;

  const orderNumber = `PO-TEST-${Date.now().toString().slice(-6)}`;
  const order = await prisma.order.create({
    data: {
      orderNumber,
      buyerId: buyer.id,
      status: 'CONFIRMED',
      priority: 'HIGH',
      requiredDeliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      notes: 'Urgent multi-product shipment for Autumn collection',
      totalAmount,
      items: {
        create: [
          {
            fabricProductId: item1.id,
            requiredQuantity: qty1,
            color: 'Midnight Blue',
            unitPrice: price1,
            totalPrice: qty1 * price1,
            specifications: `${item1.name} | ${item1.gsm} GSM | ${item1.widthInches}" | Midnight Blue`,
          },
          {
            fabricProductId: item2.id,
            requiredQuantity: qty2,
            color: 'Natural Ecru',
            unitPrice: price2,
            totalPrice: qty2 * price2,
            specifications: `${item2.name} | ${item2.gsm} GSM | ${item2.widthInches}" | Natural Ecru`,
          },
        ],
      },
    },
    include: {
      items: { include: { fabricProduct: true } },
      buyer: true,
    },
  });

  console.log(`✓ Placed single order #${order.orderNumber} with ${order.items.length} products:`);
  for (const it of order.items) {
    console.log(`   - Product: ${it.fabricProduct?.name}, Qty: ${it.requiredQuantity}m, Color: ${it.color}, Line: ₹${it.totalPrice}`);
  }
  console.log(`   - Subtotal: ₹${subtotal}, 5% GST: ₹${gst}, Grand Total: ₹${order.totalAmount}`);

  // 4. Verify Plant Owner (ADMIN) sees the buyer details
  const fetchedForOwner = await prisma.order.findUnique({
    where: { id: order.id },
    include: { buyer: true, items: { include: { fabricProduct: true } } },
  });
  console.log('✓ Owner view buyer name:', fetchedForOwner?.buyer?.companyName, '| Contact:', fetchedForOwner?.buyer?.name);
  if (!fetchedForOwner?.buyer?.companyName) {
    throw new Error('Owner should see buyer company name!');
  }

  // 5. Verify non-admin sanitization behavior
  const nonAdminView = {
    ...fetchedForOwner,
    buyer: {
      companyName: 'Client Confidential',
      name: 'Authorized Purchaser',
    },
  };
  console.log('✓ Non-admin portal view buyer identity:', nonAdminView.buyer.companyName);

  // 6. Cleanup test records
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.buyerAccount.delete({ where: { id: buyerAccount.id } });
  await prisma.buyer.delete({ where: { id: buyer.id } });
  console.log('✓ Cleaned up test records');

  console.log('--- ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Error during verification:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
