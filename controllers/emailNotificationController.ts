import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all email notifications
export const getEmailNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { companyId, branchId, type, isActive, frequency } = req.query;

    const filterCompanyId = companyId ? parseInt(companyId as string) : user.companyId;
    const filterBranchId = branchId ? parseInt(branchId as string) : user.branchId;

    const where: any = {};
    if (filterCompanyId) {
      where.companyId = filterCompanyId;
    }
    if (filterBranchId) {
      where.branchId = filterBranchId;
    } else if (filterCompanyId) {
      where.branchId = null;
    }
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (frequency) where.frequency = frequency;

    const notifications = await prisma.emailNotification.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    res.json(notifications);
  } catch (error: any) {
    console.error("Error fetching email notifications:", error);
    res.status(500).json({ error: error.message || "Failed to fetch email notifications" });
  }
};

// Get single email notification
export const getEmailNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const notification = await prisma.emailNotification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({ error: "Email notification not found" });
    }

    res.json(notification);
  } catch (error: any) {
    console.error("Error fetching email notification:", error);
    res.status(500).json({ error: error.message || "Failed to fetch email notification" });
  }
};

// Create email notification
export const createEmailNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const {
      name,
      type,
      description,
      trigger,
      recipients,
      templateId,
      frequency,
      channels,
      conditions,
      isActive,
      companyId,
      branchId
    } = req.body;

    const finalCompanyId = companyId || user.companyId;
    const finalBranchId = branchId || user.branchId;

    // Check for duplicate name
    const existing = await prisma.emailNotification.findFirst({
      where: {
        name,
        companyId: finalCompanyId || null,
        branchId: finalBranchId || null
      }
    });

    if (existing) {
      return res.status(400).json({ error: "Notification with this name already exists" });
    }

    const notification = await prisma.emailNotification.create({
      data: {
        name,
        type: type || "CUSTOM",
        description,
        trigger: trigger || {},
        recipients: recipients || {},
        templateId: templateId || null,
        frequency: frequency || "IMMEDIATE",
        channels: channels || ["EMAIL"],
        conditions: conditions || {},
        isActive: isActive !== undefined ? isActive : true,
        isSystem: false,
        companyId: finalCompanyId || null,
        branchId: finalBranchId || null
      }
    });

    // Log activity for email notification creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'email_notification_created',
        message: `${userContext.name || 'User'} created email notification "${name}"`,
        userId: userContext.id,
        companyId: finalCompanyId || userContext.companyId || undefined,
        branchId: finalBranchId || userContext.branchId || undefined,
        entityType: 'EMAIL_NOTIFICATION',
        entityId: notification.id,
      });
    }

    res.status(201).json(notification);
  } catch (error: any) {
    console.error("Error creating email notification:", error);
    res.status(500).json({ error: error.message || "Failed to create email notification" });
  }
};

// Update email notification
export const updateEmailNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const {
      name,
      type,
      description,
      trigger,
      recipients,
      templateId,
      frequency,
      channels,
      conditions,
      isActive,
      companyId,
      branchId
    } = req.body;

    // Check if notification exists
    const existing = await prisma.emailNotification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Email notification not found" });
    }

    // Prevent modification of system notifications
    if (existing.isSystem) {
      return res.status(400).json({ error: "Cannot modify system notifications" });
    }

    // Check for duplicate name (excluding current notification)
    if (name && name !== existing.name) {
      const duplicate = await prisma.emailNotification.findFirst({
        where: {
          name,
          companyId: companyId || existing.companyId || null,
          branchId: branchId || existing.branchId || null,
          NOT: { id: parseInt(id) }
        }
      });

      if (duplicate) {
        return res.status(400).json({ error: "Notification with this name already exists" });
      }
    }

    const notification = await prisma.emailNotification.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(trigger !== undefined && { trigger }),
        ...(recipients !== undefined && { recipients }),
        ...(templateId !== undefined && { templateId: templateId || null }),
        ...(frequency && { frequency }),
        ...(channels !== undefined && { channels }),
        ...(conditions !== undefined && { conditions }),
        ...(isActive !== undefined && { isActive }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(branchId !== undefined && { branchId: branchId || null })
      }
    });

    // Log activity for email notification update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'email_notification_updated',
        message: `${userContext.name || 'User'} updated email notification "${notification.name}"`,
        userId: userContext.id,
        companyId: notification.companyId || userContext.companyId || undefined,
        branchId: notification.branchId || userContext.branchId || undefined,
        entityType: 'EMAIL_NOTIFICATION',
        entityId: notification.id,
      });
    }

    res.json(notification);
  } catch (error: any) {
    console.error("Error updating email notification:", error);
    res.status(500).json({ error: error.message || "Failed to update email notification" });
  }
};

// Delete email notification
export const deleteEmailNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const notification = await prisma.emailNotification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({ error: "Email notification not found" });
    }

    // Prevent deletion of system notifications
    if (notification.isSystem) {
      return res.status(400).json({ error: "Cannot delete system notifications" });
    }

    // Log activity for email notification deletion
    const userContext = await getUserContext(userId);
    if (userContext && notification) {
      await logActivity({
        type: 'email_notification_deleted',
        message: `${userContext.name || 'User'} deleted email notification "${notification.name}"`,
        userId: userContext.id,
        companyId: notification.companyId || userContext.companyId || undefined,
        branchId: notification.branchId || userContext.branchId || undefined,
        entityType: 'EMAIL_NOTIFICATION',
        entityId: parseInt(id),
      });
    }

    await prisma.emailNotification.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Email notification deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting email notification:", error);
    res.status(500).json({ error: error.message || "Failed to delete email notification" });
  }
};

// Toggle active status
export const toggleEmailNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const notification = await prisma.emailNotification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({ error: "Email notification not found" });
    }

    const updated = await prisma.emailNotification.update({
      where: { id: parseInt(id) },
      data: { isActive: !notification.isActive }
    });

    res.json(updated);
  } catch (error: any) {
    console.error("Error toggling email notification:", error);
    res.status(500).json({ error: error.message || "Failed to toggle email notification" });
  }
};

// Duplicate email notification
export const duplicateEmailNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const notification = await prisma.emailNotification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({ error: "Email notification not found" });
    }

    const duplicated = await prisma.emailNotification.create({
      data: {
        name: `${notification.name} (Copy)`,
        type: notification.type,
        description: notification.description,
        trigger: notification.trigger as any,
        recipients: notification.recipients as any,
        templateId: notification.templateId,
        frequency: notification.frequency,
        channels: notification.channels as any,
        conditions: notification.conditions as any,
        isActive: false, // Duplicated notifications start as inactive
        isSystem: false, // Duplicated notifications are never system
        companyId: notification.companyId,
        branchId: notification.branchId
      }
    });

    res.status(201).json(duplicated);
  } catch (error: any) {
    console.error("Error duplicating email notification:", error);
    res.status(500).json({ error: error.message || "Failed to duplicate email notification" });
  }
};













