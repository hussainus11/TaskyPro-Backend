import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get comments for an entity
export const getEntityComments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { entityType, entityId } = req.params;

    if (!entityType || !entityId) {
      return res.status(400).json({ error: "Entity type and ID are required" });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const where: any = {
      entityType: entityType.toUpperCase(),
      entityId: parseInt(entityId)
    };

    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }

    const comments = await prisma.comment.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      take: 100 // Limit to last 100 comments
    });

    // Get user names for comments
    const userIds = [...new Set(comments.map(c => c.userId).filter(Boolean))];
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds as number[] } },
          select: { id: true, name: true }
        })
      : [];

    const userMap = new Map(users.map(u => [u.id, u.name]));

    const commentsWithUsers = comments.map(comment => ({
      ...comment,
      userName: comment.userId ? userMap.get(comment.userId) : undefined
    }));

    res.json(commentsWithUsers);
  } catch (error: any) {
    console.error("Error fetching entity comments:", error);
    res.status(500).json({ error: error.message || "Failed to fetch comments" });
  }
};

// Create comment for an entity
export const createEntityComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { entityType, entityId } = req.params;
    const { text } = req.body;

    if (!entityType || !entityId) {
      return res.status(400).json({ error: "Entity type and ID are required" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        entityType: entityType.toUpperCase(),
        entityId: parseInt(entityId),
        userId,
        companyId: user.companyId || null,
        branchId: user.branchId || null
      }
    });

    // Log activity for entity comment creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'entity_comment_created',
        message: `${userContext.name || 'User'} added a comment on ${entityType}`,
        userId: userContext.id,
        companyId: user.companyId || userContext.companyId || undefined,
        branchId: user.branchId || userContext.branchId || undefined,
        entityType: entityType.toUpperCase(),
        entityId: parseInt(entityId),
      });
    }

    res.status(201).json({
      ...comment,
      userName: user.name
    });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: error.message || "Failed to create comment" });
  }
};

// Delete comment
export const deleteEntityComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { entityType, entityId, commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) }
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user owns the comment or is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (comment.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    // Log activity for entity comment deletion
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'entity_comment_deleted',
        message: `${userContext.name || 'User'} deleted a comment on ${entityType}`,
        userId: userContext.id,
        companyId: comment.companyId || userContext.companyId || undefined,
        branchId: comment.branchId || userContext.branchId || undefined,
        entityType: comment.entityType,
        entityId: comment.entityId || undefined,
      });
    }

    await prisma.comment.delete({
      where: { id: parseInt(commentId) }
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: error.message || "Failed to delete comment" });
  }
};











