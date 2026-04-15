import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all email signatures
export const getEmailSignatures = async (req: AuthRequest, res: Response) => {
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

    const { companyId, branchId, userId: filterUserId, isActive, isDefault } = req.query;

    const filterCompanyId = companyId ? parseInt(companyId as string) : user.companyId;
    const filterBranchId = branchId ? parseInt(branchId as string) : user.branchId;
    const filterUser = filterUserId ? parseInt(filterUserId as string) : userId;

    const where: any = {};
    if (filterCompanyId) {
      where.companyId = filterCompanyId;
    }
    if (filterBranchId) {
      where.branchId = filterBranchId;
    } else if (filterCompanyId) {
      where.branchId = null;
    }
    // Show user's signatures and company-wide signatures (where userId is null)
    where.OR = [
      { userId: filterUser },
      { userId: null, companyId: filterCompanyId }
    ];
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (isDefault !== undefined) where.isDefault = isDefault === "true";

    const signatures = await prisma.emailSignature.findMany({
      where,
      orderBy: [
        { userId: "asc" }, // User signatures first
        { isDefault: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(signatures);
  } catch (error: any) {
    console.error("Error fetching email signatures:", error);
    res.status(500).json({ error: error.message || "Failed to fetch email signatures" });
  }
};

// Get single email signature
export const getEmailSignature = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const signature = await prisma.emailSignature.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!signature) {
      return res.status(404).json({ error: "Email signature not found" });
    }

    res.json(signature);
  } catch (error: any) {
    console.error("Error fetching email signature:", error);
    res.status(500).json({ error: error.message || "Failed to fetch email signature" });
  }
};

// Create email signature
export const createEmailSignature = async (req: AuthRequest, res: Response) => {
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
      content,
      plainText,
      userId: signatureUserId,
      isDefault,
      isActive,
      companyId,
      branchId
    } = req.body;

    const finalCompanyId = companyId || user.companyId;
    const finalBranchId = branchId || user.branchId;
    const finalUserId = signatureUserId || userId; // Default to current user

    // Check for duplicate name
    const existing = await prisma.emailSignature.findFirst({
      where: {
        name,
        userId: finalUserId,
        companyId: finalCompanyId || null,
        branchId: finalBranchId || null
      }
    });

    if (existing) {
      return res.status(400).json({ error: "Signature with this name already exists" });
    }

    // If setting as default, unset other defaults for this user/company
    if (isDefault) {
      await prisma.emailSignature.updateMany({
        where: {
          userId: finalUserId,
          companyId: finalCompanyId || null,
          branchId: finalBranchId || null,
          NOT: { id: existing?.id }
        },
        data: { isDefault: false }
      });
    }

    const signature = await prisma.emailSignature.create({
      data: {
        name,
        content,
        plainText: plainText || null,
        userId: finalUserId,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
        companyId: finalCompanyId || null,
        branchId: finalBranchId || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity for email signature creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'email_signature_created',
        message: `${userContext.name || 'User'} created email signature "${name}"`,
        userId: userContext.id,
        companyId: finalCompanyId || userContext.companyId || undefined,
        branchId: finalBranchId || userContext.branchId || undefined,
        entityType: 'EMAIL_SIGNATURE',
        entityId: signature.id,
      });
    }

    res.status(201).json(signature);
  } catch (error: any) {
    console.error("Error creating email signature:", error);
    res.status(500).json({ error: error.message || "Failed to create email signature" });
  }
};

// Update email signature
export const updateEmailSignature = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const {
      name,
      content,
      plainText,
      isDefault,
      isActive,
      companyId,
      branchId
    } = req.body;

    // Check if signature exists
    const existing = await prisma.emailSignature.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Email signature not found" });
    }

    // Check for duplicate name (excluding current signature)
    if (name && name !== existing.name) {
      const duplicate = await prisma.emailSignature.findFirst({
        where: {
          name,
          userId: existing.userId,
          companyId: companyId || existing.companyId || null,
          branchId: branchId || existing.branchId || null,
          NOT: { id: parseInt(id) }
        }
      });

      if (duplicate) {
        return res.status(400).json({ error: "Signature with this name already exists" });
      }
    }

    // If setting as default, unset other defaults for this user/company
    if (isDefault && isDefault !== existing.isDefault) {
      await prisma.emailSignature.updateMany({
        where: {
          userId: existing.userId,
          companyId: companyId || existing.companyId || null,
          branchId: branchId || existing.branchId || null,
          NOT: { id: parseInt(id) }
        },
        data: { isDefault: false }
      });
    }

    const signature = await prisma.emailSignature.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(content && { content }),
        ...(plainText !== undefined && { plainText: plainText || null }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(branchId !== undefined && { branchId: branchId || null })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log activity for email signature update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'email_signature_updated',
        message: `${userContext.name || 'User'} updated email signature "${signature.name}"`,
        userId: userContext.id,
        companyId: signature.companyId || userContext.companyId || undefined,
        branchId: signature.branchId || userContext.branchId || undefined,
        entityType: 'EMAIL_SIGNATURE',
        entityId: signature.id,
      });
    }

    res.json(signature);
  } catch (error: any) {
    console.error("Error updating email signature:", error);
    res.status(500).json({ error: error.message || "Failed to update email signature" });
  }
};

// Delete email signature
export const deleteEmailSignature = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const signature = await prisma.emailSignature.findUnique({
      where: { id: parseInt(id) }
    });

    if (!signature) {
      return res.status(404).json({ error: "Email signature not found" });
    }

    // Log activity for email signature deletion
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'email_signature_deleted',
        message: `${userContext.name || 'User'} deleted email signature "${signature.name}"`,
        userId: userContext.id,
        companyId: signature.companyId || userContext.companyId || undefined,
        branchId: signature.branchId || userContext.branchId || undefined,
        entityType: 'EMAIL_SIGNATURE',
        entityId: parseInt(id),
      });
    }

    await prisma.emailSignature.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Email signature deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting email signature:", error);
    res.status(500).json({ error: error.message || "Failed to delete email signature" });
  }
};

// Toggle active status
export const toggleEmailSignature = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const signature = await prisma.emailSignature.findUnique({
      where: { id: parseInt(id) }
    });

    if (!signature) {
      return res.status(404).json({ error: "Email signature not found" });
    }

    const updated = await prisma.emailSignature.update({
      where: { id: parseInt(id) },
      data: { isActive: !signature.isActive },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error("Error toggling email signature:", error);
    res.status(500).json({ error: error.message || "Failed to toggle email signature" });
  }
};

// Duplicate email signature
export const duplicateEmailSignature = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const signature = await prisma.emailSignature.findUnique({
      where: { id: parseInt(id) }
    });

    if (!signature) {
      return res.status(404).json({ error: "Email signature not found" });
    }

    const duplicated = await prisma.emailSignature.create({
      data: {
        name: `${signature.name} (Copy)`,
        content: signature.content,
        plainText: signature.plainText,
        userId: signature.userId,
        isDefault: false, // Duplicated signatures are never default
        isActive: false, // Duplicated signatures start as inactive
        companyId: signature.companyId,
        branchId: signature.branchId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(duplicated);
  } catch (error: any) {
    console.error("Error duplicating email signature:", error);
    res.status(500).json({ error: error.message || "Failed to duplicate email signature" });
  }
};













