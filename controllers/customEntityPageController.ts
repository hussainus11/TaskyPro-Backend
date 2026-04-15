import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all custom entity pages
export const getCustomEntityPages = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { companyId, branchId } = req.query;

    const where: any = {
      isActive: true
    };

    if (companyId) {
      where.companyId = parseInt(companyId as string);
    } else if (user.companyId) {
      where.companyId = user.companyId;
    } else {
      where.companyId = null;
    }

    if (branchId) {
      const bid = parseInt(branchId as string);
      // Include company-level pages (branchId = null) alongside branch-scoped pages.
      where.OR = [{ branchId: bid }, { branchId: null }];
    } else if (user.branchId) {
      // Include company-level pages (branchId = null) alongside branch-scoped pages.
      where.OR = [{ branchId: user.branchId }, { branchId: null }];
    } else {
      where.branchId = null;
    }

    const pages = await prisma.customEntityPage.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            entityType: true,
            customEntityName: true,
            isActive: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json(pages);
  } catch (error: any) {
    console.error("Error fetching custom entity pages:", error);
    res.status(500).json({ error: error.message || "Failed to fetch custom entity pages" });
  }
};

// Get custom entity page by slug
export const getCustomEntityPageBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { slug } = req.params;
    const { companyId, branchId } = req.query;

    const where: any = {
      slug,
      isActive: true
    };

    if (companyId) {
      where.companyId = parseInt(companyId as string);
    } else if (user.companyId) {
      where.companyId = user.companyId;
    } else {
      where.companyId = null;
    }

    if (branchId) {
      const bid = parseInt(branchId as string);
      // Include company-level pages (branchId = null) alongside branch-scoped pages.
      where.OR = [{ branchId: bid }, { branchId: null }];
    } else if (user.branchId) {
      // Include company-level pages (branchId = null) alongside branch-scoped pages.
      where.OR = [{ branchId: user.branchId }, { branchId: null }];
    } else {
      where.branchId = null;
    }

    const page = await prisma.customEntityPage.findFirst({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            entityType: true,
            customEntityName: true,
            formFields: true,
            isActive: true
          }
        }
      }
    });

    if (!page) {
      return res.status(404).json({ error: "Custom entity page not found" });
    }

    res.json(page);
  } catch (error: any) {
    console.error("Error fetching custom entity page:", error);
    res.status(500).json({ error: error.message || "Failed to fetch custom entity page" });
  }
};

