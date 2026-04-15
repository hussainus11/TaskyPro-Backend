import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all pricing plans
export const getPricingPlans = async (req: AuthRequest, res: Response) => {
  try {
    const { industry, isActive } = req.query;

    const where: any = {};
    if (industry) {
      where.industry = industry as string;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const plans = await prisma.pricingPlan.findMany({
      where,
      orderBy: {
        price: 'asc'
      }
    });

    res.json(plans);
  } catch (error: any) {
    console.error('Error fetching pricing plans:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
};

// Get pricing plans by industry
export const getPricingPlansByIndustry = async (req: AuthRequest, res: Response) => {
  try {
    const { industry } = req.params;

    // Get plans for the specific industry or plans with no industry (available for all)
    const plans = await prisma.pricingPlan.findMany({
      where: {
        isActive: true,
        OR: [
          { industry: industry },
          { industry: null }
        ]
      },
      orderBy: {
        price: 'asc'
      },
      take: 3 // Limit to 3 plans as per requirements
    });

    res.json(plans);
  } catch (error: any) {
    console.error('Error fetching pricing plans by industry:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
};

// Get single pricing plan
export const getPricingPlanById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: parseInt(id) }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Pricing plan not found' });
    }

    res.json(plan);
  } catch (error: any) {
    console.error('Error fetching pricing plan:', error);
    res.status(500).json({ error: 'Failed to fetch pricing plan' });
  }
};

// Create pricing plan
export const createPricingPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name,
      description,
      price,
      yearlyPrice,
      industry,
      features,
      enabledMenuItems,
      isActive
    } = req.body;

    // Validate required fields
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Check for duplicate name
    const existing = await prisma.pricingPlan.findFirst({
      where: {
        name,
        industry: industry || null
      }
    });

    if (existing) {
      return res.status(409).json({ error: 'Pricing plan with this name already exists for this industry' });
    }

    const plan = await prisma.pricingPlan.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null,
        industry: industry || null,
        features: features || [],
        enabledMenuItems: enabledMenuItems || [],
        isActive: isActive !== undefined ? isActive : true
      }
    });

    // Log activity
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'pricing_plan_created',
        message: `${userContext.name || 'Admin'} created pricing plan "${name}"`,
        userId: userContext.id,
        companyId: userContext.companyId || undefined,
        branchId: userContext.branchId || undefined,
        entityType: 'PRICING_PLAN',
        entityId: plan.id,
      });
    }

    res.status(201).json(plan);
  } catch (error: any) {
    console.error('Error creating pricing plan:', error);
    res.status(500).json({ error: 'Failed to create pricing plan', details: error.message });
  }
};

// Update pricing plan
export const updatePricingPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const {
      name,
      description,
      price,
      yearlyPrice,
      industry,
      features,
      enabledMenuItems,
      isActive
    } = req.body;

    // Check if plan exists
    const existing = await prisma.pricingPlan.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pricing plan not found' });
    }

    // Check for duplicate name (excluding current plan)
    if (name && name !== existing.name) {
      const duplicate = await prisma.pricingPlan.findFirst({
        where: {
          name,
          industry: industry !== undefined ? (industry || null) : existing.industry,
          NOT: { id: parseInt(id) }
        }
      });

      if (duplicate) {
        return res.status(409).json({ error: 'Pricing plan with this name already exists for this industry' });
      }
    }

    const plan = await prisma.pricingPlan.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(yearlyPrice !== undefined && { yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null }),
        ...(industry !== undefined && { industry: industry || null }),
        ...(features && { features }),
        ...(enabledMenuItems !== undefined && { enabledMenuItems: enabledMenuItems || [] }),
        ...(isActive !== undefined && { isActive })
      }
    });

    // Log activity
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'pricing_plan_updated',
        message: `${userContext.name || 'Admin'} updated pricing plan "${plan.name}"`,
        userId: userContext.id,
        companyId: userContext.companyId || undefined,
        branchId: userContext.branchId || undefined,
        entityType: 'PRICING_PLAN',
        entityId: plan.id,
      });
    }

    res.json(plan);
  } catch (error: any) {
    console.error('Error updating pricing plan:', error);
    res.status(500).json({ error: 'Failed to update pricing plan', details: error.message });
  }
};

// Delete pricing plan
export const deletePricingPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const plan = await prisma.pricingPlan.findUnique({
      where: { id: parseInt(id) }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Pricing plan not found' });
    }

    // Log activity before deletion
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'pricing_plan_deleted',
        message: `${userContext.name || 'Admin'} deleted pricing plan "${plan.name}"`,
        userId: userContext.id,
        companyId: userContext.companyId || undefined,
        branchId: userContext.branchId || undefined,
        entityType: 'PRICING_PLAN',
        entityId: parseInt(id),
      });
    }

    await prisma.pricingPlan.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting pricing plan:', error);
    res.status(500).json({ error: 'Failed to delete pricing plan', details: error.message });
  }
};



















































