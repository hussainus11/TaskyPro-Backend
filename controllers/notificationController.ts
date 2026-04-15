import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Get all notifications for a user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { userId, isRead } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const where: any = {
      userId: parseInt(userId as string)
    };
    
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }
    
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        post: {
          select: {
            id: true,
            content: true,
            image: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 most recent
    });
    
    res.json(notifications);
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
  }
};

// Get unread notification count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const count = await prisma.notification.count({
      where: {
        userId: parseInt(userId as string),
        isRead: false
      }
    });
    
    res.json({ count });
  } catch (error: any) {
    console.error('Failed to fetch unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count', details: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });
    
    res.json(notification);
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
  }
};

// Mark all notifications as read for a user
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    await prisma.notification.updateMany({
      where: {
        userId: parseInt(userId),
        isRead: false
      },
      data: {
        isRead: true
      }
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to mark all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read', details: error.message });
  }
};

// Delete a notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.notification.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to delete notification:', error);
    res.status(500).json({ error: 'Failed to delete notification', details: error.message });
  }
};

// Create a notification (internal use)
export const createNotification = async (data: {
  type: 'POST_CREATED' | 'POST_LIKED' | 'POST_COMMENTED' | 'CALENDAR_EVENT_STARTING';
  title: string;
  message: string;
  userId: number;
  actorId?: number;
  postId?: number;
  companyId?: number;
  branchId?: number;
}) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        actorId: data.actorId || null,
        postId: data.postId || null,
        companyId: data.companyId || null,
        branchId: data.branchId || null,
      }
    });
    
    return notification;
  } catch (error: any) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};


