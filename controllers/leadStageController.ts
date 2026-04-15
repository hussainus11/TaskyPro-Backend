import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all lead stages for a company/branch
export const getLeadStages = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide stages
      where.branchId = null;
    }

    const stages = await prisma.leadStage.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { order: 'asc' }
      ]
    });

    res.json(stages);
  } catch (error: any) {
    console.error('Get lead stages error:', error);
    res.status(500).json({ error: 'Failed to fetch lead stages', details: error.message });
  }
};

// Create a lead stage
export const createLeadStage = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Create lead stage - req.body:', req.body);
    console.log('Create lead stage - Content-Type:', req.headers['content-type']);
    console.log('Create lead stage - Method:', req.method);
    
    // Check if body exists
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required', received: typeof req.body });
    }

    // Check if body is an empty object
    if (typeof req.body === 'object' && Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body cannot be empty' });
    }

    const { name, color, order, type, companyId, branchId } = req.body;
    const userId = req.userId;

    if (!name || !color || order === undefined || !type) {
      return res.status(400).json({ error: 'Name, color, order, and type are required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const finalCompanyId = companyId || user.companyId;
    const finalBranchId = branchId || user.branchId;

    const stage = await prisma.leadStage.create({
      data: {
        name,
        color,
        order: parseInt(order),
        type,
        companyId: finalCompanyId,
        branchId: finalBranchId
      }
    });

    res.status(201).json(stage);
  } catch (error: any) {
    console.error('Create lead stage error:', error);
    res.status(500).json({ error: 'Failed to create lead stage', details: error.message });
  }
};

// Update a lead stage
export const updateLeadStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, order, type } = req.body;

    // Verify ownership
    const existingStage = await prisma.leadStage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingStage) {
      return res.status(404).json({ error: 'Lead stage not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = parseInt(order);
    if (type !== undefined) updateData.type = type;

    const stage = await prisma.leadStage.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(stage);
  } catch (error: any) {
    console.error('Update lead stage error:', error);
    res.status(500).json({ error: 'Failed to update lead stage', details: error.message });
  }
};

// Delete a lead stage
export const deleteLeadStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const stage = await prisma.leadStage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!stage) {
      return res.status(404).json({ error: 'Lead stage not found' });
    }

    await prisma.leadStage.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Lead stage deleted successfully' });
  } catch (error: any) {
    console.error('Delete lead stage error:', error);
    res.status(500).json({ error: 'Failed to delete lead stage', details: error.message });
  }
};

// Reorder lead stages
export const reorderLeadStages = async (req: AuthRequest, res: Response) => {
  try {
    const { stages } = req.body; // Array of { id, order }

    if (!Array.isArray(stages)) {
      return res.status(400).json({ error: 'Stages must be an array' });
    }

    // Update all stages in a transaction
    await prisma.$transaction(
      stages.map((stage: { id: number; order: number }) =>
        prisma.leadStage.update({
          where: { id: stage.id },
          data: { order: stage.order }
        })
      )
    );

    res.json({ message: 'Lead stages reordered successfully' });
  } catch (error: any) {
    console.error('Reorder lead stages error:', error);
    res.status(500).json({ error: 'Failed to reorder lead stages', details: error.message });
  }
};

