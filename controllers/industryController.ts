import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all industries for a company/branch
export const getIndustries = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide industries
      where.branchId = null;
    }

    const industries = await prisma.industry.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    res.json(industries);
  } catch (error: any) {
    console.error('Get industries error:', error);
    res.status(500).json({ error: 'Failed to fetch industries', details: error.message });
  }
};

// Create an industry
export const createIndustry = async (req: AuthRequest, res: Response) => {
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

    const industry = await prisma.industry.create({
      data: {
        name,
        color,
        order: parseInt(order),
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(industry);
  } catch (error: any) {
    console.error('Create industry error:', error);
    res.status(500).json({ error: 'Failed to create industry', details: error.message });
  }
};

// Update an industry
export const updateIndustry = async (req: AuthRequest, res: Response) => {
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

    const industry = await prisma.industry.findUnique({
      where: { id: parseInt(id) }
    });

    if (!industry) {
      return res.status(404).json({ error: 'Industry not found' });
    }

    // Check if industry belongs to user's company/branch
    if (industry.companyId !== user.companyId || 
        (industry.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedIndustry = await prisma.industry.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(order !== undefined && { order: parseInt(order) })
      }
    });

    res.json(updatedIndustry);
  } catch (error: any) {
    console.error('Update industry error:', error);
    res.status(500).json({ error: 'Failed to update industry', details: error.message });
  }
};

// Delete an industry
export const deleteIndustry = async (req: AuthRequest, res: Response) => {
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

    const industry = await prisma.industry.findUnique({
      where: { id: parseInt(id) }
    });

    if (!industry) {
      return res.status(404).json({ error: 'Industry not found' });
    }

    // Check if industry belongs to user's company/branch
    if (industry.companyId !== user.companyId || 
        (industry.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.industry.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete industry error:', error);
    res.status(500).json({ error: 'Failed to delete industry', details: error.message });
  }
};

// Reorder industries
export const reorderIndustries = async (req: AuthRequest, res: Response) => {
  try {
    const { industries: reorderedIndustries } = req.body; // Expects [{ id: number, order: number }]
    const userId = req.userId;

    if (!Array.isArray(reorderedIndustries)) {
      return res.status(400).json({ error: 'Invalid industries data provided' });
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
      reorderedIndustries.map((industry: { id: number; order: number }) =>
        prisma.industry.updateMany({
          where: {
            id: industry.id,
            companyId: user.companyId,
            branchId: user.branchId || null
          },
          data: { order: industry.order }
        })
      )
    );

    res.status(200).json({ message: 'Industries reordered successfully' });
  } catch (error: any) {
    console.error('Reorder industries error:', error);
    res.status(500).json({ error: 'Failed to reorder industries', details: error.message });
  }
};











































































