import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all estimate stages for a company/branch
export const getEstimateStages = async (req: AuthRequest, res: Response) => {
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

    const stages = await prisma.estimateStage.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { order: 'asc' }
      ]
    });

    res.json(stages);
  } catch (error: any) {
    console.error('Get estimate stages error:', error);
    res.status(500).json({ error: 'Failed to fetch estimate stages', details: error.message });
  }
};

// Create an estimate stage
export const createEstimateStage = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Create estimate stage - req.body:', req.body);
    console.log('Create estimate stage - Content-Type:', req.headers['content-type']);
    console.log('Create estimate stage - Method:', req.method);
    
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

    const stage = await prisma.estimateStage.create({
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
    console.error('Create estimate stage error:', error);
    res.status(500).json({ error: 'Failed to create estimate stage', details: error.message });
  }
};

// Update an estimate stage
export const updateEstimateStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, order, type } = req.body;

    // Verify ownership
    const existingStage = await prisma.estimateStage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingStage) {
      return res.status(404).json({ error: 'Estimate stage not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = parseInt(order);
    if (type !== undefined) updateData.type = type;

    const stage = await prisma.estimateStage.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(stage);
  } catch (error: any) {
    console.error('Update estimate stage error:', error);
    res.status(500).json({ error: 'Failed to update estimate stage', details: error.message });
  }
};

// Delete an estimate stage
export const deleteEstimateStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const stage = await prisma.estimateStage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!stage) {
      return res.status(404).json({ error: 'Estimate stage not found' });
    }

    await prisma.estimateStage.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Estimate stage deleted successfully' });
  } catch (error: any) {
    console.error('Delete estimate stage error:', error);
    res.status(500).json({ error: 'Failed to delete estimate stage', details: error.message });
  }
};

// Reorder estimate stages
export const reorderEstimateStages = async (req: AuthRequest, res: Response) => {
  try {
    const { stages } = req.body; // Array of { id, order }

    if (!Array.isArray(stages)) {
      return res.status(400).json({ error: 'Stages must be an array' });
    }

    // Update all stages in a transaction
    await prisma.$transaction(
      stages.map((stage: { id: number; order: number }) =>
        prisma.estimateStage.update({
          where: { id: stage.id },
          data: { order: stage.order }
        })
      )
    );

    res.json({ message: 'Estimate stages reordered successfully' });
  } catch (error: any) {
    console.error('Reorder estimate stages error:', error);
    res.status(500).json({ error: 'Failed to reorder estimate stages', details: error.message });
  }
};


