import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all sources for a company/branch
export const getSources = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide sources
      where.branchId = null;
    }

    const sources = await prisma.source.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    res.json(sources);
  } catch (error: any) {
    console.error('Get sources error:', error);
    res.status(500).json({ error: 'Failed to fetch sources', details: error.message });
  }
};

// Create a source
export const createSource = async (req: AuthRequest, res: Response) => {
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

    const source = await prisma.source.create({
      data: {
        name,
        color,
        order: parseInt(order),
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(source);
  } catch (error: any) {
    console.error('Create source error:', error);
    res.status(500).json({ error: 'Failed to create source', details: error.message });
  }
};

// Update a source
export const updateSource = async (req: AuthRequest, res: Response) => {
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

    const source = await prisma.source.findUnique({
      where: { id: parseInt(id) }
    });

    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    // Check if source belongs to user's company/branch
    if (source.companyId !== user.companyId || 
        (source.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedSource = await prisma.source.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(order !== undefined && { order: parseInt(order) })
      }
    });

    res.json(updatedSource);
  } catch (error: any) {
    console.error('Update source error:', error);
    res.status(500).json({ error: 'Failed to update source', details: error.message });
  }
};

// Delete a source
export const deleteSource = async (req: AuthRequest, res: Response) => {
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

    const source = await prisma.source.findUnique({
      where: { id: parseInt(id) }
    });

    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    // Check if source belongs to user's company/branch
    if (source.companyId !== user.companyId || 
        (source.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.source.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete source error:', error);
    res.status(500).json({ error: 'Failed to delete source', details: error.message });
  }
};

// Reorder sources
export const reorderSources = async (req: AuthRequest, res: Response) => {
  try {
    const { sources: reorderedSources } = req.body; // Expects [{ id: number, order: number }]
    const userId = req.userId;

    if (!Array.isArray(reorderedSources)) {
      return res.status(400).json({ error: 'Invalid sources data provided' });
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
      reorderedSources.map((source: { id: number; order: number }) =>
        prisma.source.updateMany({
          where: {
            id: source.id,
            companyId: user.companyId,
            branchId: user.branchId || null
          },
          data: { order: source.order }
        })
      )
    );

    res.status(200).json({ message: 'Sources reordered successfully' });
  } catch (error: any) {
    console.error('Reorder sources error:', error);
    res.status(500).json({ error: 'Failed to reorder sources', details: error.message });
  }
};












































































