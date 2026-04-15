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

async function renameDashboardMenuItems() {
  try {
    console.log('Starting migration: Renaming Dashboard menu items...');

    // Helper function to rename dashboard menu item
    async function renameDashboardItem(
      parentTitle: string,
      newTitle: string,
      companyId: number | null,
      branchId: number | null
    ) {
      const parent = await prisma.menuItem.findFirst({
        where: {
          title: parentTitle,
          companyId: companyId ?? null,
          branchId: branchId ?? null,
          parentId: null,
        },
      });

      if (parent) {
        const dashboardItem = await prisma.menuItem.findFirst({
          where: {
            title: 'Dashboard',
            parentId: parent.id,
            companyId: companyId ?? null,
            branchId: branchId ?? null,
          },
        });

        if (dashboardItem) {
          await prisma.menuItem.update({
            where: { id: dashboardItem.id },
            data: { title: newTitle },
          });
          const scope = companyId && branchId 
            ? `(company ${companyId}, branch ${branchId})`
            : companyId 
            ? `(company ${companyId})`
            : '(global)';
          console.log(`✓ Renamed ${parentTitle} > Dashboard to ${newTitle} ${scope}`);
          return true;
        }
      }
      return false;
    }

    // ============================================
    // 1. Rename Dashboard under CRM
    // ============================================
    console.log('\n1. Renaming CRM > Dashboard...');
    
    // Global
    await renameDashboardItem('CRM', 'CRM Dashboard', null, null);

    // Company-specific
    const companies = await prisma.company.findMany({
      select: { id: true },
    });
    for (const company of companies) {
      await renameDashboardItem('CRM', 'CRM Dashboard', company.id, null);
    }

    // Branch-specific
    const branches = await prisma.branch.findMany({
      select: { id: true, companyId: true },
    });
    for (const branch of branches) {
      await renameDashboardItem('CRM', 'CRM Dashboard', branch.companyId, branch.id);
    }

    // ============================================
    // 2. Rename Dashboard under E-commerce
    // ============================================
    console.log('\n2. Renaming E-commerce > Dashboard...');
    
    // Global
    await renameDashboardItem('E-commerce', 'E-commerce Dashboard', null, null);

    // Company-specific
    for (const company of companies) {
      await renameDashboardItem('E-commerce', 'E-commerce Dashboard', company.id, null);
    }

    // Branch-specific
    for (const branch of branches) {
      await renameDashboardItem('E-commerce', 'E-commerce Dashboard', branch.companyId, branch.id);
    }

    // ============================================
    // 3. Rename Dashboard under Project Management
    // ============================================
    console.log('\n3. Renaming Project Management > Dashboard...');
    
    // Global
    await renameDashboardItem('Project Management', 'Project Management Dashboard', null, null);

    // Company-specific
    for (const company of companies) {
      await renameDashboardItem('Project Management', 'Project Management Dashboard', company.id, null);
    }

    // Branch-specific
    for (const branch of branches) {
      await renameDashboardItem('Project Management', 'Project Management Dashboard', branch.companyId, branch.id);
    }

    // ============================================
    // 4. Rename Dashboard under Payment Dashboard
    // ============================================
    console.log('\n4. Renaming Payment Dashboard > Dashboard...');
    
    // Global
    await renameDashboardItem('Payment Dashboard', 'Payment Dashboard', null, null);

    // Company-specific
    for (const company of companies) {
      await renameDashboardItem('Payment Dashboard', 'Payment Dashboard', company.id, null);
    }

    // Branch-specific
    for (const branch of branches) {
      await renameDashboardItem('Payment Dashboard', 'Payment Dashboard', branch.companyId, branch.id);
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

renameDashboardMenuItems();




















