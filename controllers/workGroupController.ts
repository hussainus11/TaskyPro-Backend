import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all work groups
export const getWorkGroups = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId, userId, status } = req.query;
    
    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (userId) {
      // Get work groups where user is creator or member
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId as string) },
        select: { email: true }
      });
      
      where.OR = [
        { createdById: parseInt(userId as string) },
        { members: { some: { userId: parseInt(userId as string) } } }
      ];
    }
    if (status) where.status = status;
    
    const workGroups = await prisma.workGroup.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          },
          orderBy: {
            role: 'asc'
          }
        },
        company: {
          select: {
            id: true,
            name: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            members: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    res.json(workGroups);
  } catch (error: any) {
    console.error('Failed to fetch work groups:', error);
    res.status(500).json({ error: 'Failed to fetch work groups', details: error.message });
  }
};

// Get a single work group by ID
export const getWorkGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workGroup = await prisma.workGroup.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          },
          orderBy: [
            { role: 'asc' },
            { joinedAt: 'asc' }
          ]
        },
        company: {
          select: {
            id: true,
            name: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    if (workGroup) {
      res.json(workGroup);
    } else {
      res.status(404).json({ error: 'Work group not found' });
    }
  } catch (error: any) {
    console.error('Failed to fetch work group:', error);
    res.status(500).json({ error: 'Failed to fetch work group', details: error.message });
  }
};

