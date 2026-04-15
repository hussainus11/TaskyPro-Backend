import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all taxes for a company/branch
export const getTaxes = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide taxes
      where.branchId = null;
    }

    const taxes = await prisma.tax.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json(taxes);
  } catch (error: any) {
    console.error('Get taxes error:', error);
    res.status(500).json({ error: 'Failed to fetch taxes', details: error.message });
  }
};

// Create a tax
export const createTax = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, rate, description, isDefault, isActive } = req.body;
    const userId = req.userId;

    if (!name || rate === undefined) {
      return res.status(400).json({ error: 'Name and rate are required' });
    }

    if (rate < 0 || rate > 100) {
      return res.status(400).json({ error: 'Rate must be between 0 and 100' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.tax.updateMany({
        where: {
          companyId: user.companyId,
          branchId: user.branchId || null,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const tax = await prisma.tax.create({
      data: {
        name,
        rate: parseFloat(rate),
        description: description || null,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(tax);
  } catch (error: any) {
    console.error('Create tax error:', error);
    res.status(500).json({ error: 'Failed to create tax', details: error.message });
  }
};

// Update a tax
export const updateTax = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, rate, description, isDefault, isActive } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tax = await prisma.tax.findUnique({
      where: { id: parseInt(id) }
    });

    if (!tax) {
      return res.status(404).json({ error: 'Tax not found' });
    }

    // Check if tax belongs to user's company/branch
    if (tax.companyId !== user.companyId || 
        (tax.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Validate rate if provided
    if (rate !== undefined && (rate < 0 || rate > 100)) {
      return res.status(400).json({ error: 'Rate must be between 0 and 100' });
    }

    // If setting as default, unset other defaults
    if (isDefault && !tax.isDefault) {
      await prisma.tax.updateMany({
        where: {
          companyId: user.companyId,
          branchId: user.branchId || null,
          isDefault: true,
          id: { not: parseInt(id) }
        },
        data: { isDefault: false }
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (rate !== undefined) updateData.rate = parseFloat(rate);
    if (description !== undefined) updateData.description = description || null;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedTax = await prisma.tax.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(updatedTax);
  } catch (error: any) {
    console.error('Update tax error:', error);
    res.status(500).json({ error: 'Failed to update tax', details: error.message });
  }
};

// Delete a tax
export const deleteTax = async (req: AuthRequest, res: Response) => {
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

    const tax = await prisma.tax.findUnique({
      where: { id: parseInt(id) }
    });

    if (!tax) {
      return res.status(404).json({ error: 'Tax not found' });
    }

    // Check if tax belongs to user's company/branch
    if (tax.companyId !== user.companyId || 
        (tax.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.tax.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete tax error:', error);
    res.status(500).json({ error: 'Failed to delete tax', details: error.message });
  }
};








































































