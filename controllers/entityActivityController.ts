import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

// Get activities for an entity
export const getEntityActivities = async (req: AuthRequest, res: Response) => {
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

    const activities = await prisma.activity.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      take: 100 // Limit to last 100 activities
    });

    // Get user names for activities
    const userIds = [...new Set(activities.map(a => a.userId).filter(Boolean))];
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds as number[] } },
          select: { id: true, name: true }
        })
      : [];

    const userMap = new Map(users.map(u => [u.id, u.name]));

    const activitiesWithUsers = activities.map(activity => ({
      ...activity,
      userName: activity.userId ? userMap.get(activity.userId) : undefined
    }));

    res.json(activitiesWithUsers);
  } catch (error: any) {
    console.error("Error fetching entity activities:", error);
    res.status(500).json({ error: error.message || "Failed to fetch activities" });
  }
};

// Create activity for an entity
export const createEntityActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { entityType, entityId } = req.params;
    const { type, message } = req.body;

    if (!entityType || !entityId) {
      return res.status(400).json({ error: "Entity type and ID are required" });
    }

    if (!type || !message) {
      return res.status(400).json({ error: "Activity type and message are required" });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        message,
        entityType: entityType.toUpperCase(),
        entityId: parseInt(entityId),
        userId,
        companyId: user.companyId || null,
        branchId: user.branchId || null
      }
    });

    res.status(201).json({
      ...activity,
      userName: user.name
    });
  } catch (error: any) {
    console.error("Error creating activity:", error);
    res.status(500).json({ error: error.message || "Failed to create activity" });
  }
};






































































