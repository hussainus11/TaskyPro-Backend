import { PrismaClient } from "../generated/prisma/client";

// Named "Platform Admin" (not "Administration") because nav-main.tsx already has
// a hardcoded, unconditional "Administration" group (Pricing Plans) shown to every
// company - reusing that name caused a duplicate sidebar group / React key collision.
//
// Scoped to companyId 6 ("Tasky Pro", the platform owner) via MenuItem.companyId -
// menuItemsController.ts already filters menu items by companyId (OR'd with global
// companyId=null rows), so this is the only thing needed for the group to appear
// only for that company's users.
const PLATFORM_OWNER_COMPANY_ID = 6;
const GROUP_TITLE = "Platform Admin";

type AdminMenuItem = {
  title: string;
  href: string;
  icon: string;
  order: number;
};

const ADMIN_ITEMS: AdminMenuItem[] = [
  { title: "Companies", href: "/pages/companies", icon: "Building2", order: 0 },
  { title: "Billing", href: "/pages/platform-billing", icon: "CreditCard", order: 1 }
];

export async function seedAdministrationMenu(prisma: PrismaClient) {
  const company = await prisma.company.findUnique({
    where: { id: PLATFORM_OWNER_COMPANY_ID },
    select: { id: true }
  });

  if (!company) {
    console.log(`Platform owner company (id ${PLATFORM_OWNER_COMPANY_ID}) not found, skipping ${GROUP_TITLE} menu seed.`);
    return;
  }

  for (const item of ADMIN_ITEMS) {
    const existing = await prisma.menuItem.findFirst({
      where: {
        href: item.href,
        group: GROUP_TITLE,
        companyId: PLATFORM_OWNER_COMPANY_ID,
        branchId: null
      }
    });

    if (existing) {
      console.log(`${GROUP_TITLE} menu item "${item.title}" already exists, skipping.`);
      continue;
    }

    await prisma.menuItem.create({
      data: {
        title: item.title,
        href: item.href,
        icon: item.icon,
        group: GROUP_TITLE,
        parentId: null,
        order: item.order,
        isActive: true,
        companyId: PLATFORM_OWNER_COMPANY_ID,
        branchId: null
      }
    });

    console.log(`Created ${GROUP_TITLE} menu item "${item.title}".`);
  }
}
