import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Get all menu items grouped by group and ordered
export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId } = req.query;

    const companyIdNum =
      typeof companyId === 'string' && companyId.trim().length > 0 ? parseInt(companyId, 10) : null;
    const branchIdNum =
      typeof branchId === 'string' && branchId.trim().length > 0 ? parseInt(branchId, 10) : null;

    // Prisma Int filters can't do `in: [value, null]`. Use OR to include NULL fallbacks.
    const companyScopeWhere =
      companyIdNum != null ? { OR: [{ companyId: companyIdNum }, { companyId: null }] } : { companyId: null };
    const branchScopeWhere =
      branchIdNum != null ? { OR: [{ branchId: branchIdNum }, { branchId: null }] } : { branchId: null };

    // Build where clause
    const where: any = {
      isActive: true,
      parentId: null // Only get top-level items initially
    };

    // Note: if company/branch are provided, include global fallbacks (NULL) too.
    // Company-level menu items can be shared across branches, and global menu items shared across companies.
    where.AND = [companyScopeWhere, branchScopeWhere];

    // Step 1: Get all parent menu items (items without a parent)
    const parentMenuItems = await prisma.menuItem.findMany({
      where: {
        isActive: true,
        parentId: null, // Only top-level items (items without a parent)
        AND: [companyScopeWhere, branchScopeWhere],
      },
      include: {
        children: {
          where: {
            isActive: true,
            parentId: { not: null }, // Ensure children have a parent
            AND: [companyScopeWhere, branchScopeWhere],
          }
        }
      }
    });
    
    // Also get all child items to ensure they don't appear as top-level
    const allChildItems = await prisma.menuItem.findMany({
      where: {
        isActive: true,
        parentId: { not: null }, // Items that have a parent
        AND: [companyScopeWhere, branchScopeWhere],
      },
      select: { id: true } // Only get IDs to check for duplicates
    });
    
    const childItemIds = new Set(allChildItems.map(item => item.id));
    
    // Filter out any items that are children of other items (safety check)
    const allMenuItems = parentMenuItems.filter(item => {
      // Only include items that are truly top-level (parentId is null)
      // and are not in the child items list
      return item.parentId === null && !childItemIds.has(item.id);
    });

    // Step 2: Group by group name
    const grouped: Record<string, any[]> = {};

    // Prefer more specific (company/branch-scoped) items when duplicates exist.
    const specificityScore = (item: any): number =>
      (item.companyId != null ? 1 : 0) + (item.branchId != null ? 1 : 0);
    
    allMenuItems.forEach(item => {
      // Double check: only process items without a parent
      if (!item.parentId && !childItemIds.has(item.id)) {
        const group = item.group || 'Others';
        if (!grouped[group]) {
          grouped[group] = [];
        }
        grouped[group].push({
          id: item.id,
          title: item.title,
          href: item.href,
          icon: item.icon,
          order: item.order || 0, // Ensure order is a number, default to 0
          isComing: item.isComing,
          isNew: item.isNew,
          isDataBadge: item.isDataBadge,
          newTab: item.newTab,
          // Step 3: Include children deduplicated and sorted by order ASC
          items: (() => {
            // Deduplicate children by href, preferring company/branch-specific over global
            const childByKey = new Map<string, any>();
            for (const child of item.children.filter(c => c.parentId !== null)) {
              const href = String(child.href || '').trim();
              const key = !href || href === '#'
                ? `__title:${String(child.title || '').trim().toLowerCase()}`
                : href;
              const existing = childByKey.get(key);
              const score = (child.companyId != null ? 1 : 0) + (child.branchId != null ? 1 : 0);
              if (!existing || score > ((existing.companyId != null ? 1 : 0) + (existing.branchId != null ? 1 : 0))) {
                childByKey.set(key, child);
              }
            }
            return Array.from(childByKey.values())
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(child => ({
                id: child.id,
                title: child.title,
                href: child.href,
                icon: child.icon,
                order: child.order || 0,
                isComing: child.isComing,
                isNew: child.isNew,
                isDataBadge: child.isDataBadge,
                newTab: child.newTab,
                items: []
              }));
          })(),
          __specificity: specificityScore(item),
        });
      }
    });

    // Step 3: Sort items within each group by order ASC (0, 1, 2, ...)
    Object.keys(grouped).forEach(group => {
      // De-dupe by href/title, preferring more specific items if present.
      const byKey = new Map<string, any>();
      for (const it of grouped[group]) {
        const href = String(it.href || "").trim();
        // Many top-level "folder" menus use href "#" (Collaboration, CRM, Widgets, etc.).
        // If we de-dupe purely by href, all "#" items collide and only one survives.
        // Use title-based key for "#" (and empty) hrefs to keep distinct menus.
        const key =
          !href || href === "#"
            ? `__title:${String(it.title || "").trim().toLowerCase()}`
            : href;
        const existing = byKey.get(key);
        if (!existing) {
          byKey.set(key, it);
          continue;
        }
        if ((it.__specificity || 0) > (existing.__specificity || 0)) {
          byKey.set(key, it);
        }
      }

      grouped[group] = Array.from(byKey.values())
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    // Step 4: Define group order with numeric values (0, 1, 2, 3, 4, ...)
    // Dashboards: 0, Apps: 1, Pages: 2, AI Apps: 3, Others: 4
    const groupOrder: Record<string, number> = {
      'Dashboards': 0,
      'Apps': 1,
      'Pages': 2,
      'AI Apps': 3,
      'Others': 4
    };
    
    // Helper function to get group order (case-insensitive matching)
    const getGroupOrder = (groupName: string): number => {
      const normalizedName = groupName.trim();
      // Try exact match first
      if (groupOrder[normalizedName] !== undefined) {
        return groupOrder[normalizedName];
      }
      // Try case-insensitive match
      const lowerName = normalizedName.toLowerCase();
      for (const [key, value] of Object.entries(groupOrder)) {
        if (key.toLowerCase() === lowerName) {
          return value;
        }
      }
      // Default to 999 for unknown groups
      return 999;
    };

    // Step 5: Convert to array format and sort groups by defined order (0, 1, 2, 3, 4, ...)
    const result = Object.entries(grouped)
      .map(([title, items]) => ({
        title,
        items, // Items are already sorted by order ASC within each group
        groupOrder: getGroupOrder(title)
      }))
      .sort((a, b) => {
        // Sort groups by numeric order (0, 1, 2, 3, 4, ...)
        if (a.groupOrder !== b.groupOrder) {
          return a.groupOrder - b.groupOrder;
        }
        // If same order, sort alphabetically
        return a.title.localeCompare(b.title);
      })
      .map(({ title, items }) => ({ title, items })); // Remove groupOrder from final result

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch menu items' });
  }
};

