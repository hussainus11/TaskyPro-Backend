import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all auto-numbering settings for a company/branch
export const getAutoNumberings = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, branchId, entity } = req.query;
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
      // If company but no branch, get company-wide settings
      where.branchId = null;
    }
    if (entity) {
      where.entity = entity;
    }

    const autoNumberings = await prisma.autoNumbering.findMany({
      where,
      orderBy: [
        { entity: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(autoNumberings);
  } catch (error: any) {
    console.error('Get auto-numberings error:', error);
    res.status(500).json({ error: 'Failed to fetch auto-numbering settings', details: error.message });
  }
};

// Create an auto-numbering setting
export const createAutoNumbering = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { entity, prefix, suffix, format, startingNumber, numberLength, resetPeriod, isActive } = req.body;
    const userId = req.userId;

    if (!entity || !format) {
      return res.status(400).json({ error: 'Entity and format are required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if auto-numbering already exists for this entity
    const existing = await prisma.autoNumbering.findFirst({
      where: {
        entity,
        companyId: user.companyId || null,
        branchId: user.branchId || null
      }
    });

    if (existing) {
      return res.status(400).json({ error: `Auto-numbering already exists for ${entity}` });
    }

    const autoNumbering = await prisma.autoNumbering.create({
      data: {
        entity,
        prefix: prefix || null,
        suffix: suffix || null,
        format,
        startingNumber: startingNumber || 1,
        currentNumber: 0,
        numberLength: numberLength || null,
        resetPeriod: resetPeriod || null,
        isActive: isActive !== undefined ? isActive : true,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    // Log activity for auto-numbering creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'auto_numbering_created',
        message: `${userContext.name || 'User'} created auto-numbering for "${entity}"`,
        userId: userContext.id,
        companyId: autoNumbering.companyId || userContext.companyId || undefined,
        branchId: autoNumbering.branchId || userContext.branchId || undefined,
        entityType: 'AUTO_NUMBERING',
        entityId: autoNumbering.id,
      });
    }

    res.status(201).json(autoNumbering);
  } catch (error: any) {
    console.error('Create auto-numbering error:', error);
    res.status(500).json({ error: 'Failed to create auto-numbering setting', details: error.message });
  }
};

// Update an auto-numbering setting
export const updateAutoNumbering = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { prefix, suffix, format, startingNumber, currentNumber, numberLength, resetPeriod, isActive } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const autoNumbering = await prisma.autoNumbering.findUnique({
      where: { id: parseInt(id) }
    });

    if (!autoNumbering) {
      return res.status(404).json({ error: 'Auto-numbering setting not found' });
    }

    // Check if auto-numbering belongs to user's company/branch
    if (autoNumbering.companyId !== user.companyId || 
        (autoNumbering.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData: any = {};
    if (prefix !== undefined) updateData.prefix = prefix || null;
    if (suffix !== undefined) updateData.suffix = suffix || null;
    if (format !== undefined) updateData.format = format;
    if (startingNumber !== undefined) updateData.startingNumber = startingNumber;
    if (currentNumber !== undefined) updateData.currentNumber = currentNumber;
    if (numberLength !== undefined) updateData.numberLength = numberLength || null;
    if (resetPeriod !== undefined) updateData.resetPeriod = resetPeriod || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedAutoNumbering = await prisma.autoNumbering.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Log activity for auto-numbering update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'auto_numbering_updated',
        message: `${userContext.name || 'User'} updated auto-numbering for "${updatedAutoNumbering.entity}"`,
        userId: userContext.id,
        companyId: updatedAutoNumbering.companyId || userContext.companyId || undefined,
        branchId: updatedAutoNumbering.branchId || userContext.branchId || undefined,
        entityType: 'AUTO_NUMBERING',
        entityId: updatedAutoNumbering.id,
      });
    }

    res.json(updatedAutoNumbering);
  } catch (error: any) {
    console.error('Update auto-numbering error:', error);
    res.status(500).json({ error: 'Failed to update auto-numbering setting', details: error.message });
  }
};

// Delete an auto-numbering setting
export const deleteAutoNumbering = async (req: AuthRequest, res: Response) => {
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

    const autoNumbering = await prisma.autoNumbering.findUnique({
      where: { id: parseInt(id) }
    });

    if (!autoNumbering) {
      return res.status(404).json({ error: 'Auto-numbering setting not found' });
    }

    // Check if auto-numbering belongs to user's company/branch
    if (autoNumbering.companyId !== user.companyId || 
        (autoNumbering.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Log activity for auto-numbering deletion
    const userContext = await getUserContext(userId);
    if (userContext && autoNumbering) {
      await logActivity({
        type: 'auto_numbering_deleted',
        message: `${userContext.name || 'User'} deleted auto-numbering for "${autoNumbering.entity}"`,
        userId: userContext.id,
        companyId: autoNumbering.companyId || userContext.companyId || undefined,
        branchId: autoNumbering.branchId || userContext.branchId || undefined,
        entityType: 'AUTO_NUMBERING',
        entityId: parseInt(id),
      });
    }

    await prisma.autoNumbering.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete auto-numbering error:', error);
    res.status(500).json({ error: 'Failed to delete auto-numbering setting', details: error.message });
  }
};

// Get next number for an entity
export const getNextNumber = async (req: AuthRequest, res: Response) => {
  try {
    const { entity } = req.params;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const autoNumbering = await prisma.autoNumbering.findFirst({
      where: {
        entity,
        companyId: user.companyId || null,
        branchId: user.branchId || null
      }
    });

    if (!autoNumbering || !autoNumbering.isActive) {
      return res.status(404).json({ error: 'Auto-numbering not found or inactive' });
    }

    // Check if reset is needed
    let currentNumber = autoNumbering.currentNumber;
    const now = new Date();
    
    if (autoNumbering.resetPeriod && autoNumbering.lastResetDate) {
      const lastReset = new Date(autoNumbering.lastResetDate);
      let shouldReset = false;

      if (autoNumbering.resetPeriod === 'daily') {
        shouldReset = now.toDateString() !== lastReset.toDateString();
      } else if (autoNumbering.resetPeriod === 'monthly') {
        shouldReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
      } else if (autoNumbering.resetPeriod === 'yearly') {
        shouldReset = now.getFullYear() !== lastReset.getFullYear();
      }

      if (shouldReset) {
        currentNumber = autoNumbering.startingNumber - 1;
        await prisma.autoNumbering.update({
          where: { id: autoNumbering.id },
          data: { currentNumber: currentNumber, lastResetDate: now }
        });
      }
    }

    // Increment and get next number
    currentNumber += 1;
    const numberPart = autoNumbering.numberLength 
      ? currentNumber.toString().padStart(autoNumbering.numberLength, '0')
      : currentNumber.toString();

    // Format the number
    let formattedNumber = autoNumbering.format;
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    formattedNumber = formattedNumber
      .replace(/{prefix}/g, autoNumbering.prefix || '')
      .replace(/{suffix}/g, autoNumbering.suffix || '')
      .replace(/{number}/g, numberPart)
      .replace(/{YYYY}/g, year)
      .replace(/{MM}/g, month)
      .replace(/{DD}/g, day);

    // Update current number
    await prisma.autoNumbering.update({
      where: { id: autoNumbering.id },
      data: { currentNumber: currentNumber }
    });

    res.json({ nextNumber: formattedNumber, currentNumber });
  } catch (error: any) {
    console.error('Get next number error:', error);
    res.status(500).json({ error: 'Failed to get next number', details: error.message });
  }
};

