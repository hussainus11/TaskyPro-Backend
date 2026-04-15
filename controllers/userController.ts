import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { formatDateTime } from '../utils/dateTime';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logActivity, getUserContext } from '../utils/activityLogger';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user to determine companyId and branchId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user || !user.companyId) {
      return res.status(404).json({ error: 'User company not found' });
    }

    // Build where clause to filter by company and optionally branch
    const where: any = {
      companyId: user.companyId
    };

    // If user has a branchId, filter by branch; otherwise get all users in the company
    if (user.branchId) {
      where.branchId = user.branchId;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            plan: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        customRole: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    // Get user with related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workGroupMembers: true,
        projectMembers: true,
        managedProjects: true,
        company: true,
        branch: true,
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Count teams (WorkGroups user is a member of)
    const teamsCount = await prisma.workGroupMember.count({
      where: { userId: userId }
    });
    
    // Count projects (both managed and as member)
    const managedProjectsCount = user.managedProjects.length;
    const memberProjectsCount = user.projectMembers.length;
    const totalProjectsCount = new Set([
      ...user.managedProjects.map(p => p.id),
      ...user.projectMembers.map(pm => pm.projectId)
    ]).size;
    
    const joinedDate = formatDateTime(user.createdAt);
    
    // Format location from country if location is not set
    const location = user.location || user.country || '';
    
    // Build profile response
    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.image,
      country: user.country,
      location: location,
      phone: user.phone || '',
      department: user.department || 'No department',
      verified: user.status === 'active',
      joinedDate: joinedDate,
      teams: teamsCount,
      projects: totalProjectsCount,
      online: user.status === 'active',
      companyId: user.companyId,
      branchId: user.branchId,
      company: user.company ? { name: user.company.name } : null,
      branch: user.branch ? { name: user.branch.name } : null,
      createdAt: user.createdAt,
    };
    
    res.json(profile);
  } catch (error: any) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
  }
};

// Generate a random temporary password
function generateTemporaryPassword(): string {
  // Generate a 12-character password with uppercase, lowercase, numbers
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const allChars = uppercase + lowercase + numbers;
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, country, role, roleId, image, status, plan_name, companyId, branchId } = req.body;
    
    // If password is provided (user registering themselves), use it
    // Otherwise, generate a temporary password (for admin-created users)
    let hashedPassword: string;
    let mustChangePassword: boolean;
    let temporaryPassword: string | undefined;
    
    if (password) {
      // User provided their own password during registration
      hashedPassword = await bcrypt.hash(password, 10);
      mustChangePassword = false; // No need to change password if they set it themselves
    } else {
      // Admin creating user - generate temporary password
      temporaryPassword = generateTemporaryPassword();
      hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      mustChangePassword = true; // Require password change on first login
    }
    
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword,
        mustChangePassword,
        country, 
        role: role || 'employee', // Default to employee if not provided
        roleId: roleId ? parseInt(roleId) : null, // Custom role from Role table
        image: image || '/images/avatars/default.png', 
        status: status || 'active', 
        plan_name: plan_name || 'Basic',
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
        role: true,
        image: true,
        status: true,
        plan_name: true,
        companyId: true,
        branchId: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Log activity for user creation (get userId from request if available)
    const bodyAny = (req.body ?? {}) as Record<string, unknown>;
    const creatorUserId = bodyAny.createdBy || (req.query as any)?.userId || (req.headers as any)?.['x-user-id'];
    if (creatorUserId) {
      const userContext = await getUserContext(typeof creatorUserId === 'string' ? parseInt(creatorUserId) : creatorUserId);
      if (userContext) {
        await logActivity({
          type: 'user_created',
          message: `${userContext.name || 'Admin'} created user "${name}"`,
          userId: userContext.id,
          companyId: user.companyId || userContext.companyId || undefined,
          branchId: user.branchId || userContext.branchId || undefined,
          entityType: 'USER',
          entityId: user.id,
        });
      }
    }
    
    // Return user (with temporary password only if generated)
    const response: any = { ...user };
    if (temporaryPassword) {
      response.temporaryPassword = temporaryPassword;
      response.message = 'User created successfully. Temporary password has been generated.';
    } else {
      response.message = 'User created successfully.';
    }
    
    res.status(201).json(response);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'User with this email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, country, role, image, status, plan_name, companyId, branchId, phone, location, department } = req.body;

    // Get user before updating for activity logging
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { name: true, companyId: true, branchId: true }
    });

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        email, 
        country, 
        role, 
        image, 
        status, 
        plan_name,
        phone,
        location,
        department,
        companyId: companyId !== undefined ? (companyId ? parseInt(companyId) : null) : undefined,
        branchId: branchId !== undefined ? (branchId ? parseInt(branchId) : null) : undefined,
      }
    });

    // Log activity for user update (get userId from request if available)
    const updaterUserId = req.body.updatedBy || req.query.userId || req.headers['x-user-id'];
    if (updaterUserId && existingUser) {
      const userContext = await getUserContext(typeof updaterUserId === 'string' ? parseInt(updaterUserId) : updaterUserId);
      if (userContext) {
        await logActivity({
          type: 'user_updated',
          message: `${userContext.name || 'Admin'} updated user "${user.name}"`,
          userId: userContext.id,
          companyId: user.companyId || userContext.companyId || undefined,
          branchId: user.branchId || userContext.branchId || undefined,
          entityType: 'USER',
          entityId: user.id,
        });
      }
    }

    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'User with this email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update user', details: error.message });
    }
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get user details before deleting for activity logging
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, companyId: true, branchId: true }
    });

    if (user) {
      // Log activity for user deletion (get userId from request if available)
      const deleterUserId = req.body.deletedBy || req.query.userId || req.headers['x-user-id'];
      if (deleterUserId) {
        const userContext = await getUserContext(typeof deleterUserId === 'string' ? parseInt(deleterUserId) : deleterUserId);
        if (userContext) {
          await logActivity({
            type: 'user_deleted',
            message: `${userContext.name || 'Admin'} deleted user "${user.name}"`,
            userId: userContext.id,
            companyId: user.companyId || userContext.companyId || undefined,
            branchId: user.branchId || userContext.branchId || undefined,
            entityType: 'USER',
            entityId: parseInt(id),
          });
        }
      }
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Admin function to set/reset user password
export const setUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password, generateTemporary } = req.body;

    console.log('setUserPassword called with:', { id, hasPassword: !!password, generateTemporary });

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let newPassword: string;
    let temporaryPassword: string | undefined;

    // Generate temporary password if requested, otherwise use provided password
    if (generateTemporary) {
      temporaryPassword = generateTemporaryPassword();
      newPassword = temporaryPassword;
    } else if (password) {
      newPassword = password;
    } else {
      return res.status(400).json({ error: 'Password is required or set generateTemporary to true' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and set mustChangePassword flag
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        password: hashedPassword,
        mustChangePassword: true, // Require password change on next login
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        branchId: true,
        mustChangePassword: true,
      },
    });

    res.json({
      message: 'Password set successfully',
      user: updatedUser,
      ...(temporaryPassword && { temporaryPassword }), // Include temporary password if generated
    });
  } catch (error: any) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'Failed to set password', details: error.message });
  }
};