import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function addLoginHistoryMenu() {
  try {
    console.log('Starting: Adding Login History menu item...');

    // Helper function to add menu item
    async function addMenuItem(
      title: string,
      href: string,
      icon: string,
      group: string,
      order: number,
      companyId: number | null,
      branchId: number | null
    ) {
      // Check if menu item already exists
      const existing = await prisma.menuItem.findFirst({
        where: {
          title,
          href,
          group,
          companyId: companyId ?? null,
          branchId: branchId ?? null,
        },
      });

      if (existing) {
        const scope = companyId && branchId
          ? `(company ${companyId}, branch ${branchId})`
          : companyId
          ? `(company ${companyId})`
          : '(global)';
        console.log(`✓ Menu item "${title}" already exists ${scope}`);
        return;
      }

      await prisma.menuItem.create({
        data: {
          title,
          href,
          icon,
          group,
          order,
          companyId: companyId ?? null,
          branchId: branchId ?? null,
        },
      });

      const scope = companyId && branchId
        ? `(company ${companyId}, branch ${branchId})`
        : companyId
        ? `(company ${companyId})`
        : '(global)';
      console.log(`✓ Added "${title}" menu item ${scope}`);
    }

    // Add to global
    await addMenuItem(
      'Login History',
      '/dashboard/pages/login-history',
      'History',
      'Others',
      1,
      null,
      null
    );

    // Get all companies and branches to apply changes universally
    const companies = await prisma.company.findMany({ select: { id: true } });
    const branches = await prisma.branch.findMany({ select: { id: true, companyId: true } });

    // Apply to company-specific
    for (const company of companies) {
      await addMenuItem(
        'Login History',
        '/dashboard/pages/login-history',
        'History',
        'Others',
        1,
        company.id,
        null
      );
    }

    // Apply to branch-specific
    for (const branch of branches) {
      await addMenuItem(
        'Login History',
        '/dashboard/pages/login-history',
        'History',
        'Others',
        1,
        branch.companyId,
        branch.id
      );
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

addLoginHistoryMenu();



