// Create a new menu item
export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const {
      title,
      href,
      icon,
      group,
      parentId,
      order,
      isActive = true,
      isComing = false,
      isNew = false,
      isDataBadge,
      newTab = false,
      companyId,
      branchId
    } = req.body;

    const menuItem = await prisma.menuItem.create({
      data: {
        title,
        href,
        icon,
        group,
        parentId: parentId ? parseInt(parentId) : null,
        order: order !== undefined ? parseInt(order) : 0,
        isActive,
        isComing,
        isNew,
        isDataBadge,
        newTab,
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null
      }
    });

    res.json(menuItem);
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: error.message || 'Failed to create menu item' });
  }
};

// Update a menu item
export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      href,
      icon,
      group,
      parentId,
      order,
      isActive,
      isComing,
      isNew,
      isDataBadge,
      newTab,
      companyId,
      branchId
    } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (href !== undefined) updateData.href = href;
    if (icon !== undefined) updateData.icon = icon;
    if (group !== undefined) updateData.group = group;
    if (parentId !== undefined) updateData.parentId = parentId ? parseInt(parentId) : null;
    if (order !== undefined) updateData.order = parseInt(order);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isComing !== undefined) updateData.isComing = isComing;
    if (isNew !== undefined) updateData.isNew = isNew;
    if (isDataBadge !== undefined) updateData.isDataBadge = isDataBadge;
    if (newTab !== undefined) updateData.newTab = newTab;
    if (companyId !== undefined) updateData.companyId = companyId ? parseInt(companyId) : null;
    if (branchId !== undefined) updateData.branchId = branchId ? parseInt(branchId) : null;

    const menuItem = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(menuItem);
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: error.message || 'Failed to update menu item' });
  }
};

// Delete a menu item
export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if item has children
    const item = await prisma.menuItem.findUnique({
      where: { id: parseInt(id) },
      include: { children: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    if (item.children.length > 0) {
      return res.status(400).json({ error: 'Cannot delete menu item with children. Delete children first.' });
    }

    await prisma.menuItem.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: error.message || 'Failed to delete menu item' });
  }
};

// Reorder menu items
export const reorderMenuItems = async (req: Request, res: Response) => {
  try {
    const { items, companyId } = req.body;

    const parsedCompanyId = companyId ? parseInt(companyId as string) : null;

    // Resolve each item to its real database id.
    // Reorder NEVER creates new rows — it only updates `order` on existing items.
    const resolvedItems = await Promise.all(
      items.map(async (item: { id: number; order: number; title?: string; href?: string; icon?: string; group?: string; parentId?: number | null }) => {
        // Fast path: trust the id the client sent
        if (item.id > 0) {
          const exists = await prisma.menuItem.findUnique({ where: { id: item.id }, select: { id: true } });
          if (exists) return { order: item.order, dbId: item.id };
        }

        // Fallback: find by title+href+group+parentId, searching both company-specific
        // and global (companyId=null) rows so global menu items are never missed.
        const found = await prisma.menuItem.findFirst({
          where: {
            title: item.title || '',
            href: item.href || '#',
            group: item.group || null,
            parentId: item.parentId || null,
            OR: [
              { companyId: parsedCompanyId },
              { companyId: null },
            ],
          },
          select: { id: true },
          orderBy: { id: 'asc' }, // prefer the lowest id (the global record)
        });

        return found ? { order: item.order, dbId: found.id } : null;
      })
    );

    // Update only items we could resolve; skip anything not found (never create)
    const toUpdate = resolvedItems.filter(Boolean) as { order: number; dbId: number }[];

    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map(({ dbId, order }) =>
          prisma.menuItem.update({ where: { id: dbId }, data: { order } })
        )
      );
    }

    res.json({ message: 'Menu items reordered successfully' });
  } catch (error: any) {
    console.error('Error reordering menu items:', error);
    res.status(500).json({ error: error.message || 'Failed to reorder menu items' });
  }
};

