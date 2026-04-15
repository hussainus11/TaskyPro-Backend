import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all product subcategories
export const getProductSubCategories = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId, categoryId, isActive } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (categoryId) where.categoryId = parseInt(categoryId as string);
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const subCategories = await prisma.productSubCategory.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(subCategories);
  } catch (error) {
    console.error("Error fetching product subcategories:", error);
    res.status(500).json({ error: "Failed to fetch product subcategories" });
  }
};

// Get product subcategory by ID
export const getProductSubCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subCategory = await prisma.productSubCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
      },
    });

    if (!subCategory) {
      return res.status(404).json({ error: "Product subcategory not found" });
    }

    res.json(subCategory);
  } catch (error) {
    console.error("Error fetching product subcategory:", error);
    res.status(500).json({ error: "Failed to fetch product subcategory" });
  }
};

// Create product subcategory
export const createProductSubCategory = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId } = req.query;
    const {
      name,
      description,
      categoryId,
      isActive = true,
    } = req.body;

    if (!categoryId) {
      return res.status(400).json({ error: "Category ID is required" });
    }

    const subCategory = await prisma.productSubCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        categoryId: parseInt(categoryId),
        isActive: isActive !== false,
        companyId: queryCompanyId ? parseInt(queryCompanyId as string) : null,
        branchId: queryBranchId ? parseInt(queryBranchId as string) : null,
      },
      include: {
        category: true,
      },
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'product_subcategory_created',
          message: `${userContext.name || 'User'} created product subcategory "${name}"`,
          userId: userContext.id,
          companyId: subCategory.companyId || userContext.companyId || undefined,
          branchId: subCategory.branchId || userContext.branchId || undefined,
          entityType: 'PRODUCT_SUBCATEGORY',
          entityId: subCategory.id,
        });
      }
    }

    res.status(201).json(subCategory);
  } catch (error: any) {
    console.error("Error creating product subcategory:", error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: "A subcategory with this name already exists in this category" });
    } else {
      res.status(500).json({ error: "Failed to create product subcategory" });
    }
  }
};

// Update product subcategory
export const updateProductSubCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      categoryId,
      isActive,
    } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
    if (isActive !== undefined) updateData.isActive = isActive;

    const subCategory = await prisma.productSubCategory.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        category: true,
      },
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'product_subcategory_updated',
          message: `${userContext.name || 'User'} updated product subcategory "${subCategory.name}"`,
          userId: userContext.id,
          companyId: subCategory.companyId || userContext.companyId || undefined,
          branchId: subCategory.branchId || userContext.branchId || undefined,
          entityType: 'PRODUCT_SUBCATEGORY',
          entityId: subCategory.id,
        });
      }
    }

    res.json(subCategory);
  } catch (error: any) {
    console.error("Error updating product subcategory:", error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: "A subcategory with this name already exists in this category" });
    } else {
      res.status(500).json({ error: "Failed to update product subcategory" });
    }
  }
};

// Delete product subcategory
export const deleteProductSubCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get subcategory details before deleting for activity logging
    const subCategory = await prisma.productSubCategory.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, companyId: true, branchId: true }
    });

    if (subCategory) {
      // Log activity
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
      if (userId) {
        const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
        if (userContext) {
          await logActivity({
            type: 'product_subcategory_deleted',
            message: `${userContext.name || 'User'} deleted product subcategory "${subCategory.name}"`,
            userId: userContext.id,
            companyId: subCategory.companyId || userContext.companyId || undefined,
            branchId: subCategory.branchId || userContext.branchId || undefined,
            entityType: 'PRODUCT_SUBCATEGORY',
            entityId: parseInt(id),
          });
        }
      }
    }

    await prisma.productSubCategory.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Product subcategory deleted successfully" });
  } catch (error) {
    console.error("Error deleting product subcategory:", error);
    res.status(500).json({ error: "Failed to delete product subcategory" });
  }
};


















































