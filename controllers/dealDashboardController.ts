import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

type DashboardVisibility = 'PRIVATE' | 'COMPANY' | 'ROLES' | 'USERS';

function assertAuth(req: AuthRequest, res: Response): req is AuthRequest & { userId: number; user: any } {
  if (!req.userId || !req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function canReadDashboard(opts: {
  dashboard: any;
  userId: number;
  userRoleIds: number[];
}) {
  const { dashboard, userId, userRoleIds } = opts;
  if (dashboard.createdById === userId) return true;
  if (dashboard.visibility === 'COMPANY') return true;
  if (dashboard.visibility === 'ROLES') {
    const allowed = new Set((dashboard.roleShares as any[]).map((s: any) => s.roleId));
    return userRoleIds.some((id) => allowed.has(id));
  }
  if (dashboard.visibility === 'USERS') {
    const allowed = new Set((dashboard.userShares as any[]).map((s: any) => s.userId));
    return allowed.has(userId);
  }
  return false;
}

function canWriteDashboard(opts: { dashboard: any; userId: number }) {
  return opts.dashboard.createdById === opts.userId;
}

export const listDealDashboards = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertAuth(req, res)) return;
    const user = req.user;
    const userId = req.userId;

    const userRoleIds = user.roleId ? [user.roleId as number] : [];

    const dashboards = await prisma.dealDashboard.findMany({
      where: {
        companyId: user.companyId,
        OR: [
          { createdById: userId },
          { visibility: 'COMPANY' },
          {
            visibility: 'ROLES',
            roleShares: { some: { roleId: { in: userRoleIds } } },
          },
          {
            visibility: 'USERS',
            userShares: { some: { userId } },
          },
        ],
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        roleShares: true,
        userShares: true,
        userPrefs: { where: { userId } },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    const decorated = dashboards.map((d) => {
      const pref = d.userPrefs[0];
      return {
        ...d,
        userPref: pref
          ? {
              order: pref.order,
              isPinned: pref.isPinned,
              isCollapsed: pref.isCollapsed,
            }
          : null,
        roleShareRoleIds: d.roleShares.map((s) => s.roleId),
        userShareUserIds: d.userShares.map((s) => s.userId),
      };
    });

    decorated.sort((a, b) => {
      const pinDiff = Number(!!b.userPref?.isPinned) - Number(!!a.userPref?.isPinned);
      if (pinDiff !== 0) return pinDiff;
      const ao = a.userPref?.order ?? 1_000_000_000;
      const bo = b.userPref?.order ?? 1_000_000_000;
      if (ao !== bo) return ao - bo;
      const at = new Date(a.updatedAt).getTime();
      const bt = new Date(b.updatedAt).getTime();
      return bt - at;
    });

    res.json(decorated);
  } catch (e: any) {
    console.error('listDealDashboards failed', e);
    res.status(500).json({ error: 'Failed to list dashboards', details: e.message });
  }
};

export const getDealDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertAuth(req, res)) return;
    const user = req.user;
    const userId = req.userId;

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const userRoleIds = user.roleId ? [user.roleId as number] : [];

    const dashboard = await prisma.dealDashboard.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        roleShares: true,
        userShares: true,
        userPrefs: { where: { userId } },
      },
    });

    if (!dashboard) return res.status(404).json({ error: 'Not found' });
    if (!canReadDashboard({ dashboard, userId, userRoleIds })) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({
      ...dashboard,
      userPref: dashboard.userPrefs[0] || null,
      roleShareRoleIds: dashboard.roleShares.map((s) => s.roleId),
      userShareUserIds: dashboard.userShares.map((s) => s.userId),
    });
  } catch (e: any) {
    console.error('getDealDashboard failed', e);
    res.status(500).json({ error: 'Failed to load dashboard', details: e.message });
  }
};

