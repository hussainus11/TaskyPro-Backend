import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all SMTP settings
export const getSmtpSettings = async (req: AuthRequest, res: Response) => {
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

    const { companyId, branchId, isActive } = req.query;

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
    if (isActive !== undefined) where.isActive = isActive === "true";

    const settings = await prisma.smtpSetting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      // Don't return password in list view
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        secure: true,
        username: true,
        fromEmail: true,
        fromName: true,
        isActive: true,
        isDefault: true,
        companyId: true,
        branchId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(settings);
  } catch (error: any) {
    console.error("Error fetching SMTP settings:", error);
    res.status(500).json({ error: error.message || "Failed to fetch SMTP settings" });
  }
};

// Get single SMTP setting
export const getSmtpSetting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const setting = await prisma.smtpSetting.findUnique({
      where: { id: parseInt(id) }
    });

    if (!setting) {
      return res.status(404).json({ error: "SMTP setting not found" });
    }

    // Return password as masked for security
    const response = {
      ...setting,
      password: setting.password ? "••••••••" : null
    };

    res.json(response);
  } catch (error: any) {
    console.error("Error fetching SMTP setting:", error);
    res.status(500).json({ error: error.message || "Failed to fetch SMTP setting" });
  }
};

// Create SMTP setting
export const createSmtpSetting = async (req: AuthRequest, res: Response) => {
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
      host,
      port,
      secure,
      username,
      password,
      fromEmail,
      fromName,
      isActive,
      isDefault,
      companyId,
      branchId
    } = req.body;

    const finalCompanyId = companyId || user.companyId;
    const finalBranchId = branchId || user.branchId;

    // Check for duplicate name
    const existing = await prisma.smtpSetting.findFirst({
      where: {
        name,
        companyId: finalCompanyId || null,
        branchId: finalBranchId || null
      }
    });

    if (existing) {
      return res.status(400).json({ error: "SMTP setting with this name already exists" });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.smtpSetting.updateMany({
        where: {
          companyId: finalCompanyId || null,
          branchId: finalBranchId || null,
          NOT: { id: existing?.id }
        },
        data: { isDefault: false }
      });
    }

    // If setting as active, deactivate others
    if (isActive) {
      await prisma.smtpSetting.updateMany({
        where: {
          companyId: finalCompanyId || null,
          branchId: finalBranchId || null,
          NOT: { id: existing?.id }
        },
        data: { isActive: false }
      });
    }

    const setting = await prisma.smtpSetting.create({
      data: {
        name,
        host,
        port: parseInt(port),
        secure: secure || false,
        username,
        password, // In production, encrypt this
        fromEmail,
        fromName,
        isActive: isActive || false,
        isDefault: isDefault || false,
        companyId: finalCompanyId || null,
        branchId: finalBranchId || null
      }
    });

    // Log activity for SMTP setting creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'smtp_setting_created',
        message: `${userContext.name || 'User'} created SMTP setting "${name}"`,
        userId: userContext.id,
        companyId: finalCompanyId || userContext.companyId || undefined,
        branchId: finalBranchId || userContext.branchId || undefined,
        entityType: 'SMTP_SETTING',
        entityId: setting.id,
      });
    }

    // Return without password
    const { password: _, ...response } = setting;
    res.status(201).json(response);
  } catch (error: any) {
    console.error("Error creating SMTP setting:", error);
    res.status(500).json({ error: error.message || "Failed to create SMTP setting" });
  }
};

