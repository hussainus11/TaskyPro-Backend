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

async function addPaymentMenuItems() {
  try {
    console.log('Starting migration: Adding Customer Payments and Supplier Payments menu items...');

    // Process global menu items (companyId IS NULL AND branchId IS NULL)
    const globalPaymentDashboard = await prisma.menuItem.findFirst({
      where: {
        title: 'Payment Dashboard',
        companyId: null,
        branchId: null,
        parentId: null,
      },
    });

    if (globalPaymentDashboard) {
      const maxOrder = await prisma.menuItem.findFirst({
        where: {
          parentId: globalPaymentDashboard.id,
          companyId: null,
          branchId: null,
        },
        orderBy: {
          order: 'desc',
        },
      });

      const nextOrder = (maxOrder?.order ?? 0) + 1;

      // Add Customer Payments
      const existingCustomerPayments = await prisma.menuItem.findFirst({
        where: {
          title: 'Customer Payments',
          parentId: globalPaymentDashboard.id,
          companyId: null,
          branchId: null,
        },
      });

      if (!existingCustomerPayments) {
        await prisma.menuItem.create({
          data: {
            title: 'Customer Payments',
            href: '/dashboard/payment/customer-payments',
            icon: 'User',
            parentId: globalPaymentDashboard.id,
            order: nextOrder,
            isActive: true,
            companyId: null,
            branchId: null,
          },
        });
        console.log('✓ Added Customer Payments (global)');
      } else {
        console.log('⚠ Customer Payments (global) already exists');
      }

      // Add Supplier Payments
      const existingSupplierPayments = await prisma.menuItem.findFirst({
        where: {
          title: 'Supplier Payments',
          parentId: globalPaymentDashboard.id,
          companyId: null,
          branchId: null,
        },
      });

      if (!existingSupplierPayments) {
        await prisma.menuItem.create({
          data: {
            title: 'Supplier Payments',
            href: '/dashboard/payment/supplier-payments',
            icon: 'Users',
            parentId: globalPaymentDashboard.id,
            order: nextOrder + 1,
            isActive: true,
            companyId: null,
            branchId: null,
          },
        });
        console.log('✓ Added Supplier Payments (global)');
      } else {
        console.log('⚠ Supplier Payments (global) already exists');
      }
    } else {
      console.log('⚠ Payment Dashboard (global) not found, skipping global menu items');
    }

    // Process company-specific menu items
    const companies = await prisma.company.findMany({
      select: { id: true },
    });

    for (const company of companies) {
      const companyPaymentDashboard = await prisma.menuItem.findFirst({
        where: {
          title: 'Payment Dashboard',
          companyId: company.id,
          branchId: null,
          parentId: null,
        },
      });

      if (companyPaymentDashboard) {
        const maxOrder = await prisma.menuItem.findFirst({
          where: {
            parentId: companyPaymentDashboard.id,
            companyId: company.id,
            branchId: null,
          },
          orderBy: {
            order: 'desc',
          },
        });

        const nextOrder = (maxOrder?.order ?? 0) + 1;

        // Add Customer Payments
        const existingCustomerPayments = await prisma.menuItem.findFirst({
          where: {
            title: 'Customer Payments',
            parentId: companyPaymentDashboard.id,
            companyId: company.id,
            branchId: null,
          },
        });

        if (!existingCustomerPayments) {
          await prisma.menuItem.create({
            data: {
              title: 'Customer Payments',
              href: '/dashboard/payment/customer-payments',
              icon: 'User',
              parentId: companyPaymentDashboard.id,
              order: nextOrder,
              isActive: true,
              companyId: company.id,
              branchId: null,
            },
          });
          console.log(`✓ Added Customer Payments (company ${company.id})`);
        }

        // Add Supplier Payments
        const existingSupplierPayments = await prisma.menuItem.findFirst({
          where: {
            title: 'Supplier Payments',
            parentId: companyPaymentDashboard.id,
            companyId: company.id,
            branchId: null,
          },
        });

        if (!existingSupplierPayments) {
          await prisma.menuItem.create({
            data: {
              title: 'Supplier Payments',
              href: '/dashboard/payment/supplier-payments',
              icon: 'Users',
              parentId: companyPaymentDashboard.id,
              order: nextOrder + 1,
              isActive: true,
              companyId: company.id,
              branchId: null,
            },
          });
          console.log(`✓ Added Supplier Payments (company ${company.id})`);
        }
      }
    }

    // Process branch-specific menu items
    const branches = await prisma.branch.findMany({
      select: { id: true, companyId: true },
    });

    for (const branch of branches) {
      const branchPaymentDashboard = await prisma.menuItem.findFirst({
        where: {
          title: 'Payment Dashboard',
          companyId: branch.companyId,
          branchId: branch.id,
          parentId: null,
        },
      });

      if (branchPaymentDashboard) {
        const maxOrder = await prisma.menuItem.findFirst({
          where: {
            parentId: branchPaymentDashboard.id,
            companyId: branch.companyId,
            branchId: branch.id,
          },
          orderBy: {
            order: 'desc',
          },
        });

        const nextOrder = (maxOrder?.order ?? 0) + 1;

        // Add Customer Payments
        const existingCustomerPayments = await prisma.menuItem.findFirst({
          where: {
            title: 'Customer Payments',
            parentId: branchPaymentDashboard.id,
            companyId: branch.companyId,
            branchId: branch.id,
          },
        });

        if (!existingCustomerPayments) {
          await prisma.menuItem.create({
            data: {
              title: 'Customer Payments',
              href: '/dashboard/payment/customer-payments',
              icon: 'User',
              parentId: branchPaymentDashboard.id,
              order: nextOrder,
              isActive: true,
              companyId: branch.companyId,
              branchId: branch.id,
            },
          });
          console.log(`✓ Added Customer Payments (branch ${branch.id})`);
        }

        // Add Supplier Payments
        const existingSupplierPayments = await prisma.menuItem.findFirst({
          where: {
            title: 'Supplier Payments',
            parentId: branchPaymentDashboard.id,
            companyId: branch.companyId,
            branchId: branch.id,
          },
        });

        if (!existingSupplierPayments) {
          await prisma.menuItem.create({
            data: {
              title: 'Supplier Payments',
              href: '/dashboard/payment/supplier-payments',
              icon: 'Users',
              parentId: branchPaymentDashboard.id,
              order: nextOrder + 1,
              isActive: true,
              companyId: branch.companyId,
              branchId: branch.id,
            },
          });
          console.log(`✓ Added Supplier Payments (branch ${branch.id})`);
        }
      }
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

addPaymentMenuItems();






















