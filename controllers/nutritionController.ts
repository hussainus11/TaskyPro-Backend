import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all nutrition entries (optionally filtered by userId, companyId, branchId, date range)
export const getNutritionEntries = async (req: Request, res: Response) => {
  try {
    const { userId, companyId, branchId, startDate, endDate, date } = req.query;

    const where: any = {};
    
    if (userId) where.userId = parseInt(userId as string);
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    
    if (date) {
      where.date = new Date(date as string);
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const entries = await prisma.nutritionEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(entries);
  } catch (error: any) {
    console.error('Failed to fetch nutrition entries:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition entries', details: error.message });
  }
};

// Get today's nutrition entry for a user
export const getTodayNutrition = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entry = await prisma.nutritionEntry.findUnique({
      where: {
        userId_date: {
          userId: parseInt(userId as string),
          date: today
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    res.json(entry || null);
  } catch (error: any) {
    console.error('Failed to fetch today\'s nutrition:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s nutrition', details: error.message });
  }
};

// Get a single nutrition entry by ID
export const getNutritionEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entry = await prisma.nutritionEntry.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Nutrition entry not found' });
    }

    res.json(entry);
  } catch (error: any) {
    console.error('Failed to fetch nutrition entry:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition entry', details: error.message });
  }
};

// Create or update a nutrition entry
export const upsertNutritionEntry = async (req: Request, res: Response) => {
  try {
    const { userId, date, calories, carbs, protein, fats, companyId, branchId } = req.body;

    if (!userId || !date || calories === undefined || carbs === undefined || protein === undefined || fats === undefined) {
      return res.status(400).json({ error: 'Missing required fields: userId, date, calories, carbs, protein, fats' });
    }

    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    const entry = await prisma.nutritionEntry.upsert({
      where: {
        userId_date: {
          userId: parseInt(userId),
          date: entryDate
        }
      },
      update: {
        calories: parseInt(calories),
        carbs: parseFloat(carbs),
        protein: parseFloat(protein),
        fats: parseFloat(fats),
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null,
      },
      create: {
        userId: parseInt(userId),
        date: entryDate,
        calories: parseInt(calories),
        carbs: parseFloat(carbs),
        protein: parseFloat(protein),
        fats: parseFloat(fats),
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Log activity for nutrition entry creation/update
    const user = entry.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'nutrition_entry_created',
          message: `${userContext.name || 'User'} created nutrition entry`,
          userId: userContext.id,
          companyId: entry.companyId || userContext.companyId || undefined,
          branchId: entry.branchId || userContext.branchId || undefined,
          entityType: 'NUTRITION_ENTRY',
          entityId: entry.id,
        });
      }
    }

    res.status(201).json(entry);
  } catch (error: any) {
    console.error('Failed to create/update nutrition entry:', error);
    res.status(500).json({ error: 'Failed to create/update nutrition entry', details: error.message });
  }
};

// Update a nutrition entry
export const updateNutritionEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { calories, carbs, protein, fats } = req.body;

    const updateData: any = {};
    if (calories !== undefined) updateData.calories = parseInt(calories);
    if (carbs !== undefined) updateData.carbs = parseFloat(carbs);
    if (protein !== undefined) updateData.protein = parseFloat(protein);
    if (fats !== undefined) updateData.fats = parseFloat(fats);

    const entry = await prisma.nutritionEntry.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Log activity for nutrition entry update
    const user = entry.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'nutrition_entry_updated',
          message: `${userContext.name || 'User'} updated nutrition entry`,
          userId: userContext.id,
          companyId: entry.companyId || userContext.companyId || undefined,
          branchId: entry.branchId || userContext.branchId || undefined,
          entityType: 'NUTRITION_ENTRY',
          entityId: entry.id,
        });
      }
    }

    res.json(entry);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Nutrition entry not found' });
    }
    console.error('Failed to update nutrition entry:', error);
    res.status(500).json({ error: 'Failed to update nutrition entry', details: error.message });
  }
};

// Delete a nutrition entry
export const deleteNutritionEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get nutrition entry details before deleting for activity logging
    const entry = await prisma.nutritionEntry.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, userId: true, companyId: true, branchId: true }
    });

    if (entry && entry.userId) {
      const userContext = await getUserContext(entry.userId);
      if (userContext) {
        await logActivity({
          type: 'nutrition_entry_deleted',
          message: `${userContext.name || 'User'} deleted nutrition entry`,
          userId: userContext.id,
          companyId: entry.companyId || userContext.companyId || undefined,
          branchId: entry.branchId || userContext.branchId || undefined,
          entityType: 'NUTRITION_ENTRY',
          entityId: parseInt(id),
        });
      }
    }

    await prisma.nutritionEntry.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Nutrition entry not found' });
    }
    console.error('Failed to delete nutrition entry:', error);
    res.status(500).json({ error: 'Failed to delete nutrition entry', details: error.message });
  }
};





