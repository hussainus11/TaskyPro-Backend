import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all files
export const getFiles = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId, userId, folderId, type, starred, search, startDate, endDate, deviceType } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (userId) where.userId = parseInt(userId as string);
    if (folderId !== undefined) {
      where.folderId = folderId === "null" || folderId === "" ? null : parseInt(folderId as string);
    }
    if (type) where.type = type;
    if (starred !== undefined) where.starred = starred === "true";
    if (deviceType) where.deviceType = deviceType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { originalName: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const files = await prisma.file.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
};

// Get recent files
export const getRecentFiles = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId, userId, limit = 10 } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (userId) where.userId = parseInt(userId as string);

    const files = await prisma.file.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string),
    });

    res.json(files);
  } catch (error) {
    console.error("Error fetching recent files:", error);
    res.status(500).json({ error: "Failed to fetch recent files" });
  }
};

// Get file by ID
export const getFileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = await prisma.file.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
        folder: true,
      },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json(file);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ error: "Failed to fetch file" });
  }
};

// Get file statistics by type
export const getFileStats = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId, userId } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (userId) where.userId = parseInt(userId as string);

    const files = await prisma.file.findMany({
      where,
    });

    const stats = {
      documents: {
        count: files.filter((f) => f.type === "DOCUMENT").length,
        size: files.filter((f) => f.type === "DOCUMENT").reduce((sum, f) => sum + f.size, 0),
      },
      images: {
        count: files.filter((f) => f.type === "IMAGE").length,
        size: files.filter((f) => f.type === "IMAGE").reduce((sum, f) => sum + f.size, 0),
      },
      videos: {
        count: files.filter((f) => f.type === "VIDEO").length,
        size: files.filter((f) => f.type === "VIDEO").reduce((sum, f) => sum + f.size, 0),
      },
      others: {
        count: files.filter((f) => !["DOCUMENT", "IMAGE", "VIDEO"].includes(f.type)).length,
        size: files.filter((f) => !["DOCUMENT", "IMAGE", "VIDEO"].includes(f.type)).reduce((sum, f) => sum + f.size, 0),
      },
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching file stats:", error);
    res.status(500).json({ error: "Failed to fetch file stats" });
  }
};

// Create file
export const createFile = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId, userId: queryUserId } = req.query;
    const {
      name,
      originalName,
      type,
      mimeType,
      size,
      url,
      thumbnailUrl,
      folderId,
      starred,
      userId,
      companyId,
      branchId,
      deviceType,
    } = req.body;

    const file = await prisma.file.create({
      data: {
        name,
        originalName,
        type: type || "OTHER",
        mimeType,
        size: parseInt(size),
        url,
        thumbnailUrl,
        deviceType: deviceType || "desktop", // Default to desktop if not specified
        folderId: folderId ? parseInt(folderId) : null,
        starred: starred || false,
        userId: userId || (queryUserId ? parseInt(queryUserId as string) : null),
        companyId: companyId || (queryCompanyId ? parseInt(queryCompanyId as string) : null),
        branchId: branchId || (queryBranchId ? parseInt(queryBranchId as string) : null),
      },
    });

    // Log activity for file creation
    if (file.userId) {
      const userContext = await getUserContext(file.userId);
      if (userContext) {
        await logActivity({
          type: 'file_created',
          message: `${userContext.name || 'User'} uploaded file "${file.name || file.originalName}"`,
          userId: userContext.id,
          companyId: file.companyId || userContext.companyId || undefined,
          branchId: file.branchId || userContext.branchId || undefined,
          entityType: 'FILE',
          entityId: file.id,
        });
      }
    }

    res.status(201).json(file);
  } catch (error) {
    console.error("Error creating file:", error);
    res.status(500).json({ error: "Failed to create file" });
  }
};

// Update file
export const updateFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = {};

    const allowedFields = ["name", "folderId", "starred"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "folderId") {
          updateData[field] = req.body[field] ? parseInt(req.body[field]) : null;
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    // Get file before updating for activity logging
    const existingFile = await prisma.file.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true, companyId: true, branchId: true, name: true }
    });

    const file = await prisma.file.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Log activity for file update
    if (existingFile && existingFile.userId) {
      const userContext = await getUserContext(existingFile.userId);
      if (userContext) {
        await logActivity({
          type: 'file_updated',
          message: `${userContext.name || 'User'} updated file "${existingFile.name}"`,
          userId: userContext.id,
          companyId: existingFile.companyId || userContext.companyId || undefined,
          branchId: existingFile.branchId || userContext.branchId || undefined,
          entityType: 'FILE',
          entityId: file.id,
        });
      }
    }

    res.json(file);
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({ error: "Failed to update file" });
  }
};

// Delete file
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get file details before deleting for activity logging
    const file = await prisma.file.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, userId: true, companyId: true, branchId: true }
    });

    if (file && file.userId) {
      const userContext = await getUserContext(file.userId);
      if (userContext) {
        await logActivity({
          type: 'file_deleted',
          message: `${userContext.name || 'User'} deleted file "${file.name}"`,
          userId: userContext.id,
          companyId: file.companyId || userContext.companyId || undefined,
          branchId: file.branchId || userContext.branchId || undefined,
          entityType: 'FILE',
          entityId: parseInt(id),
        });
      }
    }

    await prisma.file.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
};

