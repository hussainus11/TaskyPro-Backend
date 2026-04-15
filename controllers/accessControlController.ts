import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all access controls for a company/branch
export const getAccessControls = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide access controls
      where.branchId = null;
    }

    const accessControls = await prisma.accessControl.findMany({
      where,
      orderBy: [
        { resource: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json(accessControls);
  } catch (error: any) {
    console.error('Get access controls error:', error);
    res.status(500).json({ error: 'Failed to fetch access controls', details: error.message });
  }
};

// Create an access control
export const createAccessControl = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, resource, action, conditions, isActive } = req.body;
    const userId = req.userId;

    if (!name || !resource || !action) {
      return res.status(400).json({ error: 'Name, resource, and action are required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accessControl = await prisma.accessControl.create({
      data: {
        name,
        resource,
        action,
        conditions: conditions || null,
        isActive: isActive !== undefined ? isActive : true,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    // Log activity for access control creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'access_control_created',
        message: `${userContext.name || 'User'} created access control "${name}"`,
        userId: userContext.id,
        companyId: accessControl.companyId || userContext.companyId || undefined,
        branchId: accessControl.branchId || userContext.branchId || undefined,
        entityType: 'ACCESS_CONTROL',
        entityId: accessControl.id,
      });
    }

    res.status(201).json(accessControl);
  } catch (error: any) {
    console.error('Create access control error:', error);
    res.status(500).json({ error: 'Failed to create access control', details: error.message });
  }
};

// Update an access control
export const updateAccessControl = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, resource, action, conditions, isActive } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accessControl = await prisma.accessControl.findUnique({
      where: { id: parseInt(id) }
    });

    if (!accessControl) {
      return res.status(404).json({ error: 'Access control not found' });
    }

    // Check if access control belongs to user's company/branch
    if (accessControl.companyId !== user.companyId || 
        (accessControl.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (resource !== undefined) updateData.resource = resource;
    if (action !== undefined) updateData.action = action;
    if (conditions !== undefined) updateData.conditions = conditions || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedAccessControl = await prisma.accessControl.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Log activity for access control update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'access_control_updated',
        message: `${userContext.name || 'User'} updated access control "${updatedAccessControl.name}"`,
        userId: userContext.id,
        companyId: updatedAccessControl.companyId || userContext.companyId || undefined,
        branchId: updatedAccessControl.branchId || userContext.branchId || undefined,
        entityType: 'ACCESS_CONTROL',
        entityId: updatedAccessControl.id,
      });
    }

    res.json(updatedAccessControl);
  } catch (error: any) {
    console.error('Update access control error:', error);
    res.status(500).json({ error: 'Failed to update access control', details: error.message });
  }
};

// Delete an access control
export const deleteAccessControl = async (req: AuthRequest, res: Response) => {
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

    const accessControl = await prisma.accessControl.findUnique({
      where: { id: parseInt(id) }
    });

    if (!accessControl) {
      return res.status(404).json({ error: 'Access control not found' });
    }

    // Check if access control belongs to user's company/branch
    if (accessControl.companyId !== user.companyId || 
        (accessControl.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Log activity for access control deletion
    const userContext = await getUserContext(userId);
    if (userContext && accessControl) {
      await logActivity({
        type: 'access_control_deleted',
        message: `${userContext.name || 'User'} deleted access control "${accessControl.name}"`,
        userId: userContext.id,
        companyId: accessControl.companyId || userContext.companyId || undefined,
        branchId: accessControl.branchId || userContext.branchId || undefined,
        entityType: 'ACCESS_CONTROL',
        entityId: parseInt(id),
      });
    }

    await prisma.accessControl.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete access control error:', error);
    res.status(500).json({ error: 'Failed to delete access control', details: error.message });
  }
};

// Check if user can drag-drop a resource from one stage to another
export const checkDragDropPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { resource, fromStageId, toStageId, pipelineId } = req.body;
    const userId = req.userId;

    if (!resource || fromStageId === undefined || toStageId === undefined) {
      return res.status(400).json({ error: 'resource, fromStageId, and toStageId are required' });
    }

    // For deals, pipelineId is required
    if (resource === 'deals' && !pipelineId) {
      return res.status(400).json({ error: 'pipelineId is required for deals' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const where: any = {
      resource: resource,
      action: 'drag-drop',
      isActive: true
    };
    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }

    // Get all active drag-drop access controls for this resource
    const accessControls = await prisma.accessControl.findMany({
      where
    });

    if (accessControls.length === 0) {
      // No access controls defined, allow by default
      return res.json({ allowed: true });
    }

    // Check if any access control allows this operation
    for (const accessControl of accessControls) {
      const conditions = accessControl.conditions as any;
      
      if (!conditions) {
        // No conditions means allow all
        return res.json({ allowed: true });
      }

      // For deals, check pipeline match
      if (resource === 'deals' && conditions.pipelineId) {
        if (conditions.pipelineId !== parseInt(pipelineId)) {
          continue; // Pipeline doesn't match, skip this rule
        }
      }

      // Check user permission
      if (conditions.userIds && Array.isArray(conditions.userIds)) {
        if (!conditions.userIds.includes(userId)) {
          continue; // User not in allowed list, skip this rule
        }
      }

      // Check from stage permission
      if (conditions.fromStages && Array.isArray(conditions.fromStages) && conditions.fromStages.length > 0) {
        if (!conditions.fromStages.includes(parseInt(fromStageId))) {
          continue; // From stage not allowed, skip this rule
        }
      }

      // Check to stage permission
      if (conditions.toStages && Array.isArray(conditions.toStages) && conditions.toStages.length > 0) {
        if (!conditions.toStages.includes(parseInt(toStageId))) {
          continue; // To stage not allowed, skip this rule
        }
      }

      // All conditions met, allow the operation
      return res.json({ allowed: true });
    }

    // No access control allowed this operation
    return res.json({ allowed: false });
  } catch (error: any) {
    console.error('Check drag-drop permission error:', error);
    res.status(500).json({ error: 'Failed to check drag-drop permission', details: error.message });
  }
};













