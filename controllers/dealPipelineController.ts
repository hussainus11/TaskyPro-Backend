import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all deal pipelines for a company/branch
export const getDealPipelines = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const filterCompanyId = companyId ? parseInt(companyId as string) : user.companyId;
    const filterBranchId = branchId ? parseInt(branchId as string) : user.branchId;

    const where: any = {};
    if (filterCompanyId) {
      where.companyId = filterCompanyId;
    }
    if (filterBranchId) {
      where.branchId = filterBranchId;
    } else if (filterCompanyId) {
      // If company but no branch, get company-wide pipelines
      where.branchId = null;
    }

    const pipelines = await prisma.dealPipeline.findMany({
      where,
      include: {
        stages: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { stages: true }
        }
      },
      // NOTE: 'order' requires regenerated Prisma Client after schema change.
      orderBy: [
        ({ order: 'asc' } as any),
        { isDefault: 'desc' },
        { name: 'asc' }
      ] as any
    });

    res.json(pipelines);
  } catch (error: any) {
    console.error('Get deal pipelines error:', error);
    res.status(500).json({ error: 'Failed to fetch deal pipelines', details: error.message });
  }
};

// Reorder deal pipelines (within company/branch scope)
export const reorderDealPipelines = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { pipelines } = req.body as { pipelines?: Array<{ id: number; order: number }> };

    if (!Array.isArray(pipelines) || pipelines.length === 0) {
      return res.status(400).json({ error: 'pipelines array is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const ids = pipelines.map((p) => Number(p.id)).filter((id) => Number.isFinite(id));
    const found = await prisma.dealPipeline.findMany({
      where: {
        id: { in: ids },
        companyId: user.companyId,
        branchId: user.branchId
      },
      select: { id: true }
    });

    const allowed = new Set(found.map((p) => p.id));
    const updates = pipelines
      .filter((p) => allowed.has(Number(p.id)))
      .map((p) =>
        prisma.dealPipeline.update({
          where: { id: Number(p.id) },
          // NOTE: 'order' requires regenerated Prisma Client after schema change.
          data: ({ order: Number(p.order) } as any)
        })
      );

    await prisma.$transaction(updates);

    res.status(204).send();
  } catch (error: any) {
    console.error('Reorder deal pipelines error:', error);
    res.status(500).json({ error: 'Failed to reorder deal pipelines', details: error.message });
  }
};

// Get a single deal pipeline with stages and connections
export const getDealPipeline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pipeline = await prisma.dealPipeline.findUnique({
      where: { id: parseInt(id) },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            fromConnections: {
              include: {
                toStage: true
              }
            },
            toConnections: {
              include: {
                fromStage: true
              }
            }
          }
        }
      }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Deal pipeline not found' });
    }

    // Check if pipeline belongs to user's company/branch
    if (pipeline.companyId !== user.companyId || 
        (pipeline.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(pipeline);
  } catch (error: any) {
    console.error('Get deal pipeline error:', error);
    res.status(500).json({ error: 'Failed to fetch deal pipeline', details: error.message });
  }
};

// Create a deal pipeline
export const createDealPipeline = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, description, isDefault, isActive } = req.body;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.dealPipeline.updateMany({
        where: {
          companyId: user.companyId,
          branchId: user.branchId || null,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const pipeline = await prisma.dealPipeline.create({
      data: {
        name,
        description: description || null,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    // Log activity for deal pipeline creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'deal_pipeline_created',
        message: `${userContext.name || 'User'} created deal pipeline "${name}"`,
        userId: userContext.id,
        companyId: pipeline.companyId || userContext.companyId || undefined,
        branchId: pipeline.branchId || userContext.branchId || undefined,
        entityType: 'DEAL_PIPELINE',
        entityId: pipeline.id,
      });
    }

    res.status(201).json(pipeline);
  } catch (error: any) {
    console.error('Create deal pipeline error:', error);
    res.status(500).json({ error: 'Failed to create deal pipeline', details: error.message });
  }
};

// Update a deal pipeline
export const updateDealPipeline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isDefault, isActive } = req.body;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pipeline = await prisma.dealPipeline.findUnique({
      where: { id: parseInt(id) }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Deal pipeline not found' });
    }

    // Check if pipeline belongs to user's company/branch
    if (pipeline.companyId !== user.companyId || 
        (pipeline.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // If setting as default, unset other defaults
    if (isDefault && !pipeline.isDefault) {
      await prisma.dealPipeline.updateMany({
        where: {
          companyId: user.companyId,
          branchId: user.branchId || null,
          isDefault: true,
          id: { not: parseInt(id) }
        },
        data: { isDefault: false }
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedPipeline = await prisma.dealPipeline.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Log activity for deal pipeline update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'deal_pipeline_updated',
        message: `${userContext.name || 'User'} updated deal pipeline "${updatedPipeline.name}"`,
        userId: userContext.id,
        companyId: updatedPipeline.companyId || userContext.companyId || undefined,
        branchId: updatedPipeline.branchId || userContext.branchId || undefined,
        entityType: 'DEAL_PIPELINE',
        entityId: updatedPipeline.id,
      });
    }

    res.json(updatedPipeline);
  } catch (error: any) {
    console.error('Update deal pipeline error:', error);
    res.status(500).json({ error: 'Failed to update deal pipeline', details: error.message });
  }
};

// Delete a deal pipeline
export const deleteDealPipeline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pipeline = await prisma.dealPipeline.findUnique({
      where: { id: parseInt(id) }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Deal pipeline not found' });
    }

    // Check if pipeline belongs to user's company/branch
    if (pipeline.companyId !== user.companyId || 
        (pipeline.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Log activity for deal pipeline deletion
    const userContext = await getUserContext(userId);
    if (userContext && pipeline) {
      await logActivity({
        type: 'deal_pipeline_deleted',
        message: `${userContext.name || 'User'} deleted deal pipeline "${pipeline.name}"`,
        userId: userContext.id,
        companyId: pipeline.companyId || userContext.companyId || undefined,
        branchId: pipeline.branchId || userContext.branchId || undefined,
        entityType: 'DEAL_PIPELINE',
        entityId: parseInt(id),
      });
    }

    // Stages and connections will be deleted automatically due to cascade
    await prisma.dealPipeline.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete deal pipeline error:', error);
    res.status(500).json({ error: 'Failed to delete deal pipeline', details: error.message });
  }
};













