import { PrismaClient } from "../generated/prisma/client";

export const ADMINISTRATOR_ROLE_NAME = "Administrator";

// Top-level resource groups the app's sidebar actually uses. Granting access here is
// enough: permissionSettingController's resource check walks a path up to its parent
// segments looking for a match, so a grant on "apps" also covers "apps.chat",
// "apps.notes", etc. without needing one row per menu item.
const FULL_ACCESS_RESOURCE_PATHS: { path: string; name: string }[] = [
  { path: "crm", name: "CRM" },
  { path: "apps", name: "Apps" },
  { path: "pages", name: "Pages" },
  { path: "collaboration", name: "Collaboration" },
  { path: "ecommerce", name: "E-commerce" },
  { path: "project-management", name: "Project Management" },
  { path: "project-list", name: "Project List" },
  { path: "payment", name: "Payment" },
  { path: "widgets", name: "Widgets" },
  { path: "file-manager", name: "File Manager" }
];

// Carved out of the "pages" grant above with exact-path rows - an exact resourcePath
// match wins over the parent-path fallback - so Administrator never reaches the
// platform-owner-only Administration/Platform Admin areas even though they live
// under /pages/*. Those stay gated to the platform-owner company regardless of role.
const DENIED_RESOURCE_PATHS: { path: string; name: string }[] = [
  { path: "pages.companies", name: "Companies (Platform Admin)" },
  { path: "pages.platform-billing", name: "Billing (Platform Admin)" },
  { path: "pages.pricing-plans", name: "Pricing Plans (Administration)" }
];

export async function ensureAdministratorRole(prisma: PrismaClient, companyId: number): Promise<number> {
  let role = await prisma.role.findFirst({
    where: { name: ADMINISTRATOR_ROLE_NAME, companyId }
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: ADMINISTRATOR_ROLE_NAME,
        description: "Full access to this company's features, excluding platform administration.",
        isSystem: true,
        isDefault: true,
        isActive: true,
        companyId,
        branchId: null
      }
    });
  }

  for (const { path, name } of FULL_ACCESS_RESOURCE_PATHS) {
    const existing = await prisma.permissionSetting.findFirst({
      where: { roleId: role.id, resourcePath: path, companyId, branchId: null }
    });
    if (existing) continue;

    await prisma.permissionSetting.create({
      data: {
        roleId: role.id,
        resourceType: "MENU",
        resourcePath: path,
        resourceName: name,
        canRead: true,
        canWrite: true,
        canEdit: true,
        canDelete: true,
        canManage: true,
        canExport: true,
        canImport: true,
        companyId,
        branchId: null
      }
    });
  }

  for (const { path, name } of DENIED_RESOURCE_PATHS) {
    const existing = await prisma.permissionSetting.findFirst({
      where: { roleId: role.id, resourcePath: path, companyId, branchId: null }
    });
    if (existing) continue;

    await prisma.permissionSetting.create({
      data: {
        roleId: role.id,
        resourceType: "MENU",
        resourcePath: path,
        resourceName: name,
        canRead: false,
        canWrite: false,
        canEdit: false,
        canDelete: false,
        canManage: false,
        canExport: false,
        canImport: false,
        companyId,
        branchId: null
      }
    });
  }

  return role.id;
}

// Backfills the Administrator role for every existing company. New companies get it
// via ensureAdministratorRole() called directly from createCompany() instead.
export async function seedDefaultRoleForAllCompanies(prisma: PrismaClient) {
  const companies = await prisma.company.findMany({ select: { id: true } });
  for (const company of companies) {
    await ensureAdministratorRole(prisma, company.id);
  }
}
