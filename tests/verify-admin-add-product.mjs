// ========================================================================
// AGT TEXTILE MILLS — ADMIN ADD NEW PRODUCT VERIFICATION TEST
// ========================================================================

const API_BASE = 'http://localhost:5000/api';

async function runTest() {
  console.log('========================================================================');
  console.log('  AGT TEXTILE MILLS — ADMIN PRODUCT CREATION & PUBLISHING VERIFICATION');
  console.log('========================================================================\n');

  // Helper login function
  async function loginAs(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, skipOtp: true }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(err)}`);
    }
    return await res.json();
  }

  // STEP 1: Admin Login
  console.log('[STEP 1] Logging in as Admin (Plant Owner: admin@agttextile.com)...');
  const adminAuth = await loginAs('admin@agttextile.com', 'Admin@123');
  console.log(`  ✓ Logged in as: ${adminAuth.user.name} (Role: ${adminAuth.user.role})`);

  // STEP 2: Fetch available mill yarns for BOM configuration
  console.log('\n[STEP 2] Fetching Mill Yarns for BOM linking...');
  const yarnsRes = await fetch(`${API_BASE}/buyer-portal/yarns`, {
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  });
  if (!yarnsRes.ok) throw new Error(`Failed to fetch yarns: ${yarnsRes.status}`);
  const yarns = await yarnsRes.json();
  console.log(`  ✓ Retrieved ${yarns.length} yarn materials available in inventory`);
  const selectedYarn = yarns[0];
  console.log(`  • Selected yarn for initial BOM: ${selectedYarn.name} (${selectedYarn.code}, ${selectedYarn.count})`);

  // STEP 3: Generate unique test product code
  const testProductCode = `FAB-TEST-${Date.now().toString().slice(-4)}`;
  const newProductPayload = {
    code: testProductCode,
    name: 'Export Combed Cotton Oxford 50s',
    fabricType: 'Oxford Cotton',
    gsm: 175,
    widthInches: 58,
    weaveType: 'Oxford Weave',
    unitPricePerMeter: 195.5,
    requiresSpinning: true,
    description: 'Export-grade high-thread-count combed cotton weave for luxury executive apparel. Pre-shrunk.',
    yarnMaterialId: selectedYarn?.id,
    yarnQuantityPerMeter: 0.185,
    wastagePercentage: 3.5,
  };

  console.log(`\n[STEP 3] Admin creating new fabric product "${newProductPayload.name}" (${newProductPayload.code})...`);
  const createRes = await fetch(`${API_BASE}/buyer-portal/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminAuth.token}`,
    },
    body: JSON.stringify(newProductPayload),
  });

  if (createRes.status !== 201) {
    const errorBody = await createRes.json();
    throw new Error(`Failed to create product: HTTP ${createRes.status} — ${JSON.stringify(errorBody)}`);
  }

  const createdData = await createRes.json();
  console.log(`  ✓ HTTP 201 Created: "${createdData.product?.name}" published!`);
  console.log(`  • Unit Price: ₹${createdData.product?.unitPricePerMeter}/m`);
  console.log(`  • Initial BOM linked: ${createdData.product?.boms?.length > 0 ? 'YES' : 'NO'}`);

  // STEP 4: Verify Duplicate Code Prevention (409 Conflict)
  console.log('\n[STEP 4] Testing duplicate code collision guard...');
  const dupRes = await fetch(`${API_BASE}/buyer-portal/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminAuth.token}`,
    },
    body: JSON.stringify(newProductPayload),
  });
  if (dupRes.status === 409) {
    console.log(`  ✓ Duplicate protection passed: HTTP 409 Conflict returned as expected.`);
  } else {
    throw new Error(`Expected HTTP 409 Conflict but received ${dupRes.status}`);
  }

  // STEP 5: Verify RBAC - Non-Admin (Buyer) Forbidden
  console.log('\n[STEP 5] Testing RBAC Security: Verifying Buyer cannot create products...');
  const buyerAuth = await loginAs('buyer@nordicapparel.com', 'Buyer@123');
  console.log(`  • Logged in as: ${buyerAuth.user.name} (Role: ${buyerAuth.user.role})`);

  const buyerCreateAttempt = await fetch(`${API_BASE}/buyer-portal/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${buyerAuth.token}`,
    },
    body: JSON.stringify({
      code: 'FAB-HACK',
      name: 'Unauthorized Fabric',
      fabricType: 'Silk',
      gsm: 100,
      widthInches: 44,
      weaveType: 'Plain',
      unitPricePerMeter: 50,
    }),
  });

  if (buyerCreateAttempt.status === 403) {
    console.log('  ✓ Security pass: Buyer blocked from product creation (HTTP 403 Forbidden).');
  } else {
    throw new Error(`Security breach: Buyer created product with status ${buyerCreateAttempt.status}`);
  }

  // STEP 6: Verify Product Appears in Public / Buyer Catalog
  console.log('\n[STEP 6] Verifying product appears in catalog for buyer...');
  const catalogRes = await fetch(`${API_BASE}/buyer-portal/products`, {
    headers: { Authorization: `Bearer ${buyerAuth.token}` },
  });
  const catalog = await catalogRes.json();
  const found = catalog.find((p) => p.code === testProductCode);
  if (!found) {
    throw new Error(`Newly created product ${testProductCode} not found in catalog listing!`);
  }
  console.log(`  ✓ Found in catalog: ${found.name} (${found.code}) @ ₹${found.unitPricePerMeter}/m`);

  // STEP 7: Verify Buyer Can Immediately Place Order For This Product
  console.log('\n[STEP 7] Verifying Buyer can place an order for the newly created product...');
  const orderRes = await fetch(`${API_BASE}/buyer-portal/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${buyerAuth.token}`,
    },
    body: JSON.stringify({
      fabricProductId: found.id,
      requiredQuantity: 1200,
      color: 'Oxford Sky Blue',
      requiredDeliveryDate: '2026-11-15',
      priority: 'NORMAL',
      notes: 'Test order for newly created product.',
    }),
  });

  if (!orderRes.ok) {
    const err = await orderRes.json();
    throw new Error(`Buyer failed to order new product: ${JSON.stringify(err)}`);
  }

  const orderData = await orderRes.json();
  console.log(`  ✓ Purchase Order #${orderData.orderNumber} placed successfully!`);
  console.log(`  • Ordered: ${orderData.order?.requiredQuantity || 1200} meters`);
  console.log(`  • Total Amount: ₹${orderData.totalAmount}`);

  console.log('\n========================================================================');
  console.log('  ALL TESTS PASSED: Admin product creation feature verified completely!');
  console.log('========================================================================\n');
}

runTest().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
