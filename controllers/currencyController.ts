import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all currencies for a company/branch
export const getCurrencies = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide currencies
      where.branchId = null;
    }

    const currencies = await prisma.currency.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { code: 'asc' }
      ]
    });

    res.json(currencies);
  } catch (error: any) {
    console.error('Get currencies error:', error);
    res.status(500).json({ error: 'Failed to fetch currencies', details: error.message });
  }
};

// Create a currency
export const createCurrency = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { code, name, symbol, isDefault, isActive } = req.body;
    const userId = req.userId;

    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
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
      await prisma.currency.updateMany({
        where: {
          companyId: user.companyId,
          branchId: user.branchId || null,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const currency = await prisma.currency.create({
      data: {
        code: code.toUpperCase(),
        name,
        symbol: symbol || null,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(currency);
  } catch (error: any) {
    console.error('Create currency error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Currency code already exists for this company/branch' });
    }
    res.status(500).json({ error: 'Failed to create currency', details: error.message });
  }
};

// Update a currency
export const updateCurrency = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, symbol, isDefault, isActive } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currency = await prisma.currency.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currency) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    // Check if currency belongs to user's company/branch
    if (currency.companyId !== user.companyId || 
        (currency.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // If setting as default, unset other defaults
    if (isDefault && !currency.isDefault) {
      await prisma.currency.updateMany({
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
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (name !== undefined) updateData.name = name;
    if (symbol !== undefined) updateData.symbol = symbol || null;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCurrency = await prisma.currency.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(updatedCurrency);
  } catch (error: any) {
    console.error('Update currency error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Currency code already exists for this company/branch' });
    }
    res.status(500).json({ error: 'Failed to update currency', details: error.message });
  }
};

// Delete a currency
export const deleteCurrency = async (req: AuthRequest, res: Response) => {
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

    const currency = await prisma.currency.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currency) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    // Check if currency belongs to user's company/branch
    if (currency.companyId !== user.companyId || 
        (currency.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.currency.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete currency error:', error);
    res.status(500).json({ error: 'Failed to delete currency', details: error.message });
  }
};

