import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all units of measurement for a company/branch
export const getUnitsOfMeasurement = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide units
      where.branchId = null;
    }

    const units = await prisma.unitOfMeasurement.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json(units);
  } catch (error: any) {
    console.error('Get units of measurement error:', error);
    res.status(500).json({ error: 'Failed to fetch units of measurement', details: error.message });
  }
};

// Create a unit of measurement
export const createUnitOfMeasurement = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, symbol, description, isDefault, isActive } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
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
      await prisma.unitOfMeasurement.updateMany({
        where: {
          companyId: user.companyId,
          branchId: user.branchId || null,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const unit = await prisma.unitOfMeasurement.create({
      data: {
        name,
        symbol: symbol || null,
        description: description || null,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(unit);
  } catch (error: any) {
    console.error('Create unit of measurement error:', error);
    res.status(500).json({ error: 'Failed to create unit of measurement', details: error.message });
  }
};

// Update a unit of measurement
export const updateUnitOfMeasurement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, symbol, description, isDefault, isActive } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const unit = await prisma.unitOfMeasurement.findUnique({
      where: { id: parseInt(id) }
    });

    if (!unit) {
      return res.status(404).json({ error: 'Unit of measurement not found' });
    }

    // Check if unit belongs to user's company/branch
    if (unit.companyId !== user.companyId || 
        (unit.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // If setting as default, unset other defaults
    if (isDefault && !unit.isDefault) {
      await prisma.unitOfMeasurement.updateMany({
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
    if (symbol !== undefined) updateData.symbol = symbol || null;
    if (description !== undefined) updateData.description = description || null;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUnit = await prisma.unitOfMeasurement.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(updatedUnit);
  } catch (error: any) {
    console.error('Update unit of measurement error:', error);
    res.status(500).json({ error: 'Failed to update unit of measurement', details: error.message });
  }
};

// Delete a unit of measurement
export const deleteUnitOfMeasurement = async (req: AuthRequest, res: Response) => {
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

    const unit = await prisma.unitOfMeasurement.findUnique({
      where: { id: parseInt(id) }
    });

    if (!unit) {
      return res.status(404).json({ error: 'Unit of measurement not found' });
    }

    // Check if unit belongs to user's company/branch
    if (unit.companyId !== user.companyId || 
        (unit.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.unitOfMeasurement.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete unit of measurement error:', error);
    res.status(500).json({ error: 'Failed to delete unit of measurement', details: error.message });
  }
};








































































