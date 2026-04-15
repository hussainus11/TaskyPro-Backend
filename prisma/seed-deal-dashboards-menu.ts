import { PrismaClient } from "../generated/prisma/client";

type SeedTarget = {
  companyId: number;
  branchId: number | null;
};

async function ensureMenuItem(prisma: PrismaClient, target: SeedTarget) {
  const baseWhere = {
    companyId: target.companyId,
    branchId: target.branchId,
    parentId: null as number | null,
    href: "/dashboard/crm/deals/dashboards",
  };

  const existing = await prisma.menuItem.findFirst({
    where: baseWhere,
    select: { id: true },
  });

  if (existing) return;

  // Put it in the Dashboards group as a top-level item.
  // Use a high-ish default order so it doesn't disrupt existing menus; user can reorder in UI.
  await prisma.menuItem.create({
    data: {
      title: "Deal Dashboards",
      href: "/dashboard/crm/deals/dashboards",
      icon: "LayoutDashboard",
      group: "Dashboards",
      parentId: null,
      order: 50,
      isActive: true,
      isComing: false,
      isNew: true,
      isDataBadge: null,
      newTab: false,
      companyId: target.companyId,
      branchId: target.branchId,
    },
  });
}

export async function seedDealDashboardsMenu(prisma: PrismaClient) {
  const companies = await prisma.company.findMany({
    select: { id: true },
  });

  for (const c of companies) {
    // Company-level menu
    await ensureMenuItem(prisma, { companyId: c.id, branchId: null });

    // Branch-level menus (if your app requests branch-scoped menu items)
    const branches = await prisma.branch.findMany({
      where: { companyId: c.id },
      select: { id: true },
    });
    for (const b of branches) {
      await ensureMenuItem(prisma, { companyId: c.id, branchId: b.id });
    }
  }
}

