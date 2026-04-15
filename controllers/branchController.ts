import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

export const getBranches = async (req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      include: { company: true, users: true }
    });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
};

export const getBranchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const branch = await prisma.branch.findUnique({
      where: { id: parseInt(id) },
      include: { company: true, users: true }
    });
    if (branch) {
      res.json(branch);
    } else {
      res.status(404).json({ error: 'Branch not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, address, phone, email, companyId } = req.body;
    const branch = await prisma.branch.create({
      data: { name, address, phone, email, companyId: companyId ? parseInt(companyId) : null }
    });

    // Log activity for branch creation (get userId from request if available)
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'branch_created',
          message: `${userContext.name || 'Admin'} created branch "${name}"`,
          userId: userContext.id,
          companyId: branch.companyId || userContext.companyId || undefined,
          branchId: branch.id,
          entityType: 'BRANCH',
          entityId: branch.id,
        });
      }
    }

    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create branch' });
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, companyId, customFieldsSectionTitle } = req.body;

    // Get branch before updating for activity logging
    const existingBranch = await prisma.branch.findUnique({
      where: { id: parseInt(id) },
      select: { name: true, companyId: true }
    });

    const branch = await prisma.branch.update({
      where: { id: parseInt(id) },
      data: { name, address, phone, email, companyId: companyId ? parseInt(companyId) : null, customFieldsSectionTitle }
    });

    // Log activity for branch update (get userId from request if available)
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId && existingBranch) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'branch_updated',
          message: `${userContext.name || 'Admin'} updated branch "${branch.name}"`,
          userId: userContext.id,
          companyId: branch.companyId || userContext.companyId || undefined,
          branchId: branch.id,
          entityType: 'BRANCH',
          entityId: branch.id,
        });
      }
    }

    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update branch' });
  }
};

export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get branch details before deleting for activity logging
    const branch = await prisma.branch.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, companyId: true }
    });

    if (branch) {
      // Log activity for branch deletion (get userId from request if available)
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
      if (userId) {
        const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
        if (userContext) {
          await logActivity({
            type: 'branch_deleted',
            message: `${userContext.name || 'Admin'} deleted branch "${branch.name}"`,
            userId: userContext.id,
            companyId: branch.companyId || userContext.companyId || undefined,
            branchId: parseInt(id),
            entityType: 'BRANCH',
            entityId: parseInt(id),
          });
        }
      }
    }

    await prisma.branch.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete branch' });
  }
};