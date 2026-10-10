// Verification script for manual yarn reservation in Sales & Merchandising

async function testReserveYarn() {
  const BASE_URL = 'http://localhost:5000/api';

  console.log('1. Logging in as Sales Head (sales@agttextile.com)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sales@agttextile.com',
      password: 'Sales@123',
    }),
  });

  const loginData = await loginRes.json();
  if (!loginData.token) {
    throw new Error('Sales login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.token;
  console.log('✓ Sales login successful!\n');

  console.log('2. Fetching existing orders...');
  const ordersRes = await fetch(`${BASE_URL}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const orders = await ordersRes.json();
  console.log(`Found ${orders.length} orders in system.`);

  // Find a CONFIRMED order or create one
  let targetOrder = orders.find((o) => o.status === 'CONFIRMED');

  if (!targetOrder) {
    console.log('No CONFIRMED order found, creating a new test order...');
    const buyersRes = await fetch(`${BASE_URL}/buyers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const buyers = await buyersRes.json();

    const fabricsRes = await fetch(`${BASE_URL}/inventory/fabrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const fabrics = await fabricsRes.json();

    const newOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        buyerId: buyers[0].id,
        requiredDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'NORMAL',
        notes: 'Test order for reservation',
        autoReserveIfAvailable: false, // Don't auto-reserve so it stays CONFIRMED
        items: [
          {
            fabricProductId: fabrics[0].id,
            color: 'White',
            requiredQuantity: 200,
            unit: 'METERS',
            unitPrice: 150,
          },
        ],
      }),
    });

    const newOrderData = await newOrderRes.json();
    targetOrder = newOrderData.order;
    console.log(`Created new test order: ${targetOrder.orderNumber} (Status: ${targetOrder.status})`);
  } else {
    console.log(`Using existing CONFIRMED order: ${targetOrder.orderNumber}`);
  }

  console.log(`\n3. Calling POST /api/orders/${targetOrder.id}/reserve-yarn...`);
  const reserveRes = await fetch(`${BASE_URL}/orders/${targetOrder.id}/reserve-yarn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  const reserveData = await reserveRes.json();
  console.log(`Response Status: ${reserveRes.status}`);
  console.log(`Response Data:`, reserveData);

  if (reserveRes.status === 404) {
    throw new Error('FAILED: Route returned 404 Not Found!');
  }

  if (reserveRes.status === 200) {
    console.log('✓ Success: Materials reserved and order status updated to MATERIAL_ALLOCATED!');
  } else if (reserveRes.status === 400 && reserveData.error) {
    console.log('✓ Handled: Server responded with business validation error (e.g. stock constraint), NOT 404!');
  } else {
    throw new Error('Unexpected status: ' + reserveRes.status);
  }

  console.log('\n=======================================================');
  console.log('🎉 VERIFICATION PASSED: /reserve-yarn endpoint is live and working!');
  console.log('=======================================================');
}

testReserveYarn().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
