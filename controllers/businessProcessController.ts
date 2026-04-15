import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all business processes for a company/branch
export const getBusinessProcesses = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, branchId, status } = req.query;
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
      // If company but no branch, get company-wide processes
      where.branchId = null;
    }
    if (status) {
      where.status = status;
    }

    const processes = await prisma.businessProcess.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(processes);
  } catch (error: any) {
    console.error('Get business processes error:', error);
    res.status(500).json({ error: 'Failed to fetch business processes', details: error.message });
  }
};

// Get a single business process
export const getBusinessProcess = async (req: AuthRequest, res: Response) => {
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

    const process = await prisma.businessProcess.findUnique({
      where: { id: parseInt(id) }
    });

    if (!process) {
      return res.status(404).json({ error: 'Business process not found' });
    }

    // Check if process belongs to user's company/branch
    if (process.companyId !== user.companyId || 
        (process.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(process);
  } catch (error: any) {
    console.error('Get business process error:', error);
    res.status(500).json({ error: 'Failed to fetch business process', details: error.message });
  }
};

// Create a business process
export const createBusinessProcess = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, description, trigger, status, isActive, steps, conditions, settings } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const process = await prisma.businessProcess.create({
      data: {
        name,
        description: description || null,
        trigger: trigger || 'MANUAL',
        status: status || 'DRAFT',
        isActive: isActive !== undefined ? isActive : false,
        steps: steps || null,
        conditions: conditions || null,
        settings: settings || null,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    // Log activity for business process creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'business_process_created',
        message: `${userContext.name || 'User'} created business process "${name}"`,
        userId: userContext.id,
        companyId: process.companyId || userContext.companyId || undefined,
        branchId: process.branchId || userContext.branchId || undefined,
        entityType: 'BUSINESS_PROCESS',
        entityId: process.id,
      });
    }

    res.status(201).json(process);
  } catch (error: any) {
    console.error('Create business process error:', error);
    res.status(500).json({ error: 'Failed to create business process', details: error.message });
  }
};

// Update a business process
export const updateBusinessProcess = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, trigger, status, isActive, steps, conditions, settings } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const process = await prisma.businessProcess.findUnique({
      where: { id: parseInt(id) }
    });

    if (!process) {
      return res.status(404).json({ error: 'Business process not found' });
    }

    // Check if process belongs to user's company/branch
    if (process.companyId !== user.companyId || 
        (process.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (steps !== undefined) updateData.steps = steps || null;
    if (conditions !== undefined) updateData.conditions = conditions || null;
    if (settings !== undefined) updateData.settings = settings || null;

    const updatedProcess = await prisma.businessProcess.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Log activity for business process update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'business_process_updated',
        message: `${userContext.name || 'User'} updated business process "${updatedProcess.name}"`,
        userId: userContext.id,
        companyId: updatedProcess.companyId || userContext.companyId || undefined,
        branchId: updatedProcess.branchId || userContext.branchId || undefined,
        entityType: 'BUSINESS_PROCESS',
        entityId: updatedProcess.id,
      });
    }

    res.json(updatedProcess);
  } catch (error: any) {
    console.error('Update business process error:', error);
    res.status(500).json({ error: 'Failed to update business process', details: error.message });
  }
};

// Delete a business process
export const deleteBusinessProcess = async (req: AuthRequest, res: Response) => {
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

    const process = await prisma.businessProcess.findUnique({
      where: { id: parseInt(id) }
    });

    if (!process) {
      return res.status(404).json({ error: 'Business process not found' });
    }

    // Check if process belongs to user's company/branch
    if (process.companyId !== user.companyId || 
        (process.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Prevent deletion of active processes
    if (process.status === 'ACTIVE' && process.isActive) {
      return res.status(400).json({ 
        error: 'Cannot delete active business process',
        details: 'Please deactivate the process before deleting it.'
      });
    }

    // Log activity for business process deletion
    const userContext = await getUserContext(userId);
    if (userContext && process) {
      await logActivity({
        type: 'business_process_deleted',
        message: `${userContext.name || 'User'} deleted business process "${process.name}"`,
        userId: userContext.id,
        companyId: process.companyId || userContext.companyId || undefined,
        branchId: process.branchId || userContext.branchId || undefined,
        entityType: 'BUSINESS_PROCESS',
        entityId: parseInt(id),
      });
    }

    await prisma.businessProcess.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete business process error:', error);
    res.status(500).json({ error: 'Failed to delete business process', details: error.message });
  }
};

// Activate/Deactivate a business process
export const toggleBusinessProcess = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const process = await prisma.businessProcess.findUnique({
      where: { id: parseInt(id) }
    });

    if (!process) {
      return res.status(404).json({ error: 'Business process not found' });
    }

    // Check if process belongs to user's company/branch
    if (process.companyId !== user.companyId || 
        (process.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // If activating, ensure process is in ACTIVE status
    if (isActive && process.status !== 'ACTIVE') {
      return res.status(400).json({ 
        error: 'Cannot activate process',
        details: 'Process must be in ACTIVE status before it can be activated.'
      });
    }

    const updatedProcess = await prisma.businessProcess.update({
      where: { id: parseInt(id) },
      data: { 
        isActive: isActive !== undefined ? isActive : !process.isActive,
        status: isActive ? 'ACTIVE' : process.status
      }
    });

    res.json(updatedProcess);
  } catch (error: any) {
    console.error('Toggle business process error:', error);
    res.status(500).json({ error: 'Failed to toggle business process', details: error.message });
  }
};













