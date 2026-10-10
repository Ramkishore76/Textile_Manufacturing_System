// Test login for all non-plant owner, non-production manager, non-quality manager dashboards

const accountsToTest = [
  // 1. Sales & Merchandising Dashboard
  {
    roleTitle: 'Sales Head',
    role: 'SALES',
    dashboard: '/app/orders',
    email: 'sales@agttextile.com',
    password: 'Sales@123',
  },
  {
    roleTitle: 'Merchandiser (New)',
    role: 'SALES',
    dashboard: '/app/orders',
    email: 'merchandiser@agttextile.com',
    password: 'Sales@123',
  },
  // 2. Store & Inventory Dashboard
  {
    roleTitle: 'Store Manager',
    role: 'STORE',
    dashboard: '/app/inventory',
    email: 'store@agttextile.com',
    password: 'Store@123',
  },
  {
    roleTitle: 'Inventory Lead (New)',
    role: 'STORE',
    dashboard: '/app/inventory',
    email: 'inventory@agttextile.com',
    password: 'Store@123',
  },
  // 3. Logistics & Dispatch Dashboard
  {
    roleTitle: 'Dispatch Supervisor',
    role: 'DISPATCH',
    dashboard: '/app/dispatch',
    email: 'dispatch@agttextile.com',
    password: 'Dispatch@123',
  },
  {
    roleTitle: 'Logistics Incharge (New)',
    role: 'DISPATCH',
    dashboard: '/app/dispatch',
    email: 'logistics@agttextile.com',
    password: 'Dispatch@123',
  },
  // 4. Finance & Accounts Dashboard
  {
    roleTitle: 'Finance/Accounts Head',
    role: 'ACCOUNTS',
    dashboard: '/app/accounts',
    email: 'accounts@agttextile.com',
    password: 'Accounts@123',
  },
  {
    roleTitle: 'Finance Officer (New)',
    role: 'ACCOUNTS',
    dashboard: '/app/accounts',
    email: 'finance@agttextile.com',
    password: 'Accounts@123',
  },
  // 5. Buyer Customer Portal Dashboard
  {
    roleTitle: 'Buyer Portal (Nordic Apparel)',
    role: 'BUYER',
    dashboard: '/buyer/dashboard',
    email: 'buyer@nordicapparel.com',
    password: 'Buyer@123',
  },
  {
    roleTitle: 'Buyer Portal (CasualLine)',
    role: 'BUYER',
    dashboard: '/buyer/dashboard',
    email: 'buyer@casualline.com',
    password: 'Buyer@123',
  },
];

async function testNonManagementLogins() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('Testing logins for all dashboards other than Plant Owner, Production Mgr, and Quality Mgr...\n');

  let allPassed = true;

  for (const acc of accountsToTest) {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });

      const data = await res.json();
      if (res.status === 200 && data.token && !data.requiresOtp) {
        console.log(`✅ [${acc.role}] ${acc.roleTitle}`);
        console.log(`   Email: ${acc.email} | Password: ${acc.password}`);
        console.log(`   Dashboard: ${data.redirectUrl || acc.dashboard}`);
        console.log(`   User Name: ${data.user?.name}\n`);
      } else {
        console.error(`❌ FAILED for ${acc.email}: Status ${res.status}, response:`, data);
        allPassed = false;
      }
    } catch (err) {
      console.error(`❌ ERROR for ${acc.email}:`, err.message);
      allPassed = false;
    }
  }

  if (!allPassed) {
    process.exit(1);
  }
  console.log('=======================================================');
  console.log('🎉 ALL 10 NON-MANAGEMENT USER LOGINS CONFIRMED WORKING!');
  console.log('=======================================================');
}

testNonManagementLogins();
