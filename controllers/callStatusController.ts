import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all call statuses for a company/branch
export const getCallStatuses = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide call statuses
      where.branchId = null;
    }

    const callStatuses = await prisma.callStatus.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    res.json(callStatuses);
  } catch (error: any) {
    console.error('Get call statuses error:', error);
    res.status(500).json({ error: 'Failed to fetch call statuses', details: error.message });
  }
};

// Create a call status
export const createCallStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, color, order } = req.body;
    const userId = req.userId;

    if (!name || !color || order === undefined) {
      return res.status(400).json({ error: 'Name, color, and order are required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const callStatus = await prisma.callStatus.create({
      data: {
        name,
        color,
        order: parseInt(order),
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(callStatus);
  } catch (error: any) {
    console.error('Create call status error:', error);
    res.status(500).json({ error: 'Failed to create call status', details: error.message });
  }
};

// Update a call status
export const updateCallStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const callStatus = await prisma.callStatus.findUnique({
      where: { id: parseInt(id) }
    });

    if (!callStatus) {
      return res.status(404).json({ error: 'Call status not found' });
    }

    // Check if call status belongs to user's company/branch
    if (callStatus.companyId !== user.companyId || 
        (callStatus.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedCallStatus = await prisma.callStatus.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(order !== undefined && { order: parseInt(order) })
      }
    });

    res.json(updatedCallStatus);
  } catch (error: any) {
    console.error('Update call status error:', error);
    res.status(500).json({ error: 'Failed to update call status', details: error.message });
  }
};

// Delete a call status
export const deleteCallStatus = async (req: AuthRequest, res: Response) => {
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

    const callStatus = await prisma.callStatus.findUnique({
      where: { id: parseInt(id) }
    });

    if (!callStatus) {
      return res.status(404).json({ error: 'Call status not found' });
    }

    // Check if call status belongs to user's company/branch
    if (callStatus.companyId !== user.companyId || 
        (callStatus.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.callStatus.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete call status error:', error);
    res.status(500).json({ error: 'Failed to delete call status', details: error.message });
  }
};

// Reorder call statuses
export const reorderCallStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const { callStatuses: reorderedCallStatuses } = req.body; // Expects [{ id: number, order: number }]
    const userId = req.userId;

    if (!Array.isArray(reorderedCallStatuses)) {
      return res.status(400).json({ error: 'Invalid call statuses data provided' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.$transaction(
      reorderedCallStatuses.map((callStatus: { id: number; order: number }) =>
        prisma.callStatus.updateMany({
          where: {
            id: callStatus.id,
            companyId: user.companyId,
            branchId: user.branchId || null
          },
          data: { order: callStatus.order }
        })
      )
    );

    res.status(200).json({ message: 'Call statuses reordered successfully' });
  } catch (error: any) {
    console.error('Reorder call statuses error:', error);
    res.status(500).json({ error: 'Failed to reorder call statuses', details: error.message });
  }
};

