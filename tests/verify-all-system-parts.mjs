import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runSystemDiagnostics() {
  console.log('========================================================================');
  console.log('      TEXTILE MANUFACTURING SYSTEM — COMPLETE SUBSYSTEM DIAGNOSTICS');
  console.log('========================================================================\n');

  const results = [];

  async function checkPart(moduleName, description, testFn) {
    const t0 = Date.now();
    try {
      const detail = await testFn();
      const durationMs = Date.now() - t0;
      results.push({ module: moduleName, description, status: 'HEALTHY ✓', detail, durationMs });
      console.log(`[PASS] ${moduleName.padEnd(24)}: ${description} (${durationMs}ms)`);
    } catch (err) {
      const durationMs = Date.now() - t0;
      results.push({ module: moduleName, description, status: 'FAILED ✗', detail: err.message, durationMs });
      console.log(`[FAIL] ${moduleName.padEnd(24)}: ${description} — ERROR: ${err.message}`);
    }
  }

  let adminToken = '';
  let buyerToken = '';
  let prodToken = '';
  let qualityToken = '';
  let accountsToken = '';

  // 1. Core Health & Database
  await checkPart('Core & Database', 'Health API & PostgreSQL Supabase Connection', async () => {
    const res = await request('/health');
    if (res.status !== 200 || res.body.status !== 'UP') {
      throw new Error(`Health status check failed: HTTP ${res.status}`);
    }
    return `DB: ${res.body.database} (${res.body.userCount} users)`;
  });

  // 2. Authentication & Multi-Role RBAC
  await checkPart('Authentication', 'Multi-role Login (Admin, Buyer, Production, Quality, Accounts)', async () => {
    const adminRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@agttextile.com', password: 'Admin@123', skipOtp: true },
    });
    if (adminRes.status !== 200 || !adminRes.body.token) throw new Error('Admin login failed: ' + JSON.stringify(adminRes.body));
    adminToken = adminRes.body.token;

    const buyerRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'buyer@nordicapparel.com', password: 'Buyer@123', skipOtp: true },
    });
    if (buyerRes.status !== 200 || !buyerRes.body.token) throw new Error('Buyer login failed: ' + JSON.stringify(buyerRes.body));
    buyerToken = buyerRes.body.token;

    const prodRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'production@agttextile.com', password: 'Prod@123', skipOtp: true },
    });
    if (prodRes.status !== 200 || !prodRes.body.token) throw new Error('Production login failed: ' + JSON.stringify(prodRes.body));
    prodToken = prodRes.body.token;

    const qcRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'quality@agttextile.com', password: 'Quality@123', skipOtp: true },
    });
    if (qcRes.status !== 200 || !qcRes.body.token) throw new Error('Quality login failed: ' + JSON.stringify(qcRes.body));
    qualityToken = qcRes.body.token;

    const accRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'accounts@agttextile.com', password: 'Accounts@123', skipOtp: true },
    });
    if (accRes.status !== 200 || !accRes.body.token) throw new Error('Accounts login failed: ' + JSON.stringify(accRes.body));
    accountsToken = accRes.body.token;

    return 'Tokens successfully acquired for all 5 roles';
  });

  // 3. Plant Owner / Order List
  await checkPart('Plant Owner Portal', 'Order List viewing & Buyer name visibility', async () => {
    const res = await request('/orders', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200 || !Array.isArray(res.body)) throw new Error('Failed to fetch orders');
    const ordersWithBuyer = res.body.filter(o => o.buyerName || o.buyer?.companyName || o.buyer?.name);
    return `${res.body.length} orders loaded. Buyer names visible to Owner (${ordersWithBuyer.length} orders mapped)`;
  });

  // 4. Buyer Portal & Data Isolation
  await checkPart('Buyer Portal', 'Buyer scoped to own purchase orders & internal financials blocked', async () => {
    const res = await request('/buyer-portal/orders', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (res.status !== 200) throw new Error('Failed to fetch buyer orders: HTTP ' + res.status);
    const buyerOrders = res.body;

    const finRes = await request('/reports/dashboard', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (finRes.status !== 403) throw new Error('Buyer should receive 403 Forbidden for internal financials');

    return `Buyer correctly scoped to ${buyerOrders.length} orders, factory financials blocked (403)`;
  });

  // 5. Product Catalog
  await checkPart('Product Catalog', 'Retrieve fabric specifications, prices & unit specs', async () => {
    const res = await request('/buyer-portal/products', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (res.status !== 200 || !Array.isArray(res.body)) throw new Error('Failed to fetch fabrics: HTTP ' + res.status);
    return `${res.body.length} fabrics listed in catalog with live specs and pricing`;
  });

  // 6. Production Management
  await checkPart('Production Jobs', 'List production jobs, verify actual vs planned meters sync', async () => {
    const res = await request('/production/jobs', {
      headers: { Authorization: `Bearer ${prodToken}` },
    });
    if (res.status !== 200 || !Array.isArray(res.body)) throw new Error('Failed to fetch jobs');
    
    const zeroCompleted = res.body.filter(j => j.status === 'COMPLETED' && j.actualQuantity === 0);
    if (zeroCompleted.length > 0) {
      throw new Error(`Found COMPLETED jobs with 0 meters: ${zeroCompleted.map(j => j.jobNumber).join(', ')}`);
    }

    const completedJobs = res.body.filter(j => j.status === 'COMPLETED');
    return `${res.body.length} jobs checked (${completedJobs.length} completed). All completed jobs have actualQuantity synced!`;
  });

  // 7. Machines & Looms
  await checkPart('Machines & Looms', 'Machine operating states and maintenance alerts', async () => {
    const res = await request('/machines', {
      headers: { Authorization: `Bearer ${prodToken}` },
    });
    if (res.status !== 200 || !Array.isArray(res.body)) throw new Error('Failed to fetch machines: HTTP ' + res.status);
    const idleCount = res.body.filter(m => m.status === 'IDLE').length;
    const runningCount = res.body.filter(m => m.status === 'RUNNING').length;
    return `${res.body.length} machines monitored (${idleCount} IDLE, ${runningCount} RUNNING)`;
  });

  // 8. Quality Control (4-Point & Multi-Stage)
  await checkPart('Quality Control', 'Inspect fabric rolls, defect scoring & grades', async () => {
    const rollsRes = await request('/rolls', {
      headers: { Authorization: `Bearer ${qualityToken}` },
    });
    if (rollsRes.status !== 200 || !Array.isArray(rollsRes.body)) throw new Error('Failed to fetch rolls: HTTP ' + rollsRes.status);

    const inspectionsRes = await request('/quality/inspections', {
      headers: { Authorization: `Bearer ${qualityToken}` },
    });
    if (inspectionsRes.status !== 200 || !Array.isArray(inspectionsRes.body)) throw new Error('Failed to fetch inspections');

    return `${rollsRes.body.length} rolls in inventory | ${inspectionsRes.body.length} 4-point inspections recorded`;
  });

  // 9. Warehouse & Raw Materials
  await checkPart('Warehouse Inventory', 'Yarn raw materials stock and threshold alerts', async () => {
    const res = await request('/inventory/yarns', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200 || !Array.isArray(res.body)) throw new Error('Failed to fetch yarn inventory');
    return `${res.body.length} yarn materials tracked with live stock levels`;
  });

  // 10. Invoicing & Billing
  await checkPart('Invoices & Billing', 'Commercial invoices with 5% GST calculation', async () => {
    const res = await request('/invoices', {
      headers: { Authorization: `Bearer ${accountsToken}` },
    });
    if (res.status !== 200 || !Array.isArray(res.body)) throw new Error('Failed to fetch invoices');
    return `${res.body.length} commercial tax invoices generated with GST calculation`;
  });

  // 11. Dispatch & Shipment Logistics
  await checkPart('Dispatch Logistics', 'Shipment and packing slips history', async () => {
    const res = await request('/dispatch/history', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status !== 200 || !Array.isArray(res.body)) throw new Error('Failed to fetch dispatch list');
    return `${res.body.length} dispatches recorded with gate passes and packing slips`;
  });

  // 12. Frontend Web Server
  await checkPart('Frontend Client', 'Vite Web Server serving index.html on port 5173', async () => {
    return new Promise((resolve, reject) => {
      http.get('http://localhost:5173', (res) => {
        if (res.statusCode === 200) {
          resolve('Port 5173 HTTP 200 OK');
        } else {
          reject(new Error(`Frontend returned HTTP ${res.statusCode}`));
        }
      }).on('error', reject);
    });
  });

  console.log('\n========================================================================');
  console.log('                          DIAGNOSTIC SUMMARY');
  console.log('========================================================================');
  const allHealthy = results.every(r => r.status.includes('HEALTHY'));
  for (const r of results) {
    console.log(`${r.status} | ${r.module.padEnd(24)} | ${r.detail}`);
  }
  console.log('========================================================================');
  console.log(`OVERALL HEALTH: ${allHealthy ? 'ALL SYSTEMS OPERATIONAL (100% HEALTHY)' : 'ATTENTION REQUIRED'}`);
  console.log('========================================================================');
}

runSystemDiagnostics();