export const createDealDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertAuth(req, res)) return;
    const user = req.user;
    const userId = req.userId;

    const {
      name,
      description,
      filter,
      layout,
      widgets,
      visibility,
      sharedRoleIds,
      sharedUserIds,
    } = req.body as {
      name: string;
      description?: string;
      filter: any;
      layout?: any;
      widgets?: any;
      visibility?: DashboardVisibility;
      sharedRoleIds?: number[];
      sharedUserIds?: number[];
    };

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    if (filter === undefined || filter === null) return res.status(400).json({ error: 'filter is required' });

    const vis: DashboardVisibility = visibility || 'PRIVATE';

    if (vis === 'ROLES' && (!sharedRoleIds || sharedRoleIds.length === 0)) {
      return res.status(400).json({ error: 'sharedRoleIds required for ROLES visibility' });
    }
    if (vis === 'USERS' && (!sharedUserIds || sharedUserIds.length === 0)) {
      return res.status(400).json({ error: 'sharedUserIds required for USERS visibility' });
    }

    const created = await prisma.$transaction(async (tx) => {
      const dashboard = await tx.dealDashboard.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          filter,
          layout: layout ?? {},
          widgets: widgets ?? [],
          visibility: vis as any,
          companyId: user.companyId,
          branchId: user.branchId ?? null,
          createdById: userId,
          roleShares:
            vis === 'ROLES'
              ? {
                  create: (sharedRoleIds || []).map((roleId) => ({ roleId })),
                }
              : undefined,
          userShares:
            vis === 'USERS'
              ? {
                  create: (sharedUserIds || []).map((uid) => ({ userId: uid })),
                }
              : undefined,
        },
      });

      const maxOrder = await tx.dealDashboardUserPref.aggregate({
        where: { userId },
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? -1) + 1;

      await tx.dealDashboardUserPref.upsert({
        where: { dashboardId_userId: { dashboardId: dashboard.id, userId } },
        create: {
          dashboardId: dashboard.id,
          userId,
          order: nextOrder,
          isPinned: false,
          isCollapsed: false,
        },
        update: {},
      });

      return dashboard;
    });

    res.status(201).json(created);
  } catch (e: any) {
    console.error('createDealDashboard failed', e);
    res.status(500).json({ error: 'Failed to create dashboard', details: e.message });
  }
};

export const updateDealDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertAuth(req, res)) return;
    const user = req.user;
    const userId = req.userId;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await prisma.dealDashboard.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (!canWriteDashboard({ dashboard: existing, userId })) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      name,
      description,
      filter,
      layout,
      widgets,
      visibility,
      sharedRoleIds,
      sharedUserIds,
    } = req.body as any;

    const vis: DashboardVisibility | undefined = visibility;

    if (vis === 'ROLES' && (!sharedRoleIds || sharedRoleIds.length === 0)) {
      return res.status(400).json({ error: 'sharedRoleIds required for ROLES visibility' });
    }
    if (vis === 'USERS' && (!sharedUserIds || sharedUserIds.length === 0)) {
      return res.status(400).json({ error: 'sharedUserIds required for USERS visibility' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (vis && vis !== (existing.visibility as any)) {
        await tx.dealDashboardRoleShare.deleteMany({ where: { dashboardId: id } });
        await tx.dealDashboardUserShare.deleteMany({ where: { dashboardId: id } });
      }

      const roleCreates =
        (vis ?? (existing.visibility as any)) === 'ROLES'
          ? (sharedRoleIds || []).map((roleId: number) => ({ roleId }))
          : [];

      const userCreates =
        (vis ?? (existing.visibility as any)) === 'USERS'
          ? (sharedUserIds || []).map((uid: number) => ({ userId: uid }))
          : [];

      return tx.dealDashboard.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: String(name).trim() } : {}),
          ...(description !== undefined ? { description: description ? String(description) : null } : {}),
          ...(filter !== undefined ? { filter } : {}),
          ...(layout !== undefined ? { layout } : {}),
          ...(widgets !== undefined ? { widgets } : {}),
          ...(vis ? { visibility: vis as any } : {}),
          ...(vis === 'ROLES'
            ? {
                roleShares: {
                  deleteMany: {},
                  create: roleCreates,
                },
              }
            : vis && vis !== 'ROLES'
              ? { roleShares: { deleteMany: {} } }
              : {}),
          ...(vis === 'USERS'
            ? {
                userShares: {
                  deleteMany: {},
                  create: userCreates,
                },
              }
            : vis && vis !== 'USERS'
              ? { userShares: { deleteMany: {} } }
              : {}),
        },
      });
    });

    res.json(updated);
  } catch (e: any) {
    console.error('updateDealDashboard failed', e);
    res.status(500).json({ error: 'Failed to update dashboard', details: e.message });
  }
};

