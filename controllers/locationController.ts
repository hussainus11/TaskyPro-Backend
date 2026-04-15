import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all locations for a company/branch
export const getLocations = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide locations
      where.branchId = null;
    }

    const locations = await prisma.location.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json(locations);
  } catch (error: any) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to fetch locations', details: error.message });
  }
};

// Create a location
export const createLocation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, address, city, state, country, zipCode, phone, email, isDefault, isActive } = req.body;
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
      await prisma.location.updateMany({
        where: {
          companyId: user.companyId,
          branchId: user.branchId || null,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const location = await prisma.location.create({
      data: {
        name,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        zipCode: zipCode || null,
        phone: phone || null,
        email: email || null,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(location);
  } catch (error: any) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Failed to create location', details: error.message });
  }
};

// Update a location
export const updateLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, city, state, country, zipCode, phone, email, isDefault, isActive } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const location = await prisma.location.findUnique({
      where: { id: parseInt(id) }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check if location belongs to user's company/branch
    if (location.companyId !== user.companyId || 
        (location.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // If setting as default, unset other defaults
    if (isDefault && !location.isDefault) {
      await prisma.location.updateMany({
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
    if (address !== undefined) updateData.address = address || null;
    if (city !== undefined) updateData.city = city || null;
    if (state !== undefined) updateData.state = state || null;
    if (country !== undefined) updateData.country = country || null;
    if (zipCode !== undefined) updateData.zipCode = zipCode || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedLocation = await prisma.location.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(updatedLocation);
  } catch (error: any) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location', details: error.message });
  }
};

// Delete a location
export const deleteLocation = async (req: AuthRequest, res: Response) => {
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

    const location = await prisma.location.findUnique({
      where: { id: parseInt(id) }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check if location belongs to user's company/branch
    if (location.companyId !== user.companyId || 
        (location.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.location.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Failed to delete location', details: error.message });
  }
};








































































