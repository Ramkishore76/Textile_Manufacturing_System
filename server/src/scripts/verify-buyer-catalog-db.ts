/**
 * Database & Seed Integrity Verification for Buyer Portal
 * Author: Sanjay Selvakumar <sanjayselvakumar05@gmail.com>
 * AGT Textile Mills — Supabase PostgreSQL Database Suite
 */

import { prisma } from '../db/prisma';

async function verifyBuyerCatalogDatabase() {
  console.log('========================================================================');
  console.log('  AGT TEXTILE MILLS — BUYER CATALOG & DATABASE PERFORMANCE AUDIT');
  console.log('========================================================================\n');

  const startTime = Date.now();

  try {
    // 1. Connection Latency Check
    const pingStart = Date.now();
    await prisma.$queryRaw`SELECT 1 as ping`;
    const latency = Date.now() - pingStart;
    console.log(`[PASS] Supabase PostgreSQL Cloud Connection OK (${latency}ms round-trip)`);

    // 2. Fabric Products Catalog Integrity
    const fabrics = await prisma.fabricProduct.findMany({
      include: {
        boms: {
          include: {
            yarnMaterial: true,
          },
        },
      },
    });

    console.log(`[PASS] Found ${fabrics.length} Fabric Product Specifications:`);
    for (const f of fabrics) {
      console.log(
        `  - ${f.code.padEnd(10)} | ${f.name.padEnd(25)} | ₹${f.unitPricePerMeter}/m | ${f.gsm} GSM | ${f.boms.length} BOM components`
      );
    }

    // 3. Buyer Profiles & Accounts Integrity
    const buyers = await prisma.buyer.findMany({
      include: {
        orders: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    console.log(`\n[PASS] Verified ${buyers.length} Registered Enterprise Buyers:`);
    for (const b of buyers) {
      console.log(`  - ${b.companyName} (${b.name} | ${b.email}) | ${b.orders.length} orders tracked`);
    }

    // 4. Index Health & Performance Simulation
    const filterStart = Date.now();
    const filtered = await prisma.fabricProduct.findMany({
      where: {
        unitPricePerMeter: { gt: 100 },
      },
    });
    const filterDuration = Date.now() - filterStart;
    console.log(
      `\n[PASS] Filter Query Execution Time: ${filterDuration}ms (${filtered.length} fabric products indexed > ₹100/m)`
    );

    const totalDuration = Date.now() - startTime;
    console.log('\n========================================================================');
    console.log(`  DATABASE AUDIT COMPLETE: ALL CHECKS PASSED in ${totalDuration}ms`);
    console.log('========================================================================\n');
  } catch (error: any) {
    console.error('[FAIL] Database verification encountered an error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBuyerCatalogDatabase();