export const deleteDealDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertAuth(req, res)) return;
    const user = req.user;
    const userId = req.userId;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const existing = await prisma.dealDashboard.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (!canWriteDashboard({ dashboard: existing, userId })) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.dealDashboard.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e: any) {
    console.error('deleteDealDashboard failed', e);
    res.status(500).json({ error: 'Failed to delete dashboard', details: e.message });
  }
};

export const updateMyDashboardPrefs = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertAuth(req, res)) return;
    const user = req.user;
    const userId = req.userId;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const userRoleIds = user.roleId ? [user.roleId as number] : [];

    const dashboard = await prisma.dealDashboard.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!dashboard) return res.status(404).json({ error: 'Not found' });
    if (!canReadDashboard({ dashboard, userId, userRoleIds })) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { order, isPinned, isCollapsed } = req.body as {
      order?: number;
      isPinned?: boolean;
      isCollapsed?: boolean;
    };

    const maxOrder = await prisma.dealDashboardUserPref.aggregate({
      where: { userId },
      _max: { order: true },
    });
    const defaultOrder = (maxOrder._max.order ?? -1) + 1;

    const pref = await prisma.dealDashboardUserPref.upsert({
      where: { dashboardId_userId: { dashboardId: id, userId } },
      create: {
        dashboardId: id,
        userId,
        order: order ?? defaultOrder,
        isPinned: isPinned ?? false,
        isCollapsed: isCollapsed ?? false,
      },
      update: {
        ...(order !== undefined ? { order } : {}),
        ...(isPinned !== undefined ? { isPinned } : {}),
        ...(isCollapsed !== undefined ? { isCollapsed } : {}),
      },
    });

    res.json(pref);
  } catch (e: any) {
    console.error('updateMyDashboardPrefs failed', e);
    res.status(500).json({ error: 'Failed to update prefs', details: e.message });
  }
};

export const reorderMyDashboards = async (req: AuthRequest, res: Response) => {
  try {
    if (!assertAuth(req, res)) return;
    const user = req.user;
    const userId = req.userId;

    const { orderedIds } = req.body as { orderedIds: number[] };
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' });

    const userRoleIds = user.roleId ? [user.roleId as number] : [];

    const dashboards = await prisma.dealDashboard.findMany({
      where: { companyId: user.companyId, id: { in: orderedIds.map((n) => Number(n)).filter((n) => !Number.isNaN(n)) } },
      include: { roleShares: true, userShares: true },
    });
    const byId = new Map(dashboards.map((d) => [d.id, d]));

    const allowedInOrder = orderedIds
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id))
      .map((id) => byId.get(id))
      .filter((d): d is any => !!d)
      .filter((d) => canReadDashboard({ dashboard: d, userId, userRoleIds }));

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        allowedInOrder.map((d, index) =>
          tx.dealDashboardUserPref.upsert({
            where: { dashboardId_userId: { dashboardId: d.id, userId } },
            create: {
              dashboardId: d.id,
              userId,
              order: index,
              isPinned: false,
              isCollapsed: false,
            },
            update: { order: index },
          })
        )
      );
    });

    res.json({ ok: true });
  } catch (e: any) {
    console.error('reorderMyDashboards failed', e);
    res.status(500).json({ error: 'Failed to reorder', details: e.message });
  }
};