// Create a new work group
export const createWorkGroup = async (req: Request, res: Response) => {
  try {
    const { name, description, createdById, companyId, branchId, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!createdById) {
      return res.status(400).json({ error: 'Created by user ID is required' });
    }

    // Get user details to determine company/branch if not provided
    const user = await prisma.user.findUnique({
      where: { id: parseInt(createdById) },
      select: { companyId: true, branchId: true, email: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const finalCompanyId = companyId ? parseInt(companyId) : (user.companyId || null);
    const finalBranchId = branchId ? parseInt(branchId) : (user.branchId || null);

    const workGroup = await prisma.workGroup.create({
      data: {
        name,
        description: description || null,
        status: status || 'ACTIVE',
        createdById: parseInt(createdById),
        companyId: finalCompanyId,
        branchId: finalBranchId,
        // Add creator as leader member
        members: {
          create: {
            userId: parseInt(createdById),
            role: 'LEADER',
          }
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          }
        },
        company: {
          select: {
            id: true,
            name: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Log activity for work group creation
    const creator = workGroup.createdBy;
    if (creator) {
      const userContext = await getUserContext(creator.id);
      if (userContext) {
        await logActivity({
          type: 'workgroup_created',
          message: `${userContext.name || 'User'} created work group "${name}"`,
          userId: userContext.id,
          companyId: workGroup.companyId || userContext.companyId || undefined,
          branchId: workGroup.branchId || userContext.branchId || undefined,
          entityType: 'WORKGROUP',
          entityId: workGroup.id,
        });
      }
    }
    
    res.status(201).json(workGroup);
  } catch (error: any) {
    console.error('Failed to create work group:', error);
    res.status(500).json({ error: 'Failed to create work group', details: error.message });
  }
};

// Update a work group
export const updateWorkGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const existingWorkGroup = await prisma.workGroup.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingWorkGroup) {
      return res.status(404).json({ error: 'Work group not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const workGroup = await prisma.workGroup.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          }
        },
        company: {
          select: {
            id: true,
            name: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    res.json(workGroup);
  } catch (error: any) {
    console.error('Failed to update work group:', error);
    res.status(500).json({ error: 'Failed to update work group', details: error.message });
  }
};

// Delete a work group
export const deleteWorkGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get work group details before deleting for activity logging
    const workGroup = await prisma.workGroup.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, createdById: true, companyId: true, branchId: true }
    });

    if (workGroup && workGroup.createdById) {
      const userContext = await getUserContext(workGroup.createdById);
      if (userContext) {
        await logActivity({
          type: 'workgroup_deleted',
          message: `${userContext.name || 'User'} deleted work group "${workGroup.name}"`,
          userId: userContext.id,
          companyId: workGroup.companyId || userContext.companyId || undefined,
          branchId: workGroup.branchId || userContext.branchId || undefined,
          entityType: 'WORKGROUP',
          entityId: parseInt(id),
        });
      }
    }

    await prisma.workGroup.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to delete work group:', error);
    res.status(500).json({ error: 'Failed to delete work group', details: error.message });
  }
};

// Add a member to a work group
export const addWorkGroupMember = async (req: Request, res: Response) => {
  try {
    const { workGroupId } = req.params;
    const { userId, role } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if member already exists
    const existingMember = await prisma.workGroupMember.findUnique({
      where: {
        workGroupId_userId: {
          workGroupId: parseInt(workGroupId),
          userId: parseInt(userId)
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this work group' });
    }

    // Verify user exists and is in the same company/branch
    const workGroup = await prisma.workGroup.findUnique({
      where: { id: parseInt(workGroupId) },
      select: { companyId: true, branchId: true }
    });

    if (!workGroup) {
      return res.status(404).json({ error: 'Work group not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is in the same company/branch (optional validation)
    if (workGroup.companyId && user.companyId !== workGroup.companyId) {
      return res.status(400).json({ error: 'User must be in the same company' });
    }

    const member = await prisma.workGroupMember.create({
      data: {
        workGroupId: parseInt(workGroupId),
        userId: parseInt(userId),
        role: role || 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        workGroup: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    res.status(201).json(member);
  } catch (error: any) {
    console.error('Failed to add work group member:', error);
    res.status(500).json({ error: 'Failed to add work group member', details: error.message });
  }
};

// Update a work group member
export const updateWorkGroupMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const existingMember = await prisma.workGroupMember.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Work group member not found' });
    }

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;

    const member = await prisma.workGroupMember.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        workGroup: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    res.json(member);
  } catch (error: any) {
    console.error('Failed to update work group member:', error);
    res.status(500).json({ error: 'Failed to update work group member', details: error.message });
  }
};

// Remove a member from a work group
export const removeWorkGroupMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const member = await prisma.workGroupMember.findUnique({
      where: { id: parseInt(id) },
      include: {
        workGroup: {
          select: {
            createdById: true
          }
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Work group member not found' });
    }

    // Prevent removing the creator if they're the only leader
    if (member.userId === member.workGroup.createdById && member.role === 'LEADER') {
      const leaderCount = await prisma.workGroupMember.count({
        where: {
          workGroupId: member.workGroupId,
          role: 'LEADER'
        }
      });
      
      if (leaderCount === 1) {
        return res.status(400).json({ error: 'Cannot remove the only leader of the work group' });
      }
    }

    await prisma.workGroupMember.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to remove work group member:', error);
    res.status(500).json({ error: 'Failed to remove work group member', details: error.message });
  }
};

// Get available users to add to work group
export const getAvailableUsers = async (req: Request, res: Response) => {
  try {
    const { workGroupId } = req.params;
    const { companyId, branchId } = req.query;

    const workGroup = await prisma.workGroup.findUnique({
      where: { id: parseInt(workGroupId) },
      select: { 
        companyId: true, 
        branchId: true,
        members: {
          select: { userId: true }
        }
      }
    });

    if (!workGroup) {
      return res.status(404).json({ error: 'Work group not found' });
    }

    const where: any = {};
    if (companyId) {
      where.companyId = parseInt(companyId as string);
    } else if (workGroup.companyId) {
      where.companyId = workGroup.companyId;
    }
    
    if (branchId) {
      where.branchId = parseInt(branchId as string);
    } else if (workGroup.branchId) {
      where.branchId = workGroup.branchId;
    }

    // Exclude users who are already members
    const existingMemberIds = workGroup.members.map(m => m.userId);
    if (existingMemberIds.length > 0) {
      where.id = { notIn: existingMemberIds };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(users);
  } catch (error: any) {
    console.error('Failed to fetch available users:', error);
    res.status(500).json({ error: 'Failed to fetch available users', details: error.message });
  }
};






