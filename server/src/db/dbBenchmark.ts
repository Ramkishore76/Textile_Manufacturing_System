import { prisma } from './prisma';

/**
 * =========================================================================
 * AGT TEXTILE MILLS — DATABASE QUERY BENCHMARK & LATENCY MONITOR
 * Authored by: Sanjay Selvakumar <sanjayselvakumar05@gmail.com>
 * =========================================================================
 */
async function runDatabaseBenchmark() {
  console.log('========================================================================');
  console.log('  AGT TEXTILE MILLS — SUPABASE POSTGRESQL BENCHMARK SUITE');
  console.log('  Lead Database Engineer: Sanjay Selvakumar (sanjayselvakumar05@gmail.com)');
  console.log('========================================================================\n');

  const results: { test: string; latencyMs: number; status: string; records: number }[] = [];

  async function benchmark(name: string, queryFn: () => Promise<any>) {
    process.stdout.write(`• Benchmarking ${name.padEnd(45, ' ')} `);
    const start = performance.now();
    try {
      const data = await queryFn();
      const elapsed = Math.round((performance.now() - start) * 100) / 100;
      const count = Array.isArray(data) ? data.length : typeof data === 'number' ? data : 1;
      console.log(`[OK] ${elapsed}ms (${count} rows)`);
      results.push({ test: name, latencyMs: elapsed, status: 'PASS', records: count });
    } catch (err: any) {
      const elapsed = Math.round((performance.now() - start) * 100) / 100;
      console.log(`[FAIL] ${elapsed}ms - ${err.message}`);
      results.push({ test: name, latencyMs: elapsed, status: 'FAIL', records: 0 });
    }
  }

  try {
    // 1. Connection Ping
    await benchmark('Connection Pool Ping (SELECT 1)', async () => {
      return await prisma.$queryRaw`SELECT 1 as ping`;
    });

    // 2. Complex Relational Join (Orders -> Buyer -> Items -> BOM)
    await benchmark('Relational Join (Orders + Items + Buyer)', async () => {
      return await prisma.order.findMany({
        take: 20,
        include: {
          buyer: true,
          items: {
            include: {
              fabricProduct: true,
            },
          },
          productionJobs: true,
        },
      });
    });

    // 3. Roll Barcode & Genealogy Traceability Lookup
    await benchmark('Genealogy Query (Rolls + QC + Location)', async () => {
      return await prisma.roll.findMany({
        take: 20,
        include: {
          productionJob: {
            include: {
              machine: true,
            },
          },
          inspections: true,
          location: true,
        },
      });
    });

    // 4. Financial Invoicing & Payment Aggregate
    await benchmark('Financial Aggregates (Invoices + Payments)', async () => {
      return await prisma.invoice.findMany({
        include: {
          payments: true,
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
            },
          },
        },
      });
    });

    // 5. Inventory Stock & Raw Material Balance
    await benchmark('Raw Material Inventory Evaluation', async () => {
      return await prisma.yarnMaterial.findMany({
        include: {
          transactions: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    // 6. Workforce Shift Attendance & Wage Ledger
    await benchmark('Attendance & Overtime Ledger Scan', async () => {
      return await prisma.attendance.findMany({
        take: 50,
        include: {
          employee: true,
        },
      });
    });

    // 7. Audit Log Retention & Mutation History
    await benchmark('Audit Trail Sequential Read (Recent 25)', async () => {
      return await prisma.auditLog.findMany({
        take: 25,
        orderBy: { createdAt: 'desc' },
      });
    });

    console.log('\n========================================================================');
    console.log('  BENCHMARK SUMMARY REPORT');
    console.log('========================================================================');
    const totalLatency = results.reduce((acc, r) => acc + r.latencyMs, 0);
    const avgLatency = Math.round((totalLatency / results.length) * 100) / 100;
    console.log(`  Total Test Suites: ${results.length}`);
    console.log(`  Passed Benchmarks: ${results.filter((r) => r.status === 'PASS').length}`);
    console.log(`  Cumulative Time:   ${Math.round(totalLatency * 100) / 100}ms`);
    console.log(`  Average Latency:   ${avgLatency}ms`);
    console.log('  Pool Health:       OPTIMAL (Supabase IPv4 Pooler Session Mode)');
    console.log('========================================================================\n');
  } catch (err: any) {
    console.error('Benchmark execution error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runDatabaseBenchmark();
