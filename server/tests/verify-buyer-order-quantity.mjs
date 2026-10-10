// Verification script for buyer order with custom quantities like 500 meters

async function testBuyerOrderQuantities() {
  const BASE_URL = 'http://localhost:5000/api';

  console.log('1. Logging in as Buyer (buyer@nordicapparel.com)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'buyer@nordicapparel.com',
      password: 'Buyer@123',
    }),
  });

  const loginData = await loginRes.json();
  if (!loginData.token) {
    throw new Error('Buyer login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.token;
  console.log('✓ Buyer login successful!\n');

  console.log('2. Fetching products from buyer portal...');
  const prodRes = await fetch(`${BASE_URL}/buyer-portal/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const products = await prodRes.json();
  console.log(`Found ${products.length} products.`);
  const product = products[0];

  const quantitiesToTest = [500, 250, 100, 15, 750];

  for (const qty of quantitiesToTest) {
    console.log(`\n3. Placing buyer order for ${qty} meters of ${product.name}...`);
    const orderRes = await fetch(`${BASE_URL}/buyer-portal/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fabricProductId: product.id,
        requiredQuantity: qty,
        color: 'Pure White',
        requiredDeliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'NORMAL',
        notes: `Buyer custom need of ${qty} meters`,
      }),
    });

    const orderData = await orderRes.json();
    if (orderRes.status === 201 || orderRes.status === 200) {
      console.log(`✅ Order booked successfully: #${orderData.orderNumber} for ${qty}m | Total: ₹${orderData.totalAmount}`);
    } else {
      throw new Error(`Failed to book order for ${qty}m: ${JSON.stringify(orderData)}`);
    }
  }

  console.log('\n=======================================================');
  console.log('🎉 VERIFICATION PASSED: Buyer can order any required meters (500m, 250m, 100m, etc.) without restriction!');
  console.log('=======================================================');
}

testBuyerOrderQuantities().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
