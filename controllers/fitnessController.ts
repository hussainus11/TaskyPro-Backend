import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all fitness activities (optionally filtered by userId, companyId, branchId, date range)
export const getFitnessActivities = async (req: Request, res: Response) => {
  try {
    const { userId, companyId, branchId, startDate, endDate, type, status } = req.query;

    const where: any = {};
    
    if (userId) where.userId = parseInt(userId as string);
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (type) where.type = type;
    if (status) where.status = status;
    
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }

    const activities = await prisma.fitnessActivity.findMany({
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
        startTime: 'desc'
      }
    });

    res.json(activities);
  } catch (error: any) {
    console.error('Failed to fetch fitness activities:', error);
    res.status(500).json({ error: 'Failed to fetch fitness activities', details: error.message });
  }
};

// Get a single fitness activity by ID
export const getFitnessActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activity = await prisma.fitnessActivity.findUnique({
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

    if (!activity) {
      return res.status(404).json({ error: 'Fitness activity not found' });
    }

    res.json(activity);
  } catch (error: any) {
    console.error('Failed to fetch fitness activity:', error);
    res.status(500).json({ error: 'Failed to fetch fitness activity', details: error.message });
  }
};

// Create a new fitness activity
export const createFitnessActivity = async (req: Request, res: Response) => {
  try {
    const { title, description, type, status, startTime, endTime, duration, distance, calories, heartRate, notes, userId, companyId, branchId } = req.body;

    if (!title || !type || !startTime || !userId) {
      return res.status(400).json({ error: 'Missing required fields: title, type, startTime, userId' });
    }

    const activity = await prisma.fitnessActivity.create({
      data: {
        title,
        description,
        type,
        status: status || 'PLANNED',
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration,
        distance,
        calories,
        heartRate,
        notes,
        userId: parseInt(userId),
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

    // Log activity for fitness activity creation
    const user = activity.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'fitness_activity_created',
          message: `${userContext.name || 'User'} created fitness activity "${title}"`,
          userId: userContext.id,
          companyId: activity.companyId || userContext.companyId || undefined,
          branchId: activity.branchId || userContext.branchId || undefined,
          entityType: 'FITNESS_ACTIVITY',
          entityId: activity.id,
        });
      }
    }

    res.status(201).json(activity);
  } catch (error: any) {
    console.error('Failed to create fitness activity:', error);
    res.status(500).json({ error: 'Failed to create fitness activity', details: error.message });
  }
};

// Update a fitness activity
export const updateFitnessActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type, status, startTime, endTime, duration, distance, calories, heartRate, notes } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
    if (duration !== undefined) updateData.duration = duration;
    if (distance !== undefined) updateData.distance = distance;
    if (calories !== undefined) updateData.calories = calories;
    if (heartRate !== undefined) updateData.heartRate = heartRate;
    if (notes !== undefined) updateData.notes = notes;

    const activity = await prisma.fitnessActivity.update({
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

    // Log activity for fitness activity update
    const user = activity.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'fitness_activity_updated',
          message: `${userContext.name || 'User'} updated fitness activity "${activity.title}"`,
          userId: userContext.id,
          companyId: activity.companyId || userContext.companyId || undefined,
          branchId: activity.branchId || userContext.branchId || undefined,
          entityType: 'FITNESS_ACTIVITY',
          entityId: activity.id,
        });
      }
    }

    res.json(activity);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Fitness activity not found' });
    }
    console.error('Failed to update fitness activity:', error);
    res.status(500).json({ error: 'Failed to update fitness activity', details: error.message });
  }
};

// Delete a fitness activity
export const deleteFitnessActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get fitness activity details before deleting for activity logging
    const activity = await prisma.fitnessActivity.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, title: true, userId: true, companyId: true, branchId: true }
    });

    if (activity && activity.userId) {
      const userContext = await getUserContext(activity.userId);
      if (userContext) {
        await logActivity({
          type: 'fitness_activity_deleted',
          message: `${userContext.name || 'User'} deleted fitness activity "${activity.title}"`,
          userId: userContext.id,
          companyId: activity.companyId || userContext.companyId || undefined,
          branchId: activity.branchId || userContext.branchId || undefined,
          entityType: 'FITNESS_ACTIVITY',
          entityId: parseInt(id),
        });
      }
    }

    await prisma.fitnessActivity.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Fitness activity not found' });
    }
    console.error('Failed to delete fitness activity:', error);
    res.status(500).json({ error: 'Failed to delete fitness activity', details: error.message });
  }
};

// Get today's workouts for a user
export const getTodayWorkouts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activities = await prisma.fitnessActivity.findMany({
      where: {
        userId: parseInt(userId as string),
        startTime: {
          gte: today,
          lt: tomorrow,
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    res.json(activities);
  } catch (error: any) {
    console.error('Failed to fetch today\'s workouts:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s workouts', details: error.message });
  }
};





