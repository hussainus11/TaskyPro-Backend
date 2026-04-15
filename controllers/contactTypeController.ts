import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all contact types for a company/branch
export const getContactTypes = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide contact types
      where.branchId = null;
    }

    const contactTypes = await prisma.contactType.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    res.json(contactTypes);
  } catch (error: any) {
    console.error('Get contact types error:', error);
    res.status(500).json({ error: 'Failed to fetch contact types', details: error.message });
  }
};

// Create a contact type
export const createContactType = async (req: AuthRequest, res: Response) => {
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

    const contactType = await prisma.contactType.create({
      data: {
        name,
        color,
        order: parseInt(order),
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(contactType);
  } catch (error: any) {
    console.error('Create contact type error:', error);
    res.status(500).json({ error: 'Failed to create contact type', details: error.message });
  }
};

// Update a contact type
export const updateContactType = async (req: AuthRequest, res: Response) => {
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

    const contactType = await prisma.contactType.findUnique({
      where: { id: parseInt(id) }
    });

    if (!contactType) {
      return res.status(404).json({ error: 'Contact type not found' });
    }

    // Check if contact type belongs to user's company/branch
    if (contactType.companyId !== user.companyId || 
        (contactType.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedContactType = await prisma.contactType.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(order !== undefined && { order: parseInt(order) })
      }
    });

    res.json(updatedContactType);
  } catch (error: any) {
    console.error('Update contact type error:', error);
    res.status(500).json({ error: 'Failed to update contact type', details: error.message });
  }
};

// Delete a contact type
export const deleteContactType = async (req: AuthRequest, res: Response) => {
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

    const contactType = await prisma.contactType.findUnique({
      where: { id: parseInt(id) }
    });

    if (!contactType) {
      return res.status(404).json({ error: 'Contact type not found' });
    }

    // Check if contact type belongs to user's company/branch
    if (contactType.companyId !== user.companyId || 
        (contactType.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.contactType.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete contact type error:', error);
    res.status(500).json({ error: 'Failed to delete contact type', details: error.message });
  }
};

// Reorder contact types
export const reorderContactTypes = async (req: AuthRequest, res: Response) => {
  try {
    const { contactTypes: reorderedContactTypes } = req.body; // Expects [{ id: number, order: number }]
    const userId = req.userId;

    if (!Array.isArray(reorderedContactTypes)) {
      return res.status(400).json({ error: 'Invalid contact types data provided' });
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
      reorderedContactTypes.map((contactType: { id: number; order: number }) =>
        prisma.contactType.updateMany({
          where: {
            id: contactType.id,
            companyId: user.companyId,
            branchId: user.branchId || null
          },
          data: { order: contactType.order }
        })
      )
    );

    res.status(200).json({ message: 'Contact types reordered successfully' });
  } catch (error: any) {
    console.error('Reorder contact types error:', error);
    res.status(500).json({ error: 'Failed to reorder contact types', details: error.message });
  }
};












































































