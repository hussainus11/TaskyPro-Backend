import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all salutations for a company/branch
export const getSalutations = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide salutations
      where.branchId = null;
    }

    const salutations = await prisma.salutation.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    res.json(salutations);
  } catch (error: any) {
    console.error('Get salutations error:', error);
    res.status(500).json({ error: 'Failed to fetch salutations', details: error.message });
  }
};

// Create a salutation
export const createSalutation = async (req: AuthRequest, res: Response) => {
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

    const salutation = await prisma.salutation.create({
      data: {
        name,
        color,
        order: parseInt(order),
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(salutation);
  } catch (error: any) {
    console.error('Create salutation error:', error);
    res.status(500).json({ error: 'Failed to create salutation', details: error.message });
  }
};

// Update a salutation
export const updateSalutation = async (req: AuthRequest, res: Response) => {
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

    const salutation = await prisma.salutation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!salutation) {
      return res.status(404).json({ error: 'Salutation not found' });
    }

    // Check if salutation belongs to user's company/branch
    if (salutation.companyId !== user.companyId || 
        (salutation.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedSalutation = await prisma.salutation.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(order !== undefined && { order: parseInt(order) })
      }
    });

    res.json(updatedSalutation);
  } catch (error: any) {
    console.error('Update salutation error:', error);
    res.status(500).json({ error: 'Failed to update salutation', details: error.message });
  }
};

// Delete a salutation
export const deleteSalutation = async (req: AuthRequest, res: Response) => {
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

    const salutation = await prisma.salutation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!salutation) {
      return res.status(404).json({ error: 'Salutation not found' });
    }

    // Check if salutation belongs to user's company/branch
    if (salutation.companyId !== user.companyId || 
        (salutation.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.salutation.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete salutation error:', error);
    res.status(500).json({ error: 'Failed to delete salutation', details: error.message });
  }
};

// Reorder salutations
export const reorderSalutations = async (req: AuthRequest, res: Response) => {
  try {
    const { salutations: reorderedSalutations } = req.body; // Expects [{ id: number, order: number }]
    const userId = req.userId;

    if (!Array.isArray(reorderedSalutations)) {
      return res.status(400).json({ error: 'Invalid salutations data provided' });
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
      reorderedSalutations.map((salutation: { id: number; order: number }) =>
        prisma.salutation.updateMany({
          where: {
            id: salutation.id,
            companyId: user.companyId,
            branchId: user.branchId || null
          },
          data: { order: salutation.order }
        })
      )
    );

    res.status(200).json({ message: 'Salutations reordered successfully' });
  } catch (error: any) {
    console.error('Reorder salutations error:', error);
    res.status(500).json({ error: 'Failed to reorder salutations', details: error.message });
  }
};

