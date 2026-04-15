import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all product categories
export const getProductCategories = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId, isActive } = req.query;

    const where: any = {};
    
    // Build company/branch filter - include categories that match OR have null companyId/branchId (global categories)
    if (companyId || branchId) {
      const companyIdNum = companyId ? parseInt(companyId as string) : null;
      const branchIdNum = branchId ? parseInt(branchId as string) : null;
      
      where.OR = [
        // Categories matching the specified company/branch
        {
          companyId: companyIdNum,
          branchId: branchIdNum
        },
        // Global categories (no company/branch assigned) - always include these
        {
          companyId: null,
          branchId: null
        }
      ];
    }
    
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const categories = await prisma.productCategory.findMany({
      where,
      include: {
        subCategories: {
          where: isActive !== undefined ? { isActive: isActive === 'true' } : undefined,
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error("Error fetching product categories:", error);
    res.status(500).json({ error: "Failed to fetch product categories" });
  }
};

// Get product category by ID
export const getProductCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await prisma.productCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        subCategories: {
          orderBy: { name: 'asc' }
        }
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Product category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("Error fetching product category:", error);
    res.status(500).json({ error: "Failed to fetch product category" });
  }
};

// Create product category
export const createProductCategory = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId } = req.query;
    const {
      name,
      description,
      isActive = true,
    } = req.body;

    const category = await prisma.productCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive !== false,
        companyId: queryCompanyId ? parseInt(queryCompanyId as string) : null,
        branchId: queryBranchId ? parseInt(queryBranchId as string) : null,
      },
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'product_category_created',
          message: `${userContext.name || 'User'} created product category "${name}"`,
          userId: userContext.id,
          companyId: category.companyId || userContext.companyId || undefined,
          branchId: category.branchId || userContext.branchId || undefined,
          entityType: 'PRODUCT_CATEGORY',
          entityId: category.id,
        });
      }
    }

    res.status(201).json(category);
  } catch (error: any) {
    console.error("Error creating product category:", error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: "A category with this name already exists" });
    } else {
      res.status(500).json({ error: "Failed to create product category" });
    }
  }
};

// Update product category
export const updateProductCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      isActive,
    } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await prisma.productCategory.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'product_category_updated',
          message: `${userContext.name || 'User'} updated product category "${category.name}"`,
          userId: userContext.id,
          companyId: category.companyId || userContext.companyId || undefined,
          branchId: category.branchId || userContext.branchId || undefined,
          entityType: 'PRODUCT_CATEGORY',
          entityId: category.id,
        });
      }
    }

    res.json(category);
  } catch (error: any) {
    console.error("Error updating product category:", error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: "A category with this name already exists" });
    } else {
      res.status(500).json({ error: "Failed to update product category" });
    }
  }
};

// Delete product category
export const deleteProductCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get category details before deleting for activity logging
    const category = await prisma.productCategory.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, companyId: true, branchId: true }
    });

    if (category) {
      // Log activity
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
      if (userId) {
        const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
        if (userContext) {
          await logActivity({
            type: 'product_category_deleted',
            message: `${userContext.name || 'User'} deleted product category "${category.name}"`,
            userId: userContext.id,
            companyId: category.companyId || userContext.companyId || undefined,
            branchId: category.branchId || userContext.branchId || undefined,
            entityType: 'PRODUCT_CATEGORY',
            entityId: parseInt(id),
          });
        }
      }
    }

    await prisma.productCategory.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Product category deleted successfully" });
  } catch (error) {
    console.error("Error deleting product category:", error);
    res.status(500).json({ error: "Failed to delete product category" });
  }
};



























