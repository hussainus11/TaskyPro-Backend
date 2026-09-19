/**
 * One-time fix script:
 * 1. Remove /dashboard/ prefix from all MenuItem hrefs
 * 2. Delete company/branch-specific MenuItem copies (keep only global ones)
 *
 * Run with:  cd backend && npx tsx prisma/fix-menu-items.ts
 */

import { prisma } from '../lib/prisma';

async function main() {
  // Step 1: Fix hrefs on ALL items (global and company-specific)
  const all = await prisma.menuItem.findMany();
  let hrefFixed = 0;
  for (const item of all) {
    if (item.href && item.href.startsWith('/dashboard/')) {
      const newHref = item.href.replace('/dashboard/', '/');
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { href: newHref },
      });
      console.log(`  href fixed: "${item.href}" → "${newHref}"`);
      hrefFixed++;
    }
  }
  console.log(`\nStep 1 done: ${hrefFixed} hrefs updated.\n`);

  // Step 2: Delete company/branch-specific items (duplicates of global ones).
  // Global items have companyId=null AND branchId=null.
  const companySpecific = await prisma.menuItem.findMany({
    where: {
      OR: [
        { companyId: { not: null } },
        { branchId: { not: null } },
      ],
    },
    orderBy: { id: 'asc' },
  });

  console.log(`Found ${companySpecific.length} company/branch-specific items to remove.`);

  // Delete children first, then parents (to avoid FK violations)
  const children = companySpecific.filter(i => i.parentId !== null);
  const parents = companySpecific.filter(i => i.parentId === null);

  for (const child of children) {
    await prisma.menuItem.delete({ where: { id: child.id } });
    console.log(`  Deleted child #${child.id}: "${child.title}" (${child.href})`);
  }
  for (const parent of parents) {
    // Only delete if it has no children left
    const remaining = await prisma.menuItem.count({ where: { parentId: parent.id } });
    if (remaining === 0) {
      await prisma.menuItem.delete({ where: { id: parent.id } });
      console.log(`  Deleted parent #${parent.id}: "${parent.title}"`);
    } else {
      console.log(`  Skipped parent #${parent.id}: "${parent.title}" (still has ${remaining} children)`);
    }
  }

  console.log('\nStep 2 done: company-specific duplicates removed.\n');

  // Summary
  const remaining = await prisma.menuItem.count();
  console.log(`Total menu items remaining: ${remaining}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
