import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    const messages = await prisma.message.findMany({
      where: companyId ? { companyId: parseInt(companyId as string) } : {},
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const getMessageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const message = await prisma.message.findUnique({
      where: { id: parseInt(id) },
    });
    if (message) {
      res.json(message);
    } else {
      res.status(404).json({ error: 'Message not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch message' });
  }
};

export const createMessage = async (req: Request, res: Response) => {
  try {
    const { text, userId, companyId, isSent } = req.body;
    const message = await prisma.message.create({
      data: {
        text,
        userId: userId ? parseInt(userId) : null,
        companyId: companyId ? parseInt(companyId) : null,
        isSent: isSent !== undefined ? isSent : true,
      },
    });

    // Log activity for message creation
    if (userId) {
      const userContext = await getUserContext(parseInt(userId));
      if (userContext) {
        await logActivity({
          type: 'message_sent',
          message: `${userContext.name || 'User'} sent a message`,
          userId: userContext.id,
          companyId: companyId ? parseInt(companyId) : userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'MESSAGE',
          entityId: message.id,
        });
      }
    }

    res.status(201).json(message);
  } catch (error: any) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message', details: error.message });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get message details before deleting for activity logging
    const message = await prisma.message.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, userId: true, companyId: true }
    });

    if (message && message.userId) {
      const userContext = await getUserContext(message.userId);
      if (userContext) {
        await logActivity({
          type: 'message_deleted',
          message: `${userContext.name || 'User'} deleted a message`,
          userId: userContext.id,
          companyId: message.companyId || userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'MESSAGE',
          entityId: parseInt(id),
        });
      }
    }

    await prisma.message.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
};




