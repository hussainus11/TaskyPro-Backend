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

/**
 * Migration script to add Returns menu item to the database
 * This adds the Returns menu item under E-commerce section
 * Handles global, company-specific, and branch-specific menu items
 */
async function addReturnsMenuItem() {
  console.log('Starting migration: Adding Returns menu item...');

  try {
    // Process global menu items (companyId IS NULL AND branchId IS NULL)
    const globalEcommerce = await prisma.menuItem.findFirst({
      where: {
        title: 'E-commerce',
        href: '#',
        group: 'Dashboards',
        companyId: null,
        branchId: null,
      },
    });

    if (globalEcommerce) {
      const existingGlobal = await prisma.menuItem.findFirst({
        where: {
          title: 'Returns',
          href: '/dashboard/pages/returns',
          parentId: globalEcommerce.id,
          companyId: null,
          branchId: null,
        },
      });

      if (!existingGlobal) {
        const maxOrder = await prisma.menuItem.findFirst({
          where: {
            parentId: globalEcommerce.id,
            companyId: null,
            branchId: null,
          },
          orderBy: { order: 'desc' },
        });

        await prisma.menuItem.create({
          data: {
            title: 'Returns',
            href: '/dashboard/pages/returns',
            icon: 'RotateCcw',
            group: 'Dashboards',
            parentId: globalEcommerce.id,
            order: (maxOrder?.order ?? 6) + 1,
            isActive: true,
            companyId: null,
            branchId: null,
          },
        });
        console.log('✓ Added Returns (global)');
      } else {
        console.log('⚠ Returns (global) already exists');
      }
    }

    // Process company-specific menu items
    const companies = await prisma.company.findMany({
      select: { id: true },
    });

    for (const company of companies) {
      const companyEcommerce = await prisma.menuItem.findFirst({
        where: {
          title: 'E-commerce',
          href: '#',
          group: 'Dashboards',
          companyId: company.id,
          branchId: null,
        },
      });

      if (companyEcommerce) {
        const existing = await prisma.menuItem.findFirst({
          where: {
            title: 'Returns',
            href: '/dashboard/pages/returns',
            parentId: companyEcommerce.id,
            companyId: company.id,
            branchId: null,
          },
        });

        if (!existing) {
          const maxOrder = await prisma.menuItem.findFirst({
            where: {
              parentId: companyEcommerce.id,
              companyId: company.id,
              branchId: null,
            },
            orderBy: { order: 'desc' },
          });

          await prisma.menuItem.create({
            data: {
              title: 'Returns',
              href: '/dashboard/pages/returns',
              icon: 'RotateCcw',
              group: 'Dashboards',
              parentId: companyEcommerce.id,
              order: (maxOrder?.order ?? 6) + 1,
              isActive: true,
              companyId: company.id,
              branchId: null,
            },
          });
          console.log(`✓ Added Returns (company ${company.id})`);
        }
      }
    }

    // Process branch-specific menu items
    const branches = await prisma.branch.findMany({
      select: { id: true, companyId: true },
    });

    for (const branch of branches) {
      const branchEcommerce = await prisma.menuItem.findFirst({
        where: {
          title: 'E-commerce',
          href: '#',
          group: 'Dashboards',
          companyId: branch.companyId,
          branchId: branch.id,
        },
      });

      if (branchEcommerce) {
        const existing = await prisma.menuItem.findFirst({
          where: {
            title: 'Returns',
            href: '/dashboard/pages/returns',
            parentId: branchEcommerce.id,
            companyId: branch.companyId,
            branchId: branch.id,
          },
        });

        if (!existing) {
          const maxOrder = await prisma.menuItem.findFirst({
            where: {
              parentId: branchEcommerce.id,
              companyId: branch.companyId,
              branchId: branch.id,
            },
            orderBy: { order: 'desc' },
          });

          await prisma.menuItem.create({
            data: {
              title: 'Returns',
              href: '/dashboard/pages/returns',
              icon: 'RotateCcw',
              group: 'Dashboards',
              parentId: branchEcommerce.id,
              order: (maxOrder?.order ?? 6) + 1,
              isActive: true,
              companyId: branch.companyId,
              branchId: branch.id,
            },
          });
          console.log(`✓ Added Returns (branch ${branch.id})`);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  addReturnsMenuItem()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}

export { addReturnsMenuItem };

