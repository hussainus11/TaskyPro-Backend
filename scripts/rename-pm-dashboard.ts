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

async function renamePMDashboard() {
  try {
    console.log('Starting migration: Renaming Project Management Dashboard to PM Dashboard...');

    // Helper function to rename the menu item
    async function renamePMDashboardItem(
      companyId: number | null,
      branchId: number | null
    ) {
      const parent = await prisma.menuItem.findFirst({
        where: {
          title: 'Project Management',
          companyId: companyId ?? null,
          branchId: branchId ?? null,
          parentId: null,
        },
      });

      if (parent) {
        const dashboardItem = await prisma.menuItem.findFirst({
          where: {
            title: 'Project Management Dashboard',
            parentId: parent.id,
            companyId: companyId ?? null,
            branchId: branchId ?? null,
          },
        });

        if (dashboardItem) {
          await prisma.menuItem.update({
            where: { id: dashboardItem.id },
            data: { title: 'PM Dashboard' },
          });
          const scope = companyId && branchId 
            ? `(company ${companyId}, branch ${branchId})`
            : companyId 
            ? `(company ${companyId})`
            : '(global)';
          console.log(`✓ Renamed Project Management Dashboard to PM Dashboard ${scope}`);
          return true;
        }
      }
      return false;
    }

    // Process global menu items
    await renamePMDashboardItem(null, null);

    // Process company-specific menu items
    const companies = await prisma.company.findMany({
      select: { id: true },
    });
    for (const company of companies) {
      await renamePMDashboardItem(company.id, null);
    }

    // Process branch-specific menu items
    const branches = await prisma.branch.findMany({
      select: { id: true, companyId: true },
    });
    for (const branch of branches) {
      await renamePMDashboardItem(branch.companyId, branch.id);
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

renamePMDashboard();




















