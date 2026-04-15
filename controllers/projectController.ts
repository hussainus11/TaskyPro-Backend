import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logActivity, getUserContext } from "../utils/activityLogger";

// Get all projects
export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
    const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
    const status = req.query.status as string | undefined;

    const where: any = {};

    if (companyId) where.companyId = companyId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (userId) {
      where.OR = [
        { managerId: userId },
        { members: { some: { userId } } }
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(projects);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: error.message || "Failed to fetch projects" });
  }
};

// Get a single project by ID
export const getProject = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error: any) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: error.message || "Failed to fetch project" });
  }
};

// Create a new project
export const createProject = async (req: Request, res: Response) => {
  try {
    const {
      title,
      subtitle,
      description,
      status,
      progress,
      startDate,
      endDate,
      deadline,
      budget,
      spent,
      clientName,
      clientAvatar,
      progressColor,
      badgeColor,
      managerId,
      companyId,
      branchId,
      memberIds
    } = req.body;

    const project = await prisma.project.create({
      data: {
        title,
        subtitle,
        description,
        status: status || "PENDING",
        progress: progress || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        budget,
        spent: spent || 0,
        clientName,
        clientAvatar,
        progressColor,
        badgeColor,
        managerId: managerId ? parseInt(managerId) : null,
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null,
        members: memberIds && Array.isArray(memberIds) && memberIds.length > 0
          ? {
              create: memberIds.map((userId: number) => ({
                userId: parseInt(userId.toString())
              }))
            }
          : undefined
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    // Log activity for project creation
    const manager = project.manager;
    if (manager) {
      const userContext = await getUserContext(manager.id);
      if (userContext) {
        await logActivity({
          type: 'project_created',
          message: `${userContext.name || 'User'} created project "${title}"`,
          userId: userContext.id,
          companyId: project.companyId || undefined,
          branchId: project.branchId || undefined,
          entityType: 'PROJECT',
          entityId: project.id,
        });
      }
    }

    res.status(201).json(project);
  } catch (error: any) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: error.message || "Failed to create project" });
  }
};

// Update a project
export const updateProject = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const {
      title,
      subtitle,
      description,
      status,
      progress,
      startDate,
      endDate,
      deadline,
      budget,
      spent,
      clientName,
      clientAvatar,
      progressColor,
      badgeColor,
      managerId,
      memberIds
    } = req.body;

    // If memberIds is provided, update members
    if (memberIds && Array.isArray(memberIds)) {
      // Delete existing members
      await prisma.projectMember.deleteMany({
        where: { projectId: id }
      });

      // Create new members
      if (memberIds.length > 0) {
        await prisma.projectMember.createMany({
          data: memberIds.map((userId: number) => ({
            projectId: id,
            userId: parseInt(userId.toString())
          }))
        });
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        title,
        subtitle,
        description,
        status,
        progress,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        budget,
        spent,
        clientName,
        clientAvatar,
        progressColor,
        badgeColor,
        managerId: managerId ? parseInt(managerId) : undefined
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    // Log activity for project update
    const manager = project.manager;
    if (manager) {
      const userContext = await getUserContext(manager.id);
      if (userContext) {
        await logActivity({
          type: 'project_updated',
          message: `${userContext.name || 'User'} updated project "${project.title}"`,
          userId: userContext.id,
          companyId: project.companyId || undefined,
          branchId: project.branchId || undefined,
          entityType: 'PROJECT',
          entityId: project.id,
        });
      }
    }

    res.json(project);
  } catch (error: any) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: error.message || "Failed to update project" });
  }
};

// Delete a project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // Get project details before deleting for activity logging
    const project = await prisma.project.findUnique({
      where: { id },
      select: { 
        id: true,
        title: true,
        managerId: true,
        companyId: true,
        branchId: true
      }
    });

    if (project && project.managerId) {
      const userContext = await getUserContext(project.managerId);
      if (userContext) {
        await logActivity({
          type: 'project_deleted',
          message: `${userContext.name || 'User'} deleted project "${project.title}"`,
          userId: userContext.id,
          companyId: project.companyId || undefined,
          branchId: project.branchId || undefined,
          entityType: 'PROJECT',
          entityId: id,
        });
      }
    }

    await prisma.project.delete({
      where: { id }
    });

    res.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: error.message || "Failed to delete project" });
  }
};

// Get project statistics
export const getProjectStats = async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
    const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (branchId) where.branchId = branchId;

    const [total, pending, active, completed, cancelled] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.count({ where: { ...where, status: "PENDING" } }),
      prisma.project.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.project.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.project.count({ where: { ...where, status: "CANCELLED" } })
    ]);

    res.json({
      total,
      pending,
      active,
      completed,
      cancelled
    });
  } catch (error: any) {
    console.error("Error fetching project stats:", error);
    res.status(500).json({ error: error.message || "Failed to fetch project stats" });
  }
};

// Get recent projects
export const getRecentProjects = async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
    const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (branchId) where.branchId = branchId;

    const projects = await prisma.project.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          },
          take: 3 // Limit team members shown
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });

    res.json(projects);
  } catch (error: any) {
    console.error("Error fetching recent projects:", error);
    res.status(500).json({ error: error.message || "Failed to fetch recent projects" });
  }
};

