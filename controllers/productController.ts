import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const { status, category, search } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { sku: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        orderItems: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

// Get best selling products
export const getBestSellingProducts = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const { limit = 10 } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);

    // Get products with their order items
    const products = await prisma.product.findMany({
      where,
      include: {
        orderItems: {
          where: {
            order: {
              status: {
                in: ["PAID", "COMPLETED", "DELIVERED"],
              },
            },
          },
        },
      },
    });

    // Calculate sales for each product
    const productsWithSales = products.map((product) => {
      const totalSold = product.orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalRevenue = product.orderItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );

      return {
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        sold: totalRevenue,
        sales: totalSold,
      };
    });

    // Sort by revenue and limit
    const bestSelling = productsWithSales
      .sort((a, b) => b.sold - a.sold)
      .slice(0, parseInt(limit as string));

    res.json(bestSelling);
  } catch (error) {
    console.error("Error fetching best selling products:", error);
    res.status(500).json({ error: "Failed to fetch best selling products" });
  }
};

// Create product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId } = req.query;
    const {
      name,
      description,
      image,
      sku,
      barcode,
      basePrice,
      price,
      discountedPrice,
      cost,
      quantity,
      category,
      sub_category,
      brand,
      variants,
      status,
      productType,
      variantGroups,
      compositeItems,
      customFields,
    } = req.body;

    // Use basePrice if provided, otherwise use price
    const finalPrice = basePrice ? parseFloat(basePrice) : (price ? parseFloat(price) : 0);

    // Get userId from request for createdBy
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    const createdById = userId ? parseInt(userId as string) : null;

    // Parse JSON fields if they are strings
    const parsedVariants = variants ? (typeof variants === 'string' ? JSON.parse(variants) : variants) : null;
    const parsedVariantGroups = variantGroups ? (typeof variantGroups === 'string' ? JSON.parse(variantGroups) : variantGroups) : null;
    const parsedCompositeItems = compositeItems ? (typeof compositeItems === 'string' ? JSON.parse(compositeItems) : compositeItems) : null;
    const parsedCustomFields = customFields ? (typeof customFields === 'string' ? JSON.parse(customFields) : customFields) : null;

    const product = await prisma.product.create({
      data: {
        name,
        description: description?.trim() || null,
        image: image?.trim() || null,
        sku: sku?.trim() || null,
        barcode: barcode?.trim() || null,
        price: finalPrice,
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        cost: cost ? parseFloat(cost) : null,
        chargeTax: chargeTax !== undefined ? Boolean(chargeTax) : false,
        taxPercentage: taxPercentage ? parseFloat(taxPercentage) : null,
        discountType: discountType?.trim() || null,
        discountValue: discountValue ? parseFloat(discountValue) : null,
        quantity: quantity ? parseInt(quantity) : 0,
        category: category?.trim() || null,
        sub_category: sub_category?.trim() || null,
        brand: brand?.trim() || null,
        variants: parsedVariants,
        productType: productType || "SINGLE",
        variantGroups: parsedVariantGroups,
        compositeItems: parsedCompositeItems,
        customFields: parsedCustomFields,
        status: status || "draft",
        companyId: queryCompanyId ? parseInt(queryCompanyId as string) : null,
        branchId: queryBranchId ? parseInt(queryBranchId as string) : null,
        createdById: createdById,
        updatedById: createdById, // On create, updatedBy is same as createdBy
      },
    });

    // Log activity for product creation
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'product_created',
          message: `${userContext.name || 'User'} created product "${name}"`,
          userId: userContext.id,
          companyId: product.companyId || userContext.companyId || undefined,
          branchId: product.branchId || userContext.branchId || undefined,
          entityType: 'PRODUCT',
          entityId: product.id,
        });
      }
    }

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      image,
      sku,
      barcode,
      basePrice,
      price,
      discountedPrice,
      cost,
      chargeTax,
      taxPercentage,
      discountType,
      discountValue,
      quantity,
      category,
      sub_category,
      brand,
      variants,
      status,
      productType,
      variantGroups,
      compositeItems,
      customFields,
    } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (image !== undefined) updateData.image = image?.trim() || null;
    if (sku !== undefined) updateData.sku = sku?.trim() || null;
    if (barcode !== undefined) updateData.barcode = barcode?.trim() || null;
    if (basePrice !== undefined) updateData.price = parseFloat(basePrice);
    else if (price !== undefined) updateData.price = parseFloat(price);
    if (discountedPrice !== undefined) updateData.discountedPrice = discountedPrice ? parseFloat(discountedPrice) : null;
    if (cost !== undefined) updateData.cost = cost ? parseFloat(cost) : null;
    if (chargeTax !== undefined) updateData.chargeTax = Boolean(chargeTax);
    if (taxPercentage !== undefined) updateData.taxPercentage = taxPercentage ? parseFloat(taxPercentage) : null;
    if (discountType !== undefined) updateData.discountType = discountType?.trim() || null;
    if (discountValue !== undefined) updateData.discountValue = discountValue ? parseFloat(discountValue) : null;
    if (quantity !== undefined) updateData.quantity = quantity ? parseInt(quantity) : 0;
    if (category !== undefined) updateData.category = category?.trim() || null;
    if (sub_category !== undefined) updateData.sub_category = sub_category?.trim() || null;
    if (brand !== undefined) updateData.brand = brand?.trim() || null;
    if (variants !== undefined) {
      try {
        updateData.variants = variants ? (typeof variants === 'string' ? JSON.parse(variants) : variants) : null;
      } catch (e) {
        console.error('Error parsing variants:', e);
        updateData.variants = null;
      }
    }
    if (productType !== undefined) updateData.productType = productType;
    if (variantGroups !== undefined) {
      try {
        updateData.variantGroups = variantGroups ? (typeof variantGroups === 'string' ? JSON.parse(variantGroups) : variantGroups) : null;
      } catch (e) {
        console.error('Error parsing variantGroups:', e);
        updateData.variantGroups = null;
      }
    }
    if (compositeItems !== undefined) {
      try {
        updateData.compositeItems = compositeItems ? (typeof compositeItems === 'string' ? JSON.parse(compositeItems) : compositeItems) : null;
      } catch (e) {
        console.error('Error parsing compositeItems:', e);
        updateData.compositeItems = null;
      }
    }
    if (customFields !== undefined) {
      try {
        updateData.customFields = customFields ? (typeof customFields === 'string' ? JSON.parse(customFields) : customFields) : null;
      } catch (e) {
        console.error('Error parsing customFields:', e);
        updateData.customFields = null;
      }
    }
    if (status !== undefined) updateData.status = status;

    // Validate that we have at least one field to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    console.log('Updating product:', { id, updateData });

    // Check if product exists before updating
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      select: { name: true, companyId: true, branchId: true }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get userId from request for updatedBy
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    const updatedById = userId ? parseInt(userId as string) : null;
    
    if (updatedById !== null) {
      updateData.updatedById = updatedById;
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Log activity for product update
    if (userId && existingProduct) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'product_updated',
          message: `${userContext.name || 'User'} updated product "${product.name}"`,
          userId: userContext.id,
          companyId: product.companyId || userContext.companyId || undefined,
          branchId: product.branchId || userContext.branchId || undefined,
          entityType: 'PRODUCT',
          entityId: product.id,
        });
      }
    }

    res.json(product);
  } catch (error: any) {
    console.error("Error updating product:", error);
    const errorMessage = error?.message || "Failed to update product";
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get product details before deleting for activity logging
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, companyId: true, branchId: true }
    });

    if (product) {
      // Log activity for product deletion
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
      if (userId) {
        const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
        if (userContext) {
          await logActivity({
            type: 'product_deleted',
            message: `${userContext.name || 'User'} deleted product "${product.name}"`,
            userId: userContext.id,
            companyId: product.companyId || userContext.companyId || undefined,
            branchId: product.branchId || userContext.branchId || undefined,
            entityType: 'PRODUCT',
            entityId: parseInt(id),
          });
        }
      }
    }

    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};

