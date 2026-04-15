import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all connections for a pipeline
export const getPipelineConnections = async (req: AuthRequest, res: Response) => {
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

    // Get all stages for this pipeline
    const stages = await prisma.pipelineStage.findMany({
      where: { pipelineId: parseInt(pipelineId) },
      select: { id: true }
    });

    const stageIds = stages.map(s => s.id);

    // Get all connections where at least one stage belongs to this pipeline
    // This allows cross-pipeline connections to be visible
    const connections = await prisma.pipelineConnection.findMany({
      where: {
        OR: [
          { fromStageId: { in: stageIds } },
          { toStageId: { in: stageIds } }
        ]
      },
      include: {
        fromStage: true,
        toStage: true
      }
    });

    res.json(connections);
  } catch (error: any) {
    console.error('Get pipeline connections error:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline connections', details: error.message });
  }
};

// Create a pipeline connection
export const createPipelineConnection = async (req: AuthRequest, res: Response) => {
  try {
    const { pipelineId } = req.params;
    const { fromStageId, toStageId } = req.body;
    const userId = req.userId;

    console.log('Create connection request:', { pipelineId, fromStageId, toStageId, body: req.body });

    if (fromStageId === undefined || fromStageId === null || toStageId === undefined || toStageId === null) {
      return res.status(400).json({ error: 'fromStageId and toStageId are required' });
    }

    const parsedFromStageId = parseInt(String(fromStageId));
    const parsedToStageId = parseInt(String(toStageId));

    if (isNaN(parsedFromStageId) || isNaN(parsedToStageId)) {
      return res.status(400).json({ error: 'fromStageId and toStageId must be valid numbers' });
    }

    if (parsedFromStageId === parsedToStageId) {
      return res.status(400).json({ error: 'Cannot connect a stage to itself' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify both stages exist (they can be from different pipelines)
    const fromStage = await prisma.pipelineStage.findUnique({
      where: { id: parsedFromStageId }
    });

    const toStage = await prisma.pipelineStage.findUnique({
      where: { id: parsedToStageId }
    });

    if (!fromStage || !toStage) {
      return res.status(404).json({ error: 'One or both stages not found' });
    }

    // Verify both stages belong to user's company/branch (allow cross-pipeline connections)
    const fromPipeline = await prisma.dealPipeline.findUnique({
      where: { id: fromStage.pipelineId }
    });

    const toPipeline = await prisma.dealPipeline.findUnique({
      where: { id: toStage.pipelineId }
    });

    if (!fromPipeline || !toPipeline) {
      return res.status(404).json({ error: 'One or both pipelines not found' });
    }

    // Check if both pipelines belong to user's company/branch
    if (fromPipeline.companyId !== user.companyId || 
        (fromPipeline.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized: source pipeline does not belong to your company/branch' });
    }

    if (toPipeline.companyId !== user.companyId || 
        (toPipeline.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized: target pipeline does not belong to your company/branch' });
    }

    // Allow cross-pipeline connections - stages can be from different pipelines

    // Check if connection already exists
    const existing = await prisma.pipelineConnection.findUnique({
      where: {
        fromStageId_toStageId: {
          fromStageId: parsedFromStageId,
          toStageId: parsedToStageId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Connection already exists' });
    }

    const connection = await prisma.pipelineConnection.create({
      data: {
        fromStageId: parsedFromStageId,
        toStageId: parsedToStageId
      },
      include: {
        fromStage: true,
        toStage: true
      }
    });

    // Log activity for pipeline connection creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'pipeline_connection_created',
        message: `${userContext.name || 'User'} created pipeline connection from "${connection.fromStage.name}" to "${connection.toStage.name}"`,
        userId: userContext.id,
        companyId: fromPipeline.companyId || userContext.companyId || undefined,
        branchId: fromPipeline.branchId || userContext.branchId || undefined,
        entityType: 'PIPELINE_CONNECTION',
        entityId: connection.id,
      });
    }

    res.status(201).json(connection);
  } catch (error: any) {
    console.error('Create pipeline connection error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Connection already exists' });
    }
    res.status(500).json({ error: 'Failed to create pipeline connection', details: error.message });
  }
};

// Delete a pipeline connection
export const deletePipelineConnection = async (req: AuthRequest, res: Response) => {
  try {
    const { pipelineId, connectionId } = req.params;
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

    const connection = await prisma.pipelineConnection.findUnique({
      where: { id: parseInt(connectionId) },
      include: {
        fromStage: true,
        toStage: true
      }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Verify connection belongs to user's company/branch (allow cross-pipeline connections)
    const fromPipeline = await prisma.dealPipeline.findUnique({
      where: { id: connection.fromStage.pipelineId }
    });

    if (!fromPipeline || fromPipeline.companyId !== user.companyId || 
        (fromPipeline.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized: connection does not belong to your company/branch' });
    }

    // Log activity for pipeline connection deletion
    const userContext = await getUserContext(userId);
    if (userContext && connection && fromPipeline) {
      await logActivity({
        type: 'pipeline_connection_deleted',
        message: `${userContext.name || 'User'} deleted pipeline connection from "${connection.fromStage.name}" to "${connection.toStage.name}"`,
        userId: userContext.id,
        companyId: fromPipeline.companyId || userContext.companyId || undefined,
        branchId: fromPipeline.branchId || userContext.branchId || undefined,
        entityType: 'PIPELINE_CONNECTION',
        entityId: parseInt(connectionId),
      });
    }

    await prisma.pipelineConnection.delete({
      where: { id: parseInt(connectionId) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete pipeline connection error:', error);
    res.status(500).json({ error: 'Failed to delete pipeline connection', details: error.message });
  }
};






