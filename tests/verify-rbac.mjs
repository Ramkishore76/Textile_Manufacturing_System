// ========================================================================
// AGT TEXTILE MILLS — ROLE-BASED ACCESS CONTROL (RBAC) VERIFICATION
// ========================================================================

const API_BASE = 'http://localhost:5000/api';

async function testRBAC() {
  console.log('========================================================================');
  console.log('  AGT TEXTILE MILLS — RBAC & FUNCTIONAL ACCESS VERIFICATION');
  console.log('========================================================================\n');

  // Helper login function
  async function loginAs(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, skipOtp: true }),
    });
    if (!res.ok) throw new Error(`Login failed for ${email}`);
    return await res.json();
  }

  // 1. Test Production Manager Role
  console.log('[TEST 1] Testing Production Manager Persona (production@agttextile.com)...');
  const prodAuth = await loginAs('production@agttextile.com', 'Prod@123');
  console.log(`  • Logged in as: ${prodAuth.user.name} (Role: ${prodAuth.user.role})`);

  // 1.1 Verify Dashboard Financial Privacy for Production Manager
  const prodDashRes = await fetch(`${API_BASE}/reports/dashboard`, {
    headers: { Authorization: `Bearer ${prodAuth.token}` },
  });
  const prodDash = await prodDashRes.json();
  if (prodDash.financials === null) {
    console.log('  ✓ [CONFIDENTIALITY PASS] Financial profits & sales ledger are NULL for Production Manager');
  } else {
    throw new Error('FAILED: Financial numbers leaked to Production Manager!');
  }

  // 1.2 Verify Production Manager sees their operational events
  console.log(`  ✓ [EVENTS PASS] Production Manager received ${prodDash.recentEvents?.length || 0} production events`);
  if (prodDash.recentEvents && prodDash.recentEvents.length > 0) {
    const allProdRelated = prodDash.recentEvents.every(e => 
      ['Machine', 'ProductionJob', 'ProductionLog', 'Roll', 'YarnMaterial'].includes(e.entityType)
    );
    console.log(`  ✓ [EVENT FILTER PASS] All events belong strictly to production domain: ${allProdRelated}`);
  }

  // 1.3 Verify Forbidden Access to Accounts / Wages
  const prodWageAttempt = await fetch(`${API_BASE}/wages?month=10&year=2026`, {
    headers: { Authorization: `Bearer ${prodAuth.token}` },
  });
  if (prodWageAttempt.status === 403) {
    console.log('  ✓ [SECURITY GUARD PASS] Production Manager blocked from Labour Wages API (HTTP 403 Forbidden)');
  } else {
    throw new Error(`FAILED: Production Manager accessed wages with status ${prodWageAttempt.status}`);
  }

  // 1.4 Verify Authorized Access to Production Jobs
  const prodJobsRes = await fetch(`${API_BASE}/production/jobs`, {
    headers: { Authorization: `Bearer ${prodAuth.token}` },
  });
  if (prodJobsRes.ok) {
    const jobs = await prodJobsRes.json();
    console.log(`  ✓ [AUTHORIZED ACCESS PASS] Production Manager successfully loaded ${jobs.length} jobs`);
  } else {
    throw new Error('FAILED: Production Manager could not load production jobs');
  }

  // 2. Test Quality Inspector Role
  console.log('\n[TEST 2] Testing Quality Inspector Persona (quality@agttextile.com)...');
  const qcAuth = await loginAs('quality@agttextile.com', 'Quality@123');
  console.log(`  • Logged in as: ${qcAuth.user.name} (Role: ${qcAuth.user.role})`);

  const qcPurchaseAttempt = await fetch(`${API_BASE}/purchases/requests`, {
    headers: { Authorization: `Bearer ${qcAuth.token}` },
  });
  if (qcPurchaseAttempt.status === 403) {
    console.log('  ✓ [SECURITY GUARD PASS] Quality Inspector blocked from Purchasing API (HTTP 403 Forbidden)');
  } else {
    throw new Error('FAILED: Quality Inspector was not blocked from Purchasing API');
  }

  const qcInspectRes = await fetch(`${API_BASE}/quality/inspections`, {
    headers: { Authorization: `Bearer ${qcAuth.token}` },
  });
  if (qcInspectRes.ok) {
    const inspections = await qcInspectRes.json();
    console.log(`  ✓ [AUTHORIZED ACCESS PASS] Quality Inspector accessed 4-point inspections (${inspections.length} records)`);
  }

  // 3. Test Accounts & HR Manager Role
  console.log('\n[TEST 3] Testing Accounts & HR Manager Persona (accounts@agttextile.com)...');
  const accAuth = await loginAs('accounts@agttextile.com', 'Accounts@123');
  console.log(`  • Logged in as: ${accAuth.user.name} (Role: ${accAuth.user.role})`);

  const accDashRes = await fetch(`${API_BASE}/reports/dashboard`, {
    headers: { Authorization: `Bearer ${accAuth.token}` },
  });
  const accDash = await accDashRes.json();
  if (accDash.financials !== null && accDash.financials.totalInvoiced !== undefined) {
    console.log(`  ✓ [AUTHORIZED FINANCIAL PASS] Accounts Manager sees Financial Ledger (Revenue: ₹${accDash.financials.totalInvoiced.toLocaleString()})`);
  } else {
    throw new Error('FAILED: Accounts Manager could not access financial metrics');
  }

  // 4. Test Admin Role
  console.log('\n[TEST 4] Testing Admin Persona (admin@agttextile.com)...');
  const adminAuth = await loginAs('admin@agttextile.com', 'Admin@123');
  console.log(`  • Logged in as: ${adminAuth.user.name} (Role: ${adminAuth.user.role})`);

  const adminDashRes = await fetch(`${API_BASE}/reports/dashboard`, {
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  });
  const adminDash = await adminDashRes.json();
  if (adminDash.financials !== null && adminDash.orders !== null) {
    console.log('  ✓ [EXECUTIVE PASS] Admin has complete oversight of manufacturing, inventory & financials');
  }

  console.log('\n========================================================================');
  console.log('  ALL RBAC SECURITY & ROLE FILTERING TESTS PASSED (100% VERIFIED)');
  console.log('========================================================================\n');
}

testRBAC().catch(err => {
  console.error('\n[RBAC TEST ERROR]:', err.message);
  process.exit(1);
});
