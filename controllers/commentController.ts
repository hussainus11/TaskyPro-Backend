import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

export const getComments = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    const comments = await prisma.comment.findMany({
      where: companyId ? { companyId: parseInt(companyId as string) } : {},
      orderBy: { createdAt: 'desc' },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

export const getCommentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
    });
    if (comment) {
      res.json(comment);
    } else {
      res.status(404).json({ error: 'Comment not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comment' });
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const { text, userId, companyId } = req.body;
    const comment = await prisma.comment.create({
      data: {
        text,
        userId: userId ? parseInt(userId) : null,
        companyId: companyId ? parseInt(companyId) : null,
      },
    });

    // Log activity for comment creation
    if (userId) {
      const userContext = await getUserContext(parseInt(userId));
      if (userContext) {
        await logActivity({
          type: 'comment_created',
          message: `${userContext.name || 'User'} added a comment`,
          userId: userContext.id,
          companyId: companyId ? parseInt(companyId) : userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'COMMENT',
          entityId: comment.id,
        });
      }
    }

    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment', details: error.message });
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    // Get comment before updating for activity logging
    const existingComment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true, companyId: true }
    });

    const comment = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: { text },
    });

    // Log activity for comment update
    if (existingComment && existingComment.userId) {
      const userContext = await getUserContext(existingComment.userId);
      if (userContext) {
        await logActivity({
          type: 'comment_updated',
          message: `${userContext.name || 'User'} updated a comment`,
          userId: userContext.id,
          companyId: existingComment.companyId || userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'COMMENT',
          entityId: comment.id,
        });
      }
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get comment details before deleting for activity logging
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, userId: true, companyId: true }
    });

    if (comment && comment.userId) {
      const userContext = await getUserContext(comment.userId);
      if (userContext) {
        await logActivity({
          type: 'comment_deleted',
          message: `${userContext.name || 'User'} deleted a comment`,
          userId: userContext.id,
          companyId: comment.companyId || userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'COMMENT',
          entityId: parseInt(id),
        });
      }
    }

    await prisma.comment.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};