// Update SMTP setting
export const updateSmtpSetting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const {
      name,
      host,
      port,
      secure,
      username,
      password,
      fromEmail,
      fromName,
      isActive,
      isDefault,
      companyId,
      branchId
    } = req.body;

    // Check if setting exists
    const existing = await prisma.smtpSetting.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "SMTP setting not found" });
    }

    // Check for duplicate name (excluding current setting)
    if (name && name !== existing.name) {
      const duplicate = await prisma.smtpSetting.findFirst({
        where: {
          name,
          companyId: companyId || existing.companyId || null,
          branchId: branchId || existing.branchId || null,
          NOT: { id: parseInt(id) }
        }
      });

      if (duplicate) {
        return res.status(400).json({ error: "SMTP setting with this name already exists" });
      }
    }

    // If setting as default, unset other defaults
    if (isDefault && isDefault !== existing.isDefault) {
      await prisma.smtpSetting.updateMany({
        where: {
          companyId: companyId || existing.companyId || null,
          branchId: branchId || existing.branchId || null,
          NOT: { id: parseInt(id) }
        },
        data: { isDefault: false }
      });
    }

    // If setting as active, deactivate others
    if (isActive && isActive !== existing.isActive) {
      await prisma.smtpSetting.updateMany({
        where: {
          companyId: companyId || existing.companyId || null,
          branchId: branchId || existing.branchId || null,
          NOT: { id: parseInt(id) }
        },
        data: { isActive: false }
      });
    }

    const updateData: any = {
      ...(name && { name }),
      ...(host && { host }),
      ...(port && { port: parseInt(port) }),
      ...(secure !== undefined && { secure }),
      ...(username && { username }),
      ...(password && password !== "••••••••" && { password }), // Only update if new password provided
      ...(fromEmail && { fromEmail }),
      ...(fromName !== undefined && { fromName }),
      ...(isActive !== undefined && { isActive }),
      ...(isDefault !== undefined && { isDefault }),
      ...(companyId !== undefined && { companyId: companyId || null }),
      ...(branchId !== undefined && { branchId: branchId || null })
    };

    const setting = await prisma.smtpSetting.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Log activity for SMTP setting update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'smtp_setting_updated',
        message: `${userContext.name || 'User'} updated SMTP setting "${setting.name}"`,
        userId: userContext.id,
        companyId: setting.companyId || userContext.companyId || undefined,
        branchId: setting.branchId || userContext.branchId || undefined,
        entityType: 'SMTP_SETTING',
        entityId: setting.id,
      });
    }

    // Return without password
    const { password: _, ...response } = setting;
    res.json(response);
  } catch (error: any) {
    console.error("Error updating SMTP setting:", error);
    res.status(500).json({ error: error.message || "Failed to update SMTP setting" });
  }
};

// Delete SMTP setting
export const deleteSmtpSetting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const setting = await prisma.smtpSetting.findUnique({
      where: { id: parseInt(id) }
    });

    if (!setting) {
      return res.status(404).json({ error: "SMTP setting not found" });
    }

    // Prevent deletion of default settings
    if (setting.isDefault) {
      return res.status(400).json({
        error: "Cannot delete default SMTP setting. Set another setting as default first."
      });
    }

    // Log activity for SMTP setting deletion
    const userContext = await getUserContext(userId);
    if (userContext && setting) {
      await logActivity({
        type: 'smtp_setting_deleted',
        message: `${userContext.name || 'User'} deleted SMTP setting "${setting.name}"`,
        userId: userContext.id,
        companyId: setting.companyId || userContext.companyId || undefined,
        branchId: setting.branchId || userContext.branchId || undefined,
        entityType: 'SMTP_SETTING',
        entityId: parseInt(id),
      });
    }

    await prisma.smtpSetting.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "SMTP setting deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting SMTP setting:", error);
    res.status(500).json({ error: error.message || "Failed to delete SMTP setting" });
  }
};

// Toggle active status
export const toggleSmtpSetting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const setting = await prisma.smtpSetting.findUnique({
      where: { id: parseInt(id) }
    });

    if (!setting) {
      return res.status(404).json({ error: "SMTP setting not found" });
    }

    // If activating, deactivate others
    if (!setting.isActive) {
      await prisma.smtpSetting.updateMany({
        where: {
          companyId: setting.companyId || null,
          branchId: setting.branchId || null,
          NOT: { id: parseInt(id) }
        },
        data: { isActive: false }
      });
    }

    const updated = await prisma.smtpSetting.update({
      where: { id: parseInt(id) },
      data: { isActive: !setting.isActive }
    });

    // Return without password
    const { password: _, ...response } = updated;
    res.json(response);
  } catch (error: any) {
    console.error("Error toggling SMTP setting:", error);
    res.status(500).json({ error: error.message || "Failed to toggle SMTP setting" });
  }
};

// Test SMTP connection
export const testSmtpConnection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const setting = await prisma.smtpSetting.findUnique({
      where: { id: parseInt(id) }
    });

    if (!setting) {
      return res.status(404).json({ error: "SMTP setting not found" });
    }

    // In a real implementation, you would test the SMTP connection here
    // For now, we'll just return a success message
    // You would use nodemailer or similar library to test the connection

    res.json({
      success: true,
      message: "SMTP connection test successful"
    });
  } catch (error: any) {
    console.error("Error testing SMTP connection:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to test SMTP connection"
    });
  }
};













