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

  // Test 2: Standard Login with Password (No OTP required for existing users)
  console.log('\n[STEP 2] Testing User Sign In (Direct Password Login without OTP)...');
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
  assert.ok(loginData.token, 'Direct login must return session JWT token immediately');
  assert.strictEqual(loginData.user.role, 'ADMIN', 'User role must match ADMIN');
  console.log(`  ✓ Direct Password Authentication Passed: ${loginData.user.name} (${loginData.user.role})`);

  // Test 3: New User Registration & Brevo Email OTP Dispatch
  console.log('\n[STEP 3] Testing New User Registration & Brevo Email OTP Dispatch...');
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
  assert.ok(regData.tempToken, 'Temporary verification token must be provided');
  assert.ok(regData.devOtp, 'Development OTP must be provided');
  console.log(`  ✓ Brevo Email OTP Dispatched to ${regData.maskedEmail} (Code: ${regData.devOtp})`);

  // Test 4: Invalid OTP Rejection Security Guard
  console.log('\n[STEP 4] Testing Invalid OTP Rejection Security Guard...');
  const badVerifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: newEmail,
      otp: '000000', // incorrect
      tempToken: regData.tempToken,
    }),
  });
  assert.strictEqual(badVerifyRes.status, 400, 'Incorrect OTP must be rejected with 400');
  console.log('  ✓ Incorrect OTP successfully rejected with error 400');

  // Test 5: Valid OTP Verification & Account Activation
  console.log('\n[STEP 5] Testing 6-Digit OTP Verification & New Account Activation...');
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
