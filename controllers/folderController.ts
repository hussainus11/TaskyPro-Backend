import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all folders
export const getFolders = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId, userId, parentFolderId, starred, search } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (userId) where.userId = parseInt(userId as string);
    if (parentFolderId !== undefined) {
      where.parentFolderId = parentFolderId === "null" || parentFolderId === "" ? null : parseInt(parentFolderId as string);
    }
    if (starred !== undefined) where.starred = starred === "true";
    if (search) {
      where.name = { contains: search as string, mode: "insensitive" };
    }

    const folders = await prisma.folder.findMany({
      where,
      include: {
        _count: {
          select: {
            files: true,
            subfolders: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parentFolder: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Add items count (files + subfolders)
    const foldersWithItems = folders.map((folder) => ({
      ...folder,
      items: folder._count.files + folder._count.subfolders,
    }));

    res.json(foldersWithItems);
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ error: "Failed to fetch folders" });
  }
};

// Get folder by ID
export const getFolderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const folder = await prisma.folder.findUnique({
      where: { id: parseInt(id) },
      include: {
        subfolders: {
          include: {
            _count: {
              select: {
                files: true,
                subfolders: true,
              },
            },
          },
        },
        files: true,
        user: true,
        parentFolder: true,
      },
    });

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.json(folder);
  } catch (error) {
    console.error("Error fetching folder:", error);
    res.status(500).json({ error: "Failed to fetch folder" });
  }
};

// Create folder
export const createFolder = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId, userId: queryUserId } = req.query;
    const { name, parentFolderId, starred, userId, companyId, branchId } = req.body;

    const folder = await prisma.folder.create({
      data: {
        name,
        parentFolderId: parentFolderId ? parseInt(parentFolderId) : null,
        starred: starred || false,
        userId: userId || (queryUserId ? parseInt(queryUserId as string) : null),
        companyId: companyId || (queryCompanyId ? parseInt(queryCompanyId as string) : null),
        branchId: branchId || (queryBranchId ? parseInt(queryBranchId as string) : null),
      },
      include: {
        _count: {
          select: {
            files: true,
            subfolders: true,
          },
        },
      },
    });

    // Log activity for folder creation
    if (folder.userId) {
      const userContext = await getUserContext(folder.userId);
      if (userContext) {
        await logActivity({
          type: 'folder_created',
          message: `${userContext.name || 'User'} created folder "${name}"`,
          userId: userContext.id,
          companyId: folder.companyId || userContext.companyId || undefined,
          branchId: folder.branchId || userContext.branchId || undefined,
          entityType: 'FOLDER',
          entityId: folder.id,
        });
      }
    }

    res.status(201).json({
      ...folder,
      items: folder._count.files + folder._count.subfolders,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Failed to create folder" });
  }
};

// Update folder
export const updateFolder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = {};

    const allowedFields = ["name", "parentFolderId", "starred"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "parentFolderId") {
          updateData[field] = req.body[field] ? parseInt(req.body[field]) : null;
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    const folder = await prisma.folder.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        _count: {
          select: {
            files: true,
            subfolders: true,
          },
        },
      },
    });

    // Log activity for folder update
    if (folder.userId) {
      const userContext = await getUserContext(folder.userId);
      if (userContext) {
        await logActivity({
          type: 'folder_updated',
          message: `${userContext.name || 'User'} updated folder "${folder.name}"`,
          userId: userContext.id,
          companyId: folder.companyId || userContext.companyId || undefined,
          branchId: folder.branchId || userContext.branchId || undefined,
          entityType: 'FOLDER',
          entityId: folder.id,
        });
      }
    }

    res.json({
      ...folder,
      items: folder._count.files + folder._count.subfolders,
    });
  } catch (error) {
    console.error("Error updating folder:", error);
    res.status(500).json({ error: "Failed to update folder" });
  }
};

// Delete folder
export const deleteFolder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.folder.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ error: "Failed to delete folder" });
  }
};



