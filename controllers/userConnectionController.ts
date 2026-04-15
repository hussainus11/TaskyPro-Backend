import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all connections for a user
export const getUserConnections = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const { status } = req.query; // Optional filter by status

    // Get connections where user is either user1 or user2
    const connections = await prisma.userConnection.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        ...(status && { status: status as string })
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
            role: true,
            country: true,
            location: true,
            department: true,
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
            role: true,
            country: true,
            location: true,
            department: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform connections to always show the other user (not the current user)
    const transformedConnections = connections.map(conn => {
      const otherUser = conn.user1Id === userId ? conn.user2 : conn.user1;
      const isInitiator = conn.user1Id === userId;
      
      return {
        id: conn.id,
        userId: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
        avatar: otherUser.image || '/images/avatars/default.png',
        status: conn.status,
        online: otherUser.status === 'active',
        role: otherUser.role,
        location: otherUser.location || otherUser.country || '',
        department: otherUser.department || 'No department',
        isInitiator: isInitiator,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
      };
    });

    res.json(transformedConnections);
  } catch (error: any) {
    console.error('Get user connections error:', error);
    res.status(500).json({ error: 'Failed to fetch user connections', details: error.message });
  }
};

// Create a connection request
export const createConnection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId2 } = req.body; // The user to connect with
    const userId1 = parseInt(id);

    if (userId1 === userId2) {
      return res.status(400).json({ error: 'Cannot connect with yourself' });
    }

    // Check if connection already exists (in either direction)
    const existingConnection = await prisma.userConnection.findFirst({
      where: {
        OR: [
          { user1Id: userId1, user2Id: userId2 },
          { user1Id: userId2, user2Id: userId1 }
        ]
      }
    });

    if (existingConnection) {
      return res.status(409).json({ error: 'Connection already exists' });
    }

    // Verify both users exist
    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId1 } }),
      prisma.user.findUnique({ where: { id: userId2 } })
    ]);

    if (!user1 || !user2) {
      return res.status(404).json({ error: 'One or both users not found' });
    }

    // Create connection (always use smaller ID as user1 for consistency)
    const [finalUser1, finalUser2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    const isInitiator = userId1 === finalUser1;

    const connection = await prisma.userConnection.create({
      data: {
        user1Id: finalUser1,
        user2Id: finalUser2,
        status: 'pending' // Start as pending, can be auto-approved or require acceptance
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          }
        }
      }
    });

    const otherUser = connection.user1Id === userId1 ? connection.user2 : connection.user1;

    // Log activity for connection creation
    const userContext = await getUserContext(userId1);
    if (userContext) {
      await logActivity({
        type: 'connection_created',
        message: `${userContext.name || 'User'} created connection with ${otherUser.name}`,
        userId: userContext.id,
        companyId: userContext.companyId || undefined,
        branchId: userContext.branchId || undefined,
        entityType: 'USER_CONNECTION',
        entityId: connection.id,
      });
    }

    res.status(201).json({
      id: connection.id,
      userId: otherUser.id,
      name: otherUser.name,
      email: otherUser.email,
      avatar: otherUser.image || '/images/avatars/default.png',
      status: connection.status,
      online: otherUser.status === 'active',
      isInitiator: isInitiator,
      createdAt: connection.createdAt,
    });
  } catch (error: any) {
    console.error('Create connection error:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Connection already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create connection', details: error.message });
    }
  }
};

// Update connection status (accept, reject, block)
export const updateConnection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // connection ID
    const { status } = req.body; // 'connected', 'blocked'

    if (!['connected', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "connected" or "blocked"' });
    }

    const connection = await prisma.userConnection.update({
      where: { id: parseInt(id) },
      data: { status: status },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          }
        }
      }
    });

    res.json(connection);
  } catch (error: any) {
    console.error('Update connection error:', error);
    res.status(500).json({ error: 'Failed to update connection', details: error.message });
  }
};

// Delete a connection
export const deleteConnection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // connection ID

    // Get connection details before deleting for activity logging
    const connection = await prisma.userConnection.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, user1Id: true, user2Id: true }
    });

    if (connection) {
      // Log activity for connection deletion
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
      if (userId) {
        const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
        if (userContext) {
          await logActivity({
            type: 'connection_deleted',
            message: `${userContext.name || 'User'} deleted connection`,
            userId: userContext.id,
            companyId: userContext.companyId || undefined,
            branchId: userContext.branchId || undefined,
            entityType: 'USER_CONNECTION',
            entityId: parseInt(id),
          });
        }
      }
    }

    await prisma.userConnection.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete connection error:', error);
    res.status(500).json({ error: 'Failed to delete connection', details: error.message });
  }
};

// Accept a connection request
export const acceptConnection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // connection ID

    const connection = await prisma.userConnection.update({
      where: { id: parseInt(id) },
      data: { status: 'connected' },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          }
        }
      }
    });

    res.json(connection);
  } catch (error: any) {
    console.error('Accept connection error:', error);
    res.status(500).json({ error: 'Failed to accept connection', details: error.message });
  }
};
