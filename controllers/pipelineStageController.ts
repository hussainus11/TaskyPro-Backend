import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all stages for a pipeline
export const getPipelineStages = async (req: AuthRequest, res: Response) => {
  try {
    const { pipelineId } = req.params;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify pipeline belongs to user
    const pipeline = await prisma.dealPipeline.findUnique({
      where: { id: parseInt(pipelineId) }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    if (pipeline.companyId !== user.companyId || 
        (pipeline.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const stages = await prisma.pipelineStage.findMany({
      where: { pipelineId: parseInt(pipelineId) },
      include: {
        fromConnections: {
          include: { toStage: true }
        },
        toConnections: {
          include: { fromStage: true }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json(stages);
  } catch (error: any) {
    console.error('Get pipeline stages error:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline stages', details: error.message });
  }
};

// Create a pipeline stage
export const createPipelineStage = async (req: AuthRequest, res: Response) => {
  try {
    const { pipelineId } = req.params;
    const { name, color, order } = req.body;
    const userId = req.userId;

    if (!name || !color) {
      return res.status(400).json({ error: 'Name and color are required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify pipeline belongs to user
    const pipeline = await prisma.dealPipeline.findUnique({
      where: { id: parseInt(pipelineId) }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    if (pipeline.companyId !== user.companyId || 
        (pipeline.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get max order if not provided
    let stageOrder = order;
    if (stageOrder === undefined) {
      const maxOrder = await prisma.pipelineStage.findFirst({
        where: { pipelineId: parseInt(pipelineId) },
        orderBy: { order: 'desc' }
      });
      stageOrder = maxOrder ? maxOrder.order + 1 : 0;
    }

    const stage = await prisma.pipelineStage.create({
      data: {
        name,
        color,
        order: stageOrder,
        pipelineId: parseInt(pipelineId)
      }
    });

    // Log activity for pipeline stage creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'pipeline_stage_created',
        message: `${userContext.name || 'User'} created pipeline stage "${name}"`,
        userId: userContext.id,
        companyId: pipeline.companyId || userContext.companyId || undefined,
        branchId: pipeline.branchId || userContext.branchId || undefined,
        entityType: 'PIPELINE_STAGE',
        entityId: stage.id,
      });
    }

    res.status(201).json(stage);
  } catch (error: any) {
    console.error('Create pipeline stage error:', error);
    res.status(500).json({ error: 'Failed to create pipeline stage', details: error.message });
  }
};

// Update a pipeline stage
export const updatePipelineStage = async (req: AuthRequest, res: Response) => {
  try {
    const { pipelineId, stageId } = req.params;
    const { name, color, order } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify pipeline belongs to user
    const pipeline = await prisma.dealPipeline.findUnique({
      where: { id: parseInt(pipelineId) }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    if (pipeline.companyId !== user.companyId || 
        (pipeline.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const stage = await prisma.pipelineStage.findUnique({
      where: { id: parseInt(stageId) }
    });

    if (!stage || stage.pipelineId !== parseInt(pipelineId)) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (order !== undefined) updateData.order = order;

    const updatedStage = await prisma.pipelineStage.update({
      where: { id: parseInt(stageId) },
      data: updateData
    });

    // Log activity for pipeline stage update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'pipeline_stage_updated',
        message: `${userContext.name || 'User'} updated pipeline stage "${updatedStage.name}"`,
        userId: userContext.id,
        companyId: pipeline.companyId || userContext.companyId || undefined,
        branchId: pipeline.branchId || userContext.branchId || undefined,
        entityType: 'PIPELINE_STAGE',
        entityId: updatedStage.id,
      });
    }

    res.json(updatedStage);
  } catch (error: any) {
    console.error('Update pipeline stage error:', error);
    res.status(500).json({ error: 'Failed to update pipeline stage', details: error.message });
  }
};

// Delete a pipeline stage
export const deletePipelineStage = async (req: AuthRequest, res: Response) => {
  try {
    const { pipelineId, stageId } = req.params;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify pipeline belongs to user
    const pipeline = await prisma.dealPipeline.findUnique({
      where: { id: parseInt(pipelineId) }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    if (pipeline.companyId !== user.companyId || 
        (pipeline.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const stage = await prisma.pipelineStage.findUnique({
      where: { id: parseInt(stageId) }
    });

    if (!stage || stage.pipelineId !== parseInt(pipelineId)) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    // Log activity for pipeline stage deletion before deleting
    const userContext = await getUserContext(userId);
    if (userContext && stage && pipeline) {
      await logActivity({
        type: 'pipeline_stage_deleted',
        message: `${userContext.name || 'User'} deleted pipeline stage "${stage.name}"`,
        userId: userContext.id,
        companyId: pipeline.companyId || userContext.companyId || undefined,
        branchId: pipeline.branchId || userContext.branchId || undefined,
        entityType: 'PIPELINE_STAGE',
        entityId: parseInt(stageId),
      });
    }

    // Connections will be deleted automatically due to cascade

    await prisma.pipelineStage.delete({
      where: { id: parseInt(stageId) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete pipeline stage error:', error);
    res.status(500).json({ error: 'Failed to delete pipeline stage', details: error.message });
  }
};

// Reorder pipeline stages
export const reorderPipelineStages = async (req: AuthRequest, res: Response) => {
  try {
    const { pipelineId } = req.params;
    const { stages } = req.body; // Array of { id, order }
    const userId = req.userId;

    if (!stages || !Array.isArray(stages)) {
      return res.status(400).json({ error: 'Stages array is required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify pipeline belongs to user
    const pipeline = await prisma.dealPipeline.findUnique({
      where: { id: parseInt(pipelineId) }
    });

    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    if (pipeline.companyId !== user.companyId || 
        (pipeline.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update all stages in a transaction
    await prisma.$transaction(
      stages.map((stage: { id: number; order: number }) =>
        prisma.pipelineStage.update({
          where: { id: stage.id },
          data: { order: stage.order }
        })
      )
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Reorder pipeline stages error:', error);
    res.status(500).json({ error: 'Failed to reorder pipeline stages', details: error.message });
  }
};













