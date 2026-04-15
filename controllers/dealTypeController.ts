import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all deal types for a company/branch
export const getDealTypes = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide deal types
      where.branchId = null;
    }

    const dealTypes = await prisma.dealType.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    res.json(dealTypes);
  } catch (error: any) {
    console.error('Get deal types error:', error);
    res.status(500).json({ error: 'Failed to fetch deal types', details: error.message });
  }
};

// Create a deal type
export const createDealType = async (req: AuthRequest, res: Response) => {
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

    const dealType = await prisma.dealType.create({
      data: {
        name,
        color,
        order: parseInt(order),
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(dealType);
  } catch (error: any) {
    console.error('Create deal type error:', error);
    res.status(500).json({ error: 'Failed to create deal type', details: error.message });
  }
};

// Update a deal type
export const updateDealType = async (req: AuthRequest, res: Response) => {
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

    const dealType = await prisma.dealType.findUnique({
      where: { id: parseInt(id) }
    });

    if (!dealType) {
      return res.status(404).json({ error: 'Deal type not found' });
    }

    // Check if deal type belongs to user's company/branch
    if (dealType.companyId !== user.companyId || 
        (dealType.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedDealType = await prisma.dealType.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(order !== undefined && { order: parseInt(order) })
      }
    });

    res.json(updatedDealType);
  } catch (error: any) {
    console.error('Update deal type error:', error);
    res.status(500).json({ error: 'Failed to update deal type', details: error.message });
  }
};

// Delete a deal type
export const deleteDealType = async (req: AuthRequest, res: Response) => {
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

    const dealType = await prisma.dealType.findUnique({
      where: { id: parseInt(id) }
    });

    if (!dealType) {
      return res.status(404).json({ error: 'Deal type not found' });
    }

    // Check if deal type belongs to user's company/branch
    if (dealType.companyId !== user.companyId || 
        (dealType.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.dealType.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete deal type error:', error);
    res.status(500).json({ error: 'Failed to delete deal type', details: error.message });
  }
};

// Reorder deal types
export const reorderDealTypes = async (req: AuthRequest, res: Response) => {
  try {
    const { dealTypes: reorderedDealTypes } = req.body; // Expects [{ id: number, order: number }]
    const userId = req.userId;

    if (!Array.isArray(reorderedDealTypes)) {
      return res.status(400).json({ error: 'Invalid deal types data provided' });
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
      reorderedDealTypes.map((dealType: { id: number; order: number }) =>
        prisma.dealType.updateMany({
          where: {
            id: dealType.id,
            companyId: user.companyId,
            branchId: user.branchId || null
          },
          data: { order: dealType.order }
        })
      )
    );

    res.status(200).json({ message: 'Deal types reordered successfully' });
  } catch (error: any) {
    console.error('Reorder deal types error:', error);
    res.status(500).json({ error: 'Failed to reorder deal types', details: error.message });
  }
};



