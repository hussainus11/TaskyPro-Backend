import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all collabs
export const getCollabs = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId, userId, status } = req.query;
    
    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (userId) {
      // Get user email to check for external members
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId as string) },
        select: { email: true }
      });
      
      // Get collabs where user is creator or member (by userId or email)
      where.OR = [
        { createdById: parseInt(userId as string) },
        { members: { some: { userId: parseInt(userId as string) } } },
        ...(user ? [{ members: { some: { email: user.email } } }] : [])
      ];
    }
    if (status) where.status = status;
    
    const collabs = await prisma.collab.findMany({
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
          }
        },
        invitations: {
          where: {
            status: 'PENDING'
          },
          include: {
            invitedBy: {
              select: {
                id: true,
                name: true,
                email: true,
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
        },
        _count: {
          select: {
            members: true,
            invitations: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    res.json(collabs);
  } catch (error: any) {
    console.error('Failed to fetch collabs:', error);
    res.status(500).json({ error: 'Failed to fetch collabs', details: error.message });
  }
};

// Get a single collab by ID
export const getCollabById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const collab = await prisma.collab.findUnique({
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
          orderBy: {
            role: 'asc'
          }
        },
        invitations: {
          include: {
            invitedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
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
    
    if (collab) {
      res.json(collab);
    } else {
      res.status(404).json({ error: 'Collab not found' });
    }
  } catch (error: any) {
    console.error('Failed to fetch collab:', error);
    res.status(500).json({ error: 'Failed to fetch collab', details: error.message });
  }
};

// Create a new collab
export const createCollab = async (req: Request, res: Response) => {
  try {
    const { name, description, createdById, companyId, branchId, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!createdById) {
      return res.status(400).json({ error: 'Created by user ID is required' });
    }

    // Get user details to determine company/branch and email
    const user = await prisma.user.findUnique({
      where: { id: parseInt(createdById) },
      select: { companyId: true, branchId: true, email: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const finalCompanyId = companyId ? parseInt(companyId) : (user.companyId || null);
    const finalBranchId = branchId ? parseInt(branchId) : (user.branchId || null);

    const collab = await prisma.collab.create({
      data: {
        name,
        description: description || null,
        status: status || 'ACTIVE',
        createdById: parseInt(createdById),
        companyId: finalCompanyId,
        branchId: finalBranchId,
        // Add creator as owner member
        members: {
          create: {
            userId: parseInt(createdById),
            email: user.email,
            name: user.name || null,
            role: 'OWNER',
            isExternal: false,
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

    // Log activity for collab creation
    const creator = collab.createdBy;
    if (creator) {
      const userContext = await getUserContext(creator.id);
      if (userContext) {
        await logActivity({
          type: 'collab_created',
          message: `${userContext.name || 'User'} created collab "${name}"`,
          userId: userContext.id,
          companyId: collab.companyId || userContext.companyId || undefined,
          branchId: collab.branchId || userContext.branchId || undefined,
          entityType: 'COLLAB',
          entityId: collab.id,
        });
      }
    }

    res.status(201).json(collab);
  } catch (error: any) {
    console.error('Failed to create collab:', error);
    res.status(500).json({ error: 'Failed to create collab', details: error.message });
  }
};

// Update a collab
export const updateCollab = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const existingCollab = await prisma.collab.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCollab) {
      return res.status(404).json({ error: 'Collab not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const collab = await prisma.collab.update({
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
        invitations: {
          include: {
            invitedBy: {
              select: {
                id: true,
                name: true,
                email: true,
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

    // Log activity for collab update
    const creator = collab.createdBy;
    if (creator) {
      const userContext = await getUserContext(creator.id);
      if (userContext) {
        await logActivity({
          type: 'collab_updated',
          message: `${userContext.name || 'User'} updated collab "${collab.name}"`,
          userId: userContext.id,
          companyId: collab.companyId || userContext.companyId || undefined,
          branchId: collab.branchId || userContext.branchId || undefined,
          entityType: 'COLLAB',
          entityId: collab.id,
        });
      }
    }
    
    res.json(collab);
  } catch (error: any) {
    console.error('Failed to update collab:', error);
    res.status(500).json({ error: 'Failed to update collab', details: error.message });
  }
};

// Delete a collab
export const deleteCollab = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get collab details before deleting for activity logging
    const collab = await prisma.collab.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, createdById: true, companyId: true, branchId: true }
    });

    if (collab && collab.createdById) {
      const userContext = await getUserContext(collab.createdById);
      if (userContext) {
        await logActivity({
          type: 'collab_deleted',
          message: `${userContext.name || 'User'} deleted collab "${collab.name}"`,
          userId: userContext.id,
          companyId: collab.companyId || userContext.companyId || undefined,
          branchId: collab.branchId || userContext.branchId || undefined,
          entityType: 'COLLAB',
          entityId: parseInt(id),
        });
      }
    }

    await prisma.collab.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to delete collab:', error);
    res.status(500).json({ error: 'Failed to delete collab', details: error.message });
  }
};

// Add a member to a collab
export const addCollabMember = async (req: Request, res: Response) => {
  try {
    const { collabId } = req.params;
    const { userId, email, name, role, isExternal } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if member already exists
    const existingMember = await prisma.collabMember.findFirst({
      where: {
        collabId: parseInt(collabId),
        OR: [
          userId ? { userId: parseInt(userId) } : { email }
        ]
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Member already exists in this collab' });
    }

    // If userId is provided, get user email
    let memberEmail = email;
    let memberName = name;
    let isExternalMember = isExternal !== undefined ? isExternal : true;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { email: true, name: true }
      });
      if (user) {
        memberEmail = user.email;
        memberName = user.name;
        isExternalMember = false;
      }
    }

    const member = await prisma.collabMember.create({
      data: {
        collabId: parseInt(collabId),
        userId: userId ? parseInt(userId) : null,
        email: memberEmail,
        name: memberName || null,
        role: role || 'MEMBER',
        isExternal: isExternalMember,
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
        collab: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    res.status(201).json(member);
  } catch (error: any) {
    console.error('Failed to add collab member:', error);
    res.status(500).json({ error: 'Failed to add collab member', details: error.message });
  }
};

// Update a collab member
export const updateCollabMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const existingMember = await prisma.collabMember.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Collab member not found' });
    }

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;

    const member = await prisma.collabMember.update({
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
        collab: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    res.json(member);
  } catch (error: any) {
    console.error('Failed to update collab member:', error);
    res.status(500).json({ error: 'Failed to update collab member', details: error.message });
  }
};

// Remove a member from a collab
export const removeCollabMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.collabMember.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to remove collab member:', error);
    res.status(500).json({ error: 'Failed to remove collab member', details: error.message });
  }
};

// Send an invitation
export const sendInvitation = async (req: Request, res: Response) => {
  try {
    const { collabId } = req.params;
    const { email, name, role, invitedById } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!invitedById) {
      return res.status(400).json({ error: 'Invited by user ID is required' });
    }

    // Check if user is already a member
    const existingMember = await prisma.collabMember.findFirst({
      where: {
        collabId: parseInt(collabId),
        email: email
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this collab' });
    }

    // Check if there's a pending invitation
    const existingInvitation = await prisma.collabInvitation.findFirst({
      where: {
        collabId: parseInt(collabId),
        email: email,
        status: 'PENDING'
      }
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const invitation = await prisma.collabInvitation.create({
      data: {
        collabId: parseInt(collabId),
        email,
        name: name || null,
        role: role || 'MEMBER',
        invitedById: parseInt(invitedById),
        token,
        expiresAt,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        collab: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    res.status(201).json(invitation);
  } catch (error: any) {
    console.error('Failed to send invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation', details: error.message });
  }
};

// Accept an invitation
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const invitation = await prisma.collabInvitation.findUnique({
      where: { token },
      include: {
        collab: true
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invitation is not pending' });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Check if user exists in system
    const user = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    // Update invitation status
    await prisma.collabInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    // Add as member
    const member = await prisma.collabMember.create({
      data: {
        collabId: invitation.collabId,
        userId: user ? user.id : null,
        email: invitation.email,
        name: invitation.name || user?.name || null,
        role: invitation.role,
        isExternal: !user,
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
        collab: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    res.json({ member, invitation });
  } catch (error: any) {
    console.error('Failed to accept invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation', details: error.message });
  }
};

// Reject an invitation
export const rejectInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const invitation = await prisma.collabInvitation.update({
      where: { token },
      data: {
        status: 'REJECTED'
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    res.json(invitation);
  } catch (error: any) {
    console.error('Failed to reject invitation:', error);
    res.status(500).json({ error: 'Failed to reject invitation', details: error.message });
  }
};

// Cancel an invitation
export const cancelInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.collabInvitation.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to cancel invitation:', error);
    res.status(500).json({ error: 'Failed to cancel invitation', details: error.message });
  }
};

// Resend an invitation
export const resendInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invitation = await prisma.collabInvitation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Generate new token and extend expiration
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updatedInvitation = await prisma.collabInvitation.update({
      where: { id: parseInt(id) },
      data: {
        token,
        expiresAt,
        status: 'PENDING'
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        collab: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    res.json(updatedInvitation);
  } catch (error: any) {
    console.error('Failed to resend invitation:', error);
    res.status(500).json({ error: 'Failed to resend invitation', details: error.message });
  }
};

