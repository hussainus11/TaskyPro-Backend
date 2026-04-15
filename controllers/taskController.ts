import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

/**
 * Get all tasks (using EntityData with entityType TASK)
 */
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const companyId = user?.companyId || null;
    const branchId = user?.branchId || null;

    const where: any = {
      entityType: 'TASK'
    };

    if (companyId) {
      where.companyId = companyId;
    }
    if (branchId) {
      where.branchId = branchId;
    }

    const entityDataList = await prisma.entityData.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            entityType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform EntityData to Task format
    const tasks = entityDataList.map((entity: any) => {
      const taskData = entity.data || {};
      return {
        id: `TASK-${entity.id}`,
        title: taskData.title || taskData.name || 'Untitled Task',
        status: taskData.status || 'todo',
        label: taskData.label || taskData.type || 'feature',
        priority: taskData.priority || 'medium'
      };
    });

    res.json(tasks);
  } catch (error: any) {
    console.error('Failed to fetch tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
  }
};

/**
 * Get a single task by ID
 */
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Remove TASK- prefix if present
    const entityId = id.replace(/^TASK-/, '');
    const entityIdNum = parseInt(entityId);
    
    if (isNaN(entityIdNum)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    
    const entityData = await prisma.entityData.findUnique({
      where: { id: entityIdNum },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            entityType: true
          }
        }
      }
    });
    
    if (!entityData || entityData.entityType !== 'TASK') {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const taskData = entityData.data as any;
    const task = {
      id: `TASK-${entityData.id}`,
      title: taskData.title || taskData.name || 'Untitled Task',
      status: taskData.status || 'todo',
      label: taskData.label || taskData.type || 'feature',
      priority: taskData.priority || 'medium'
    };
    
    res.json(task);
  } catch (error: any) {
    console.error('Failed to fetch task:', error);
    res.status(500).json({ error: 'Failed to fetch task', details: error.message });
  }
};

/**
 * Create a new task (using EntityData)
 */
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, status, label, priority } = req.body;
    const companyId = req.user?.companyId || null;
    const branchId = req.user?.branchId || null;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Create EntityData with entityType TASK
    const entityData = await prisma.entityData.create({
      data: {
        entityType: 'TASK',
        data: {
          title,
          status: status || 'todo',
          label: label || 'feature',
          priority: priority || 'medium'
        } as any,
        companyId,
        branchId
      }
    });
    
    const taskData = entityData.data as any;
    const task = {
      id: `TASK-${entityData.id}`,
      title: taskData.title,
      status: taskData.status || 'todo',
      label: taskData.label || 'feature',
      priority: taskData.priority || 'medium'
    };
    
    res.status(201).json(task);
  } catch (error: any) {
    console.error('Failed to create task:', error);
    res.status(500).json({ error: 'Failed to create task', details: error.message });
  }
};

/**
 * Update a task
 */
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, status, label, priority } = req.body;
    
    // Remove TASK- prefix if present
    const entityId = id.replace(/^TASK-/, '');
    const entityIdNum = parseInt(entityId);
    
    if (isNaN(entityIdNum)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    
    const existingEntity = await prisma.entityData.findUnique({
      where: { id: entityIdNum }
    });
    
    if (!existingEntity || existingEntity.entityType !== 'TASK') {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentData = existingEntity.data as any;
    const updatedData = {
      ...currentData,
      ...(title !== undefined && { title }),
      ...(status !== undefined && { status }),
      ...(label !== undefined && { label }),
      ...(priority !== undefined && { priority })
    };
    
    const updatedEntity = await prisma.entityData.update({
      where: { id: entityIdNum },
      data: {
        data: updatedData as any,
        updatedAt: new Date()
      }
    });
    
    const taskData = updatedEntity.data as any;
    const task = {
      id: `TASK-${updatedEntity.id}`,
      title: taskData.title,
      status: taskData.status || 'todo',
      label: taskData.label || 'feature',
      priority: taskData.priority || 'medium'
    };
    
    res.json(task);
  } catch (error: any) {
    console.error('Failed to update task:', error);
    res.status(500).json({ error: 'Failed to update task', details: error.message });
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Remove TASK- prefix if present
    const entityId = id.replace(/^TASK-/, '');
    const entityIdNum = parseInt(entityId);
    
    if (isNaN(entityIdNum)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    
    const existingEntity = await prisma.entityData.findUnique({
      where: { id: entityIdNum }
    });
    
    if (!existingEntity || existingEntity.entityType !== 'TASK') {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await prisma.entityData.delete({
      where: { id: entityIdNum }
    });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete task:', error);
    res.status(500).json({ error: 'Failed to delete task', details: error.message });
  }
};

