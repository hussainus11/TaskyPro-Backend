import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getActivities = async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = req.query;
    const where: any = {};
    
    if (companyId) where.companyId = parseInt(companyId as string);
    if (userId) where.userId = parseInt(userId as string);
    
    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: { id: true, name: true }
        },
        branch: {
          select: { id: true, name: true }
        }
      }
    });
    res.json(activities);
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities', details: error.message });
  }
};

export const getActivityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activity = await prisma.activity.findUnique({
      where: { id: parseInt(id) },
    });
    if (activity) {
      res.json(activity);
    } else {
      res.status(404).json({ error: 'Activity not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
};

export const createActivity = async (req: Request, res: Response) => {
  try {
    const { type, message, userId, companyId } = req.body;
    const activity = await prisma.activity.create({
      data: {
        type,
        message,
        userId: userId ? parseInt(userId) : null,
        companyId: companyId ? parseInt(companyId) : null,
      },
    });
    res.status(201).json(activity);
  } catch (error: any) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity', details: error.message });
  }
};

export const deleteActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.activity.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete activity' });
  }
};




