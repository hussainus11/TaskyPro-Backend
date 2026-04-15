import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all system settings
export const getSystemSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const filterCompanyId = companyId ? parseInt(companyId as string) : user.companyId;
    const filterBranchId = branchId ? parseInt(branchId as string) : user.branchId;

    const where: any = {};
    if (filterCompanyId !== null && filterCompanyId !== undefined) {
      where.companyId = filterCompanyId;
    }
    if (filterBranchId !== null && filterBranchId !== undefined) {
      where.branchId = filterBranchId;
    } else if (filterCompanyId !== null && filterCompanyId !== undefined) {
      where.branchId = null;
    }

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: { key: 'asc' }
    });

    // Convert to key-value object
    const settingsObj: Record<string, any> = {};
    settings.forEach((setting) => {
      try {
        settingsObj[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsObj[setting.key] = setting.value;
      }
    });

    res.json(settingsObj);
  } catch (error: any) {
    console.error('Get system settings error:', error);
    res.status(500).json({ error: 'Failed to fetch system settings', details: error.message });
  }
};

// Update system settings
export const updateSystemSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const settings = req.body;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const companyId = user.companyId;
    const branchId = user.branchId;

    const companyIdValue = companyId ?? null;
    const branchIdValue = branchId ?? null;

    // Prisma doesn't allow `null` in compound-unique selectors for upsert,
    // so we do findFirst -> update/create instead.
    const updates = Object.keys(settings || {}).map(async (key) => {
      const raw = (settings as any)[key];
      const value = typeof raw === 'object' ? JSON.stringify(raw) : String(raw);

      const existing = await prisma.systemSetting.findFirst({
        where: {
          key,
          companyId: companyIdValue,
          branchId: branchIdValue,
        },
        select: { id: true }
      });

      if (existing) {
        return prisma.systemSetting.update({
          where: { id: existing.id },
          data: { value }
        });
      }

      return prisma.systemSetting.create({
        data: {
          key,
          value,
          companyId: companyIdValue,
          branchId: branchIdValue
        }
      });
    });

    await Promise.all(updates);

    res.json({ message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Update system settings error:', error);
    res.status(500).json({ error: 'Failed to update system settings', details: error.message });
  }
};

