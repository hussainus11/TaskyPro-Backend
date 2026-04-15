import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all security settings for a company/branch
export const getSecurities = async (req: AuthRequest, res: Response) => {
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
    if (filterCompanyId) {
      where.companyId = filterCompanyId;
    }
    if (filterBranchId) {
      where.branchId = filterBranchId;
    } else if (filterCompanyId) {
      // If company but no branch, get company-wide security settings
      where.branchId = null;
    }

    const securities = await prisma.security.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json(securities);
  } catch (error: any) {
    console.error('Get securities error:', error);
    res.status(500).json({ error: 'Failed to fetch security settings', details: error.message });
  }
};

// Create a security setting
export const createSecurity = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, type, value, config, description, isActive } = req.body;
    const userId = req.userId;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const security = await prisma.security.create({
      data: {
        name,
        type,
        value: value || null,
        config: config || null,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    // Log activity for security setting creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'security_created',
        message: `${userContext.name || 'User'} created security setting "${name}"`,
        userId: userContext.id,
        companyId: security.companyId || userContext.companyId || undefined,
        branchId: security.branchId || userContext.branchId || undefined,
        entityType: 'SECURITY',
        entityId: security.id,
      });
    }

    res.status(201).json(security);
  } catch (error: any) {
    console.error('Create security error:', error);
    res.status(500).json({ error: 'Failed to create security setting', details: error.message });
  }
};

// Update a security setting
export const updateSecurity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, value, config, description, isActive } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const security = await prisma.security.findUnique({
      where: { id: parseInt(id) }
    });

    if (!security) {
      return res.status(404).json({ error: 'Security setting not found' });
    }

    // Check if security setting belongs to user's company/branch
    if (security.companyId !== user.companyId || 
        (security.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = value || null;
    if (config !== undefined) updateData.config = config || null;
    if (description !== undefined) updateData.description = description || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSecurity = await prisma.security.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Log activity for security setting update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'security_updated',
        message: `${userContext.name || 'User'} updated security setting "${updatedSecurity.name}"`,
        userId: userContext.id,
        companyId: updatedSecurity.companyId || userContext.companyId || undefined,
        branchId: updatedSecurity.branchId || userContext.branchId || undefined,
        entityType: 'SECURITY',
        entityId: updatedSecurity.id,
      });
    }

    res.json(updatedSecurity);
  } catch (error: any) {
    console.error('Update security error:', error);
    res.status(500).json({ error: 'Failed to update security setting', details: error.message });
  }
};

// Delete a security setting
export const deleteSecurity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const security = await prisma.security.findUnique({
      where: { id: parseInt(id) }
    });

    if (!security) {
      return res.status(404).json({ error: 'Security setting not found' });
    }

    // Check if security setting belongs to user's company/branch
    if (security.companyId !== user.companyId || 
        (security.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Log activity for security setting deletion
    const userContext = await getUserContext(userId);
    if (userContext && security) {
      await logActivity({
        type: 'security_deleted',
        message: `${userContext.name || 'User'} deleted security setting "${security.name}"`,
        userId: userContext.id,
        companyId: security.companyId || userContext.companyId || undefined,
        branchId: security.branchId || userContext.branchId || undefined,
        entityType: 'SECURITY',
        entityId: parseInt(id),
      });
    }

    await prisma.security.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete security error:', error);
    res.status(500).json({ error: 'Failed to delete security setting', details: error.message });
  }
};













