import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all company types for a company/branch
export const getCompanyTypes = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide company types
      where.branchId = null;
    }

    const companyTypes = await prisma.companyType.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    res.json(companyTypes);
  } catch (error: any) {
    console.error('Get company types error:', error);
    res.status(500).json({ error: 'Failed to fetch company types', details: error.message });
  }
};

// Create a company type
export const createCompanyType = async (req: AuthRequest, res: Response) => {
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

    const companyType = await prisma.companyType.create({
      data: {
        name,
        color,
        order: parseInt(order),
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(companyType);
  } catch (error: any) {
    console.error('Create company type error:', error);
    res.status(500).json({ error: 'Failed to create company type', details: error.message });
  }
};

// Update a company type
export const updateCompanyType = async (req: AuthRequest, res: Response) => {
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

    const companyType = await prisma.companyType.findUnique({
      where: { id: parseInt(id) }
    });

    if (!companyType) {
      return res.status(404).json({ error: 'Company type not found' });
    }

    // Check if company type belongs to user's company/branch
    if (companyType.companyId !== user.companyId || 
        (companyType.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedCompanyType = await prisma.companyType.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(order !== undefined && { order: parseInt(order) })
      }
    });

    res.json(updatedCompanyType);
  } catch (error: any) {
    console.error('Update company type error:', error);
    res.status(500).json({ error: 'Failed to update company type', details: error.message });
  }
};

// Delete a company type
export const deleteCompanyType = async (req: AuthRequest, res: Response) => {
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

    const companyType = await prisma.companyType.findUnique({
      where: { id: parseInt(id) }
    });

    if (!companyType) {
      return res.status(404).json({ error: 'Company type not found' });
    }

    // Check if company type belongs to user's company/branch
    if (companyType.companyId !== user.companyId || 
        (companyType.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.companyType.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete company type error:', error);
    res.status(500).json({ error: 'Failed to delete company type', details: error.message });
  }
};

// Reorder company types
export const reorderCompanyTypes = async (req: AuthRequest, res: Response) => {
  try {
    const { companyTypes: reorderedCompanyTypes } = req.body; // Expects [{ id: number, order: number }]
    const userId = req.userId;

    if (!Array.isArray(reorderedCompanyTypes)) {
      return res.status(400).json({ error: 'Invalid company types data provided' });
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
      reorderedCompanyTypes.map((companyType: { id: number; order: number }) =>
        prisma.companyType.updateMany({
          where: {
            id: companyType.id,
            companyId: user.companyId,
            branchId: user.branchId || null
          },
          data: { order: companyType.order }
        })
      )
    );

    res.status(200).json({ message: 'Company types reordered successfully' });
  } catch (error: any) {
    console.error('Reorder company types error:', error);
    res.status(500).json({ error: 'Failed to reorder company types', details: error.message });
  }
};











































































