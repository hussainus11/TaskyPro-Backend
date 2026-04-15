import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all document stages for a company/branch
export const getDocumentStages = async (req: AuthRequest, res: Response) => {
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

    const stages = await prisma.documentStage.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { order: 'asc' }
      ]
    });

    res.json(stages);
  } catch (error: any) {
    console.error('Get document stages error:', error);
    res.status(500).json({ error: 'Failed to fetch document stages', details: error.message });
  }
};

// Create a document stage
export const createDocumentStage = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Create document stage - req.body:', req.body);
    console.log('Create document stage - Content-Type:', req.headers['content-type']);
    console.log('Create document stage - Method:', req.method);
    
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

    const stage = await prisma.documentStage.create({
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
    console.error('Create document stage error:', error);
    res.status(500).json({ error: 'Failed to create document stage', details: error.message });
  }
};

// Update a document stage
export const updateDocumentStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, order, type } = req.body;

    // Verify ownership
    const existingStage = await prisma.documentStage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingStage) {
      return res.status(404).json({ error: 'Document stage not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = parseInt(order);
    if (type !== undefined) updateData.type = type;

    const stage = await prisma.documentStage.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(stage);
  } catch (error: any) {
    console.error('Update document stage error:', error);
    res.status(500).json({ error: 'Failed to update document stage', details: error.message });
  }
};

// Delete a document stage
export const deleteDocumentStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const stage = await prisma.documentStage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!stage) {
      return res.status(404).json({ error: 'Document stage not found' });
    }

    await prisma.documentStage.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Document stage deleted successfully' });
  } catch (error: any) {
    console.error('Delete document stage error:', error);
    res.status(500).json({ error: 'Failed to delete document stage', details: error.message });
  }
};

// Reorder document stages
export const reorderDocumentStages = async (req: AuthRequest, res: Response) => {
  try {
    const { stages } = req.body; // Array of { id, order }

    if (!Array.isArray(stages)) {
      return res.status(400).json({ error: 'Stages must be an array' });
    }

    // Update all stages in a transaction
    await prisma.$transaction(
      stages.map((stage: { id: number; order: number }) =>
        prisma.documentStage.update({
          where: { id: stage.id },
          data: { order: stage.order }
        })
      )
    );

    res.json({ message: 'Document stages reordered successfully' });
  } catch (error: any) {
    console.error('Reorder document stages error:', error);
    res.status(500).json({ error: 'Failed to reorder document stages', details: error.message });
  }
};

