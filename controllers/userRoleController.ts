import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all user roles for a company/branch
export const getUserRoles = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const userId = req.userId;

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
      // If company but no branch, get company-wide roles
      where.branchId = null;
    }

    const roles = await prisma.role.findMany({
      where,
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json(roles);
  } catch (error: any) {
    console.error('Get user roles error:', error);
    res.status(500).json({ error: 'Failed to fetch user roles', details: error.message });
  }
};

// Create a user role
export const createUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, description, permissions, isDefault, isActive } = req.body;
    const userId = req.userId;

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
      await prisma.role.updateMany({
        where: {
          companyId: user.companyId,
          branchId: user.branchId || null,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
        permissions: permissions || null,
        isSystem: false,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    // Log activity for user role creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'user_role_created',
        message: `${userContext.name || 'User'} created user role "${name}"`,
        userId: userContext.id,
        companyId: role.companyId || userContext.companyId || undefined,
        branchId: role.branchId || userContext.branchId || undefined,
        entityType: 'ROLE',
        entityId: role.id,
      });
    }

    res.status(201).json(role);
  } catch (error: any) {
    console.error('Create user role error:', error);
    res.status(500).json({ error: 'Failed to create user role', details: error.message });
  }
};

// Update a user role
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, isDefault, isActive } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) }
    });

    if (!role) {
      return res.status(404).json({ error: 'User role not found' });
    }

    // Check if role belongs to user's company/branch
    if (role.companyId !== user.companyId || 
        (role.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Prevent modification of system roles
    if (role.isSystem && (name !== role.name || isActive !== role.isActive)) {
      return res.status(400).json({ error: 'System roles cannot be modified' });
    }

    // If setting as default, unset other defaults
    if (isDefault && !role.isDefault) {
      await prisma.role.updateMany({
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
    if (permissions !== undefined) updateData.permissions = permissions || null;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedRole = await prisma.role.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Log activity for user role update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'user_role_updated',
        message: `${userContext.name || 'User'} updated user role "${updatedRole.name}"`,
        userId: userContext.id,
        companyId: updatedRole.companyId || userContext.companyId || undefined,
        branchId: updatedRole.branchId || userContext.branchId || undefined,
        entityType: 'ROLE',
        entityId: updatedRole.id,
      });
    }

    res.json(updatedRole);
  } catch (error: any) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role', details: error.message });
  }
};

// Delete a user role
export const deleteUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) {
      return res.status(404).json({ error: 'User role not found' });
    }

    // Check if role belongs to user's company/branch
    if (role.companyId !== user.companyId || 
        (role.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Prevent deletion of system roles
    if (role.isSystem) {
      return res.status(400).json({ error: 'System roles cannot be deleted' });
    }

    // Check if role is assigned to any users
    if (role._count.users > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete role that is assigned to users',
        details: `This role is assigned to ${role._count.users} user(s). Please reassign users before deleting.`
      });
    }

    // Log activity for user role deletion
    const userContext = await getUserContext(userId);
    if (userContext && role) {
      await logActivity({
        type: 'user_role_deleted',
        message: `${userContext.name || 'User'} deleted user role "${role.name}"`,
        userId: userContext.id,
        companyId: role.companyId || userContext.companyId || undefined,
        branchId: role.branchId || userContext.branchId || undefined,
        entityType: 'ROLE',
        entityId: parseInt(id),
      });
    }

    await prisma.role.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete user role error:', error);
    res.status(500).json({ error: 'Failed to delete user role', details: error.message });
  }
};

