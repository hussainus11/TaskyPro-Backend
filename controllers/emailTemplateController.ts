import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all email templates
export const getEmailTemplates = async (req: AuthRequest, res: Response) => {
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

    const { companyId, branchId, category, isActive } = req.query;

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
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    res.json(templates);
  } catch (error: any) {
    console.error("Error fetching email templates:", error);
    res.status(500).json({ error: error.message || "Failed to fetch email templates" });
  }
};

// Get single email template
export const getEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const template = await prisma.emailTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!template) {
      return res.status(404).json({ error: "Email template not found" });
    }

    res.json(template);
  } catch (error: any) {
    console.error("Error fetching email template:", error);
    res.status(500).json({ error: error.message || "Failed to fetch email template" });
  }
};

// Create email template
export const createEmailTemplate = async (req: AuthRequest, res: Response) => {
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

    const { name, subject, body, category, description, variables, isActive, isDefault, companyId, branchId } = req.body;

    const finalCompanyId = companyId || user.companyId;
    const finalBranchId = branchId || user.branchId;

    // Check for duplicate name
    const existing = await prisma.emailTemplate.findFirst({
      where: {
        name,
        companyId: finalCompanyId || null,
        branchId: finalBranchId || null
      }
    });

    if (existing) {
      return res.status(400).json({ error: "Template with this name already exists" });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.emailTemplate.updateMany({
        where: {
          category: category || "CUSTOM",
          companyId: finalCompanyId || null,
          branchId: finalBranchId || null
        },
        data: { isDefault: false }
      });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body,
        category: category || "CUSTOM",
        description,
        variables: variables || {},
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
        companyId: finalCompanyId || null,
        branchId: finalBranchId || null
      }
    });

    // Log activity for email template creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'email_template_created',
        message: `${userContext.name || 'User'} created email template "${name}"`,
        userId: userContext.id,
        companyId: finalCompanyId || userContext.companyId || undefined,
        branchId: finalBranchId || userContext.branchId || undefined,
        entityType: 'EMAIL_TEMPLATE',
        entityId: template.id,
      });
    }

    res.status(201).json(template);
  } catch (error: any) {
    console.error("Error creating email template:", error);
    res.status(500).json({ error: error.message || "Failed to create email template" });
  }
};

// Update email template
export const updateEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { name, subject, body, category, description, variables, isActive, isDefault, companyId, branchId } = req.body;

    // Check if template exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Email template not found" });
    }

    // Check for duplicate name (excluding current template)
    if (name && name !== existing.name) {
      const duplicate = await prisma.emailTemplate.findFirst({
        where: {
          name,
          companyId: companyId || existing.companyId || null,
          branchId: branchId || existing.branchId || null,
          NOT: { id: parseInt(id) }
        }
      });

      if (duplicate) {
        return res.status(400).json({ error: "Template with this name already exists" });
      }
    }

    // If setting as default, unset other defaults in same category
    if (isDefault && isDefault !== existing.isDefault) {
      await prisma.emailTemplate.updateMany({
        where: {
          category: category || existing.category,
          companyId: companyId || existing.companyId || null,
          branchId: branchId || existing.branchId || null,
          NOT: { id: parseInt(id) }
        },
        data: { isDefault: false }
      });
    }

    const template = await prisma.emailTemplate.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(body && { body }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(variables !== undefined && { variables }),
        ...(isActive !== undefined && { isActive }),
        ...(isDefault !== undefined && { isDefault }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(branchId !== undefined && { branchId: branchId || null })
      }
    });

    // Log activity for email template update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'email_template_updated',
        message: `${userContext.name || 'User'} updated email template "${template.name}"`,
        userId: userContext.id,
        companyId: template.companyId || userContext.companyId || undefined,
        branchId: template.branchId || userContext.branchId || undefined,
        entityType: 'EMAIL_TEMPLATE',
        entityId: template.id,
      });
    }

    res.json(template);
  } catch (error: any) {
    console.error("Error updating email template:", error);
    res.status(500).json({ error: error.message || "Failed to update email template" });
  }
};

// Delete email template
export const deleteEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!template) {
      return res.status(404).json({ error: "Email template not found" });
    }

    // Prevent deletion of default templates
    if (template.isDefault) {
      return res.status(400).json({ error: "Cannot delete default template. Set another template as default first." });
    }

    // Log activity for email template deletion
    const userContext = await getUserContext(userId);
    if (userContext && template) {
      await logActivity({
        type: 'email_template_deleted',
        message: `${userContext.name || 'User'} deleted email template "${template.name}"`,
        userId: userContext.id,
        companyId: template.companyId || userContext.companyId || undefined,
        branchId: template.branchId || userContext.branchId || undefined,
        entityType: 'EMAIL_TEMPLATE',
        entityId: parseInt(id),
      });
    }

    await prisma.emailTemplate.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Email template deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting email template:", error);
    res.status(500).json({ error: error.message || "Failed to delete email template" });
  }
};

// Toggle active status
export const toggleEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!template) {
      return res.status(404).json({ error: "Email template not found" });
    }

    const updated = await prisma.emailTemplate.update({
      where: { id: parseInt(id) },
      data: { isActive: !template.isActive }
    });

    res.json(updated);
  } catch (error: any) {
    console.error("Error toggling email template:", error);
    res.status(500).json({ error: error.message || "Failed to toggle email template" });
  }
};

// Duplicate email template
export const duplicateEmailTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!template) {
      return res.status(404).json({ error: "Email template not found" });
    }

    const duplicated = await prisma.emailTemplate.create({
      data: {
        name: `${template.name} (Copy)`,
        subject: template.subject,
        body: template.body,
        category: template.category,
        description: template.description,
        variables: template.variables as any,
        isActive: false, // Duplicated templates start as inactive
        isDefault: false, // Duplicated templates are never default
        companyId: template.companyId,
        branchId: template.branchId
      }
    });

    res.status(201).json(duplicated);
  } catch (error: any) {
    console.error("Error duplicating email template:", error);
    res.status(500).json({ error: error.message || "Failed to duplicate email template" });
  }
};

