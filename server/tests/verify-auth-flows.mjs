// Test script to verify direct password login, new user OTP email verification, and forgot password OTP flow

async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';

  console.log('--- TEST 1: Direct Password Login (No OTP Required) ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@agttextile.com',
      password: 'Admin@123',
    }),
  });

  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  console.log('Requires OTP?:', loginData.requiresOtp || false);
  console.log('Has Token?:', !!loginData.token);
  console.log('User Role:', loginData.user?.role);

  if (loginRes.status !== 200 || !loginData.token || loginData.requiresOtp) {
    throw new Error('TEST 1 FAILED: Standard login must succeed directly with token without requiring OTP!');
  }
  console.log('✓ TEST 1 PASSED: Direct login works with email and password, no OTP asked.\n');

  console.log('--- TEST 2: Invalid Password Rejection ---');
  const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@agttextile.com',
      password: 'WrongPassword!456',
    }),
  });
  console.log('Bad Login Status:', badLoginRes.status);
  if (badLoginRes.status !== 401) {
    throw new Error('TEST 2 FAILED: Expected 401 for wrong password!');
  }
  console.log('✓ TEST 2 PASSED: Bad credentials properly rejected with 401.\n');

  console.log('--- TEST 3: New User Registration (Must Require OTP Email Verification) ---');
  const testEmail = `test_user_${Date.now()}@agttextile.com`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Onboarding User',
      email: testEmail,
      password: 'TestUser@123',
      role: 'STORE',
      phone: '+91 98400 12345',
    }),
  });

  const regData = await regRes.json();
  console.log('Register Status:', regRes.status);
  console.log('Requires OTP?:', regData.requiresOtp);
  console.log('Has TempToken?:', !!regData.tempToken);
  console.log('Dev OTP Code:', regData.devOtp);

  if (regRes.status !== 201 || !regData.requiresOtp || !regData.tempToken || !regData.devOtp) {
    throw new Error('TEST 3 FAILED: Registration must require email OTP verification!');
  }
  console.log('✓ TEST 3 PASSED: New user registration dispatched email OTP code.\n');

  console.log('--- TEST 4: Verify OTP for New User Registration ---');
  const verifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: regData.devOtp,
      tempToken: regData.tempToken,
    }),
  });

  const verifyData = await verifyRes.json();
  console.log('Verify Status:', verifyRes.status);
  console.log('Has Token?:', !!verifyData.token);
  console.log('User Registered Name:', verifyData.user?.name);

  if (verifyRes.status !== 201 || !verifyData.token) {
    throw new Error('TEST 4 FAILED: OTP verification failed to activate user!');
  }
  console.log('✓ TEST 4 PASSED: New user verified via OTP and logged in.\n');

  console.log('--- TEST 5: Direct Login for Newly Created User ---');
  const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'TestUser@123',
    }),
  });

  const newLoginData = await newLoginRes.json();
  console.log('New User Direct Login Status:', newLoginRes.status);
  console.log('Requires OTP?:', newLoginData.requiresOtp || false);
  console.log('Has Token?:', !!newLoginData.token);

  if (newLoginRes.status !== 200 || !newLoginData.token || newLoginData.requiresOtp) {
    throw new Error('TEST 5 FAILED: Subsequent login for verified user must not ask OTP!');
  }
  console.log('✓ TEST 5 PASSED: Subsequent login for user works directly with password.\n');

  console.log('--- TEST 6: Forgot Password Request (Must Require OTP Email Verification) ---');
  const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
    }),
  });

  const forgotData = await forgotRes.json();
  console.log('Forgot Password Status:', forgotRes.status);
  console.log('Requires OTP?:', forgotData.requiresOtp);
  console.log('Has TempToken?:', !!forgotData.tempToken);
  console.log('Dev OTP Code:', forgotData.devOtp);

  if (forgotRes.status !== 200 || !forgotData.requiresOtp || !forgotData.tempToken || !forgotData.devOtp) {
    throw new Error('TEST 6 FAILED: Forgot password must dispatch OTP email!');
  }
  console.log('✓ TEST 6 PASSED: Forgot password requested and OTP dispatched.\n');

  console.log('--- TEST 7: Reset Password with OTP Code ---');
  const newSecretPass = 'BrandNewSecret@456';
  const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: forgotData.devOtp,
      tempToken: forgotData.tempToken,
      newPassword: newSecretPass,
    }),
  });

  const resetData = await resetRes.json();
  console.log('Reset Password Status:', resetRes.status);
  console.log('Has Session Token?:', !!resetData.token);
  console.log('Message:', resetData.message);

  if (resetRes.status !== 200 || !resetData.token) {
    throw new Error('TEST 7 FAILED: Password reset failed!');
  }
  console.log('✓ TEST 7 PASSED: Password reset succeeded with email OTP code.\n');

  console.log('--- TEST 8: Direct Login with Newly Reset Password ---');
  const resetLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: newSecretPass,
    }),
  });

  const resetLoginData = await resetLoginRes.json();
  console.log('Reset Login Status:', resetLoginRes.status);
  console.log('Requires OTP?:', resetLoginData.requiresOtp || false);
  console.log('Has Token?:', !!resetLoginData.token);

  if (resetLoginRes.status !== 200 || !resetLoginData.token || resetLoginData.requiresOtp) {
    throw new Error('TEST 8 FAILED: Direct login with new reset password failed!');
  }
  console.log('✓ TEST 8 PASSED: Login with reset password works directly, no OTP asked.\n');

  console.log('=======================================================');
  console.log('🎉 ALL 8 AUTHENTICATION INTEGRATION TESTS PASSED!');
  console.log('=======================================================');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
