import assert from 'node:assert';

console.log('========================================================================');
console.log('  BREVO EMAIL TRANSACTIONAL VERIFICATION SUITE — AGT TEXTILE MILLS');
console.log('========================================================================\n');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  // Test 1: Health check
  console.log('[STEP 1] Testing Server Health & Brevo Integration...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  assert.strictEqual(healthRes.status, 200, 'Health check must return 200');
  const health = await healthRes.json();
  console.log(`  ✓ System Health UP: ${health.database}`);

  // Test 2: Standard Login with Brevo OTP dispatch
  console.log('\n[STEP 2] Testing User Sign In (Brevo 2FA OTP Dispatch)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@agttextile.com',
      password: 'Admin@123',
    }),
  });
  assert.strictEqual(loginRes.status, 200, 'Login credentials must be accepted');
  const loginData = await loginRes.json();
  assert.strictEqual(loginData.requiresOtp, true, 'Login must require OTP');
  assert.ok(loginData.tempToken, 'Temporary token must be returned');
  assert.ok(loginData.devOtp, 'Development OTP must be provided');
  console.log(`  ✓ Brevo Email OTP Dispatched to ${loginData.maskedEmail} (Code: ${loginData.devOtp})`);

  // Test 3: OTP Verification
  console.log('\n[STEP 3] Testing 6-Digit OTP Verification & JWT Issuance...');
  const verifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: loginData.email,
      otp: loginData.devOtp,
      tempToken: loginData.tempToken,
    }),
  });
  assert.strictEqual(verifyRes.status, 200, 'Valid OTP must authenticate user');
  const verifyData = await verifyRes.json();
  assert.ok(verifyData.token, 'Session JWT token must be issued');
  assert.strictEqual(verifyData.user.role, 'ADMIN', 'User role must match ADMIN');
  console.log(`  ✓ Authenticated as ${verifyData.user.name} (${verifyData.user.role}) -> ${verifyData.redirectUrl}`);

  // Test 4: Invalid OTP Rejection
  console.log('\n[STEP 4] Testing Invalid OTP Rejection Security Guard...');
  // Trigger fresh login
  const reLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sales@agttextile.com',
      password: 'Sales@123',
    }),
  });
  const reLoginData = await reLoginRes.json();
  const badVerifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: reLoginData.email,
      otp: '000000', // incorrect
      tempToken: reLoginData.tempToken,
    }),
  });
  assert.strictEqual(badVerifyRes.status, 400, 'Incorrect OTP must be rejected with 400');
  console.log('  ✓ Incorrect OTP successfully rejected with error 400');

  // Test 5: New User Registration & Email Verification
  console.log('\n[STEP 5] Testing New User Registration & Verification with Brevo...');
  const newEmail = `user_${Date.now()}@agttextile.com`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ananya Krishnan (Quality Lead)',
      email: newEmail,
      password: 'SecurePassword@2026',
      role: 'QUALITY',
      phone: '+91 98422 99988',
    }),
  });
  assert.strictEqual(regRes.status, 201, 'Registration must return 201 Created');
  const regData = await regRes.json();
  assert.strictEqual(regData.requiresOtp, true, 'New registration must require email OTP');
  console.log(`  ✓ New User registered: ${newEmail} (Brevo OTP: ${regData.devOtp})`);

  // Verify new user registration
  const regVerifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: newEmail,
      otp: regData.devOtp,
      tempToken: regData.tempToken,
    }),
  });
  assert.strictEqual(regVerifyRes.status, 201, 'New user OTP verification must succeed with 201');
  const regVerifyData = await regVerifyRes.json();
  assert.ok(regVerifyData.token, 'New user must receive JWT token');
  assert.strictEqual(regVerifyData.user.role, 'QUALITY', 'New user role must match QUALITY');
  console.log(`  ✓ New User Account Activated in Supabase: ${regVerifyData.user.name} (${regVerifyData.user.role})`);

  console.log('\n========================================================================');
  console.log('  ALL BREVO EMAIL AUTHENTICATION & VERIFICATION TESTS PASSED (100%)');
  console.log('========================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
