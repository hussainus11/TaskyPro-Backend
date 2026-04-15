import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all sleep records (optionally filtered by userId, companyId, branchId, date range)
export const getSleepRecords = async (req: Request, res: Response) => {
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

    const records = await prisma.sleepRecord.findMany({
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

    res.json(records);
  } catch (error: any) {
    console.error('Failed to fetch sleep records:', error);
    res.status(500).json({ error: 'Failed to fetch sleep records', details: error.message });
  }
};

// Get today's sleep record for a user
export const getTodaySleep = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await prisma.sleepRecord.findUnique({
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

    res.json(record || null);
  } catch (error: any) {
    console.error('Failed to fetch today\'s sleep:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s sleep', details: error.message });
  }
};

// Get a single sleep record by ID
export const getSleepRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = await prisma.sleepRecord.findUnique({
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

    if (!record) {
      return res.status(404).json({ error: 'Sleep record not found' });
    }

    res.json(record);
  } catch (error: any) {
    console.error('Failed to fetch sleep record:', error);
    res.status(500).json({ error: 'Failed to fetch sleep record', details: error.message });
  }
};

// Create or update a sleep record
export const upsertSleepRecord = async (req: Request, res: Response) => {
  try {
    const { userId, date, sleepHours, sleepMinutes, quality, bedTime, wakeTime, companyId, branchId } = req.body;

    if (!userId || !date || sleepHours === undefined || quality === undefined) {
      return res.status(400).json({ error: 'Missing required fields: userId, date, sleepHours, quality' });
    }

    const recordDate = new Date(date);
    recordDate.setHours(0, 0, 0, 0);

    const record = await prisma.sleepRecord.upsert({
      where: {
        userId_date: {
          userId: parseInt(userId),
          date: recordDate
        }
      },
      update: {
        sleepHours: parseFloat(sleepHours),
        sleepMinutes: sleepMinutes ? parseInt(sleepMinutes) : 0,
        quality: parseInt(quality),
        bedTime: bedTime ? new Date(bedTime) : null,
        wakeTime: wakeTime ? new Date(wakeTime) : null,
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null,
      },
      create: {
        userId: parseInt(userId),
        date: recordDate,
        sleepHours: parseFloat(sleepHours),
        sleepMinutes: sleepMinutes ? parseInt(sleepMinutes) : 0,
        quality: parseInt(quality),
        bedTime: bedTime ? new Date(bedTime) : null,
        wakeTime: wakeTime ? new Date(wakeTime) : null,
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

    // Log activity for sleep record creation/update
    const user = record.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'sleep_record_created',
          message: `${userContext.name || 'User'} created sleep record`,
          userId: userContext.id,
          companyId: record.companyId || userContext.companyId || undefined,
          branchId: record.branchId || userContext.branchId || undefined,
          entityType: 'SLEEP_RECORD',
          entityId: record.id,
        });
      }
    }

    res.status(201).json(record);
  } catch (error: any) {
    console.error('Failed to create/update sleep record:', error);
    res.status(500).json({ error: 'Failed to create/update sleep record', details: error.message });
  }
};

// Update a sleep record
export const updateSleepRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sleepHours, sleepMinutes, quality, bedTime, wakeTime } = req.body;

    const updateData: any = {};
    if (sleepHours !== undefined) updateData.sleepHours = parseFloat(sleepHours);
    if (sleepMinutes !== undefined) updateData.sleepMinutes = parseInt(sleepMinutes);
    if (quality !== undefined) updateData.quality = parseInt(quality);
    if (bedTime !== undefined) updateData.bedTime = bedTime ? new Date(bedTime) : null;
    if (wakeTime !== undefined) updateData.wakeTime = wakeTime ? new Date(wakeTime) : null;

    const record = await prisma.sleepRecord.update({
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

    // Log activity for sleep record update
    const user = record.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'sleep_record_updated',
          message: `${userContext.name || 'User'} updated sleep record`,
          userId: userContext.id,
          companyId: record.companyId || userContext.companyId || undefined,
          branchId: record.branchId || userContext.branchId || undefined,
          entityType: 'SLEEP_RECORD',
          entityId: record.id,
        });
      }
    }

    res.json(record);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Sleep record not found' });
    }
    console.error('Failed to update sleep record:', error);
    res.status(500).json({ error: 'Failed to update sleep record', details: error.message });
  }
};

// Delete a sleep record
export const deleteSleepRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get sleep record details before deleting for activity logging
    const record = await prisma.sleepRecord.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, userId: true, companyId: true, branchId: true }
    });

    if (record && record.userId) {
      const userContext = await getUserContext(record.userId);
      if (userContext) {
        await logActivity({
          type: 'sleep_record_deleted',
          message: `${userContext.name || 'User'} deleted sleep record`,
          userId: userContext.id,
          companyId: record.companyId || userContext.companyId || undefined,
          branchId: record.branchId || userContext.branchId || undefined,
          entityType: 'SLEEP_RECORD',
          entityId: parseInt(id),
        });
      }
    }

    await prisma.sleepRecord.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Sleep record not found' });
    }
    console.error('Failed to delete sleep record:', error);
    res.status(500).json({ error: 'Failed to delete sleep record', details: error.message });
  }
};





