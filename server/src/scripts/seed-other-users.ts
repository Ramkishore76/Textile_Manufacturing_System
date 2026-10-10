import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';

async function main() {
  const salt = await bcrypt.genSalt(10);

  // Find a buyer account to link buyer users
  const buyerAccount = await prisma.buyerAccount.findFirst({
    where: { status: 'ACTIVE' },
  });

  const additionalUsers = [
    {
      name: 'Rajesh Merchandiser',
      email: 'merchandiser@agttextile.com',
      password: await bcrypt.hash('Sales@123', salt),
      role: 'SALES' as const,
      phone: '+91 98422 20002',
      isActive: true,
    },
    {
      name: 'Suresh Inventory Lead',
      email: 'inventory@agttextile.com',
      password: await bcrypt.hash('Store@123', salt),
      role: 'STORE' as const,
      phone: '+91 98422 20003',
      isActive: true,
    },
    {
      name: 'Murugan Logistics Incharge',
      email: 'logistics@agttextile.com',
      password: await bcrypt.hash('Dispatch@123', salt),
      role: 'DISPATCH' as const,
      phone: '+91 98422 20006',
      isActive: true,
    },
    {
      name: 'Anitha Finance Officer',
      email: 'finance@agttextile.com',
      password: await bcrypt.hash('Accounts@123', salt),
      role: 'ACCOUNTS' as const,
      phone: '+91 98422 20007',
      isActive: true,
    },
  ];

  console.log('Seeding / verifying user credentials for other dashboards...');

  for (const u of additionalUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({ data: u });
      console.log(`Created user: ${u.email} (${u.role})`);
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: { password: u.password, isActive: true },
      });
      console.log(`Updated user password: ${u.email} (${u.role})`);
    }
  }

  // Also ensure primary accounts have known passwords
  const primaryAccounts = [
    { email: 'sales@agttextile.com', pass: 'Sales@123' },
    { email: 'store@agttextile.com', pass: 'Store@123' },
    { email: 'dispatch@agttextile.com', pass: 'Dispatch@123' },
    { email: 'accounts@agttextile.com', pass: 'Accounts@123' },
    { email: 'buyer@nordicapparel.com', pass: 'Buyer@123' },
    { email: 'buyer@casualline.com', pass: 'Buyer@123' },
  ];

  for (const p of primaryAccounts) {
    const user = await prisma.user.findUnique({ where: { email: p.email } });
    if (user) {
      const hashed = await bcrypt.hash(p.pass, salt);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed, isActive: true },
      });
      console.log(`Verified active password for: ${p.email}`);
    }
  }

  console.log('\nAll non-executive dashboard credentials are ready and verified!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
