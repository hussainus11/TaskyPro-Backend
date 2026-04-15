import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all product properties for a company/branch
export const getProductProperties = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide properties
      where.branchId = null;
    }

    const properties = await prisma.productProperty.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json(properties);
  } catch (error: any) {
    console.error('Get product properties error:', error);
    res.status(500).json({ error: 'Failed to fetch product properties', details: error.message });
  }
};

// Create a product property
export const createProductProperty = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, type, options, isRequired, isDefault, isActive } = req.body;
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
      await prisma.productProperty.updateMany({
        where: {
          companyId: user.companyId,
          branchId: user.branchId || null,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const property = await prisma.productProperty.create({
      data: {
        name,
        type: type || null,
        options: options || [],
        isRequired: isRequired || false,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(property);
  } catch (error: any) {
    console.error('Create product property error:', error);
    res.status(500).json({ error: 'Failed to create product property', details: error.message });
  }
};

// Update a product property
export const updateProductProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, options, isRequired, isDefault, isActive } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const property = await prisma.productProperty.findUnique({
      where: { id: parseInt(id) }
    });

    if (!property) {
      return res.status(404).json({ error: 'Product property not found' });
    }

    // Check if property belongs to user's company/branch
    if (property.companyId !== user.companyId || 
        (property.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // If setting as default, unset other defaults
    if (isDefault && !property.isDefault) {
      await prisma.productProperty.updateMany({
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
    if (type !== undefined) updateData.type = type || null;
    if (options !== undefined) updateData.options = options || [];
    if (isRequired !== undefined) updateData.isRequired = isRequired;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedProperty = await prisma.productProperty.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(updatedProperty);
  } catch (error: any) {
    console.error('Update product property error:', error);
    res.status(500).json({ error: 'Failed to update product property', details: error.message });
  }
};

// Delete a product property
export const deleteProductProperty = async (req: AuthRequest, res: Response) => {
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

    const property = await prisma.productProperty.findUnique({
      where: { id: parseInt(id) }
    });

    if (!property) {
      return res.status(404).json({ error: 'Product property not found' });
    }

    // Check if property belongs to user's company/branch
    if (property.companyId !== user.companyId || 
        (property.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.productProperty.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete product property error:', error);
    res.status(500).json({ error: 'Failed to delete product property', details: error.message });
  }
};








































































