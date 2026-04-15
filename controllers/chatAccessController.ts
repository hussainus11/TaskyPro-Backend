import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

// Get all chat access permissions for a user
export const getChatAccess = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const where: any = {};
    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }

    // Get all chat access records where current user is the grantor
    const chatAccess = await prisma.chatAccess.findMany({
      where: {
        ...where,
        userId: userId
      },
      include: {
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(chatAccess);
  } catch (error: any) {
    console.error('Error fetching chat access:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch chat access' });
  }
};

// Get all users that can chat with a specific user
export const getUsersWithChatAccess = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const where: any = {};
    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }

    // Get all chat access records where current user is the target (can chat with grantor)
    const chatAccess = await prisma.chatAccess.findMany({
      where: {
        ...where,
        targetUserId: userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(chatAccess);
  } catch (error: any) {
    console.error('Error fetching users with chat access:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch users with chat access' });
  }
};

// Get all available users for chat access management
export const getAvailableUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const where: any = {};
    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }

    // Get all users in the same company/branch (excluding current user)
    const users = await prisma.user.findMany({
      where: {
        ...where,
        id: { not: userId }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get existing chat access for current user
    const existingAccess = await prisma.chatAccess.findMany({
      where: {
        ...where,
        userId: userId
      },
      select: {
        targetUserId: true
      }
    });

    const grantedUserIds = new Set(existingAccess.map(a => a.targetUserId));

    // Add flag to indicate if access is already granted
    const usersWithAccess = users.map(u => ({
      ...u,
      hasAccess: grantedUserIds.has(u.id)
    }));

    res.json(usersWithAccess);
  } catch (error: any) {
    console.error('Error fetching available users:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch available users' });
  }
};

// Grant chat access to a user
export const grantChatAccess = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { targetUserId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    if (userId === targetUserId) {
      return res.status(400).json({ error: 'Cannot grant chat access to yourself' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if target user exists and is in the same company/branch
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(targetUserId) },
      select: { companyId: true, branchId: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    if (user.companyId !== targetUser.companyId) {
      return res.status(403).json({ error: 'Cannot grant chat access to users from different companies' });
    }

    const where: any = {
      userId: userId,
      targetUserId: parseInt(targetUserId)
    };
    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }

    // Check if access already exists
    const existing = await prisma.chatAccess.findFirst({
      where
    });

    if (existing) {
      return res.status(400).json({ error: 'Chat access already granted' });
    }

    // Create chat access
    const chatAccess = await prisma.chatAccess.create({
      data: {
        userId: userId,
        targetUserId: parseInt(targetUserId),
        companyId: user.companyId || null,
        branchId: user.branchId || null
      },
      include: {
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true
          }
        }
      }
    });

    res.json(chatAccess);
  } catch (error: any) {
    console.error('Error granting chat access:', error);
    res.status(500).json({ error: error.message || 'Failed to grant chat access' });
  }
};

// Revoke chat access from a user
export const revokeChatAccess = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { targetUserId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const where: any = {
      userId: userId,
      targetUserId: parseInt(targetUserId)
    };
    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }

    // Delete chat access
    await prisma.chatAccess.deleteMany({
      where
    });

    res.json({ message: 'Chat access revoked successfully' });
  } catch (error: any) {
    console.error('Error revoking chat access:', error);
    res.status(500).json({ error: error.message || 'Failed to revoke chat access' });
  }
};

// Grant chat access to multiple users
export const bulkGrantChatAccess = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { targetUserIds } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
      return res.status(400).json({ error: 'targetUserIds array is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Filter out self and validate all target users exist and are in same company
    const validTargetUserIds = targetUserIds
      .map((id: any) => parseInt(id))
      .filter((id: number) => id !== userId);

    if (validTargetUserIds.length === 0) {
      return res.status(400).json({ error: 'No valid target users provided' });
    }

    // Verify all target users exist and are in the same company
    const targetUsers = await prisma.user.findMany({
      where: {
        id: { in: validTargetUserIds },
        companyId: user.companyId
      },
      select: { id: true }
    });

    if (targetUsers.length !== validTargetUserIds.length) {
      return res.status(400).json({ error: 'Some target users not found or in different company' });
    }

    const where: any = {
      userId: userId,
      targetUserId: { in: validTargetUserIds }
    };
    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }

    // Get existing access records to avoid duplicates
    const existing = await prisma.chatAccess.findMany({
      where,
      select: { targetUserId: true }
    });

    const existingUserIds = new Set(existing.map(e => e.targetUserId));
    const newUserIds = validTargetUserIds.filter(id => !existingUserIds.has(id));

    if (newUserIds.length === 0) {
      return res.json({ message: 'All users already have chat access', count: 0 });
    }

    // Create bulk chat access records
    const chatAccessRecords = newUserIds.map(targetUserId => ({
      userId: userId,
      targetUserId: targetUserId,
      companyId: user.companyId || null,
      branchId: user.branchId || null
    }));

    await prisma.chatAccess.createMany({
      data: chatAccessRecords,
      skipDuplicates: true
    });

    res.json({ 
      message: `Chat access granted to ${newUserIds.length} user(s)`,
      count: newUserIds.length
    });
  } catch (error: any) {
    console.error('Error bulk granting chat access:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk grant chat access' });
  }
};

// Revoke chat access from multiple users
export const bulkRevokeChatAccess = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { targetUserIds } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
      return res.status(400).json({ error: 'targetUserIds array is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validTargetUserIds = targetUserIds.map((id: any) => parseInt(id));

    const where: any = {
      userId: userId,
      targetUserId: { in: validTargetUserIds }
    };
    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }

    // Delete bulk chat access records
    const result = await prisma.chatAccess.deleteMany({
      where
    });

    res.json({ 
      message: `Chat access revoked from ${result.count} user(s)`,
      count: result.count
    });
  } catch (error: any) {
    console.error('Error bulk revoking chat access:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk revoke chat access' });
  }
};

// Check if user A can chat with user B
export const checkChatAccess = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { targetUserId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const where: any = {
      userId: userId,
      targetUserId: parseInt(targetUserId)
    };
    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }

    // Check if target user has granted access to current user
    // User A can chat with User B only if User B has granted access to User A
    // (i.e., there's a ChatAccess record where userId=B, targetUserId=A)
    const checkWhere: any = {
      userId: parseInt(targetUserId), // Target user granted access
      targetUserId: userId              // To current user
    };
    if (user.companyId) {
      checkWhere.companyId = user.companyId;
    }
    if (user.branchId) {
      checkWhere.branchId = user.branchId;
    } else if (user.companyId) {
      checkWhere.branchId = null;
    }

    const hasAccess = await prisma.chatAccess.findFirst({
      where: checkWhere
    });

    res.json({ hasAccess });
  } catch (error: any) {
    console.error('Error checking chat access:', error);
    res.status(500).json({ error: error.message || 'Failed to check chat access' });
  }
};

// Admin: Get all users with their chat access relationships
export const getAllUsersWithChatAccess = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, branchId: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is admin
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const where: any = {};
    if (currentUser.companyId) {
      where.companyId = currentUser.companyId;
    }
    if (currentUser.branchId) {
      where.branchId = currentUser.branchId;
    } else if (currentUser.companyId) {
      where.branchId = null;
    }

    // Get all users in the same company/branch
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get all chat access relationships
    const allChatAccess = await prisma.chatAccess.findMany({
      where,
      select: {
        userId: true,
        targetUserId: true
      }
    });

    // Create a map: userId -> Set of targetUserIds they can chat with
    const accessMap = new Map<number, Set<number>>();
    allChatAccess.forEach(access => {
      if (!accessMap.has(access.userId)) {
        accessMap.set(access.userId, new Set());
      }
      accessMap.get(access.userId)!.add(access.targetUserId);
    });

    // Add chat access info to each user
    const usersWithAccess = users.map(user => ({
      ...user,
      canChatWith: Array.from(accessMap.get(user.id) || [])
    }));

    res.json(usersWithAccess);
  } catch (error: any) {
    console.error('Error fetching all users with chat access:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch users with chat access' });
  }
};

// Admin: Grant chat access between two users
export const adminGrantChatAccess = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { userId: grantorUserId, targetUserId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!grantorUserId || !targetUserId) {
      return res.status(400).json({ error: 'userId and targetUserId are required' });
    }

    if (grantorUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot grant chat access to the same user' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, branchId: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const grantorUser = await prisma.user.findUnique({
      where: { id: grantorUserId },
      select: { companyId: true, branchId: true }
    });

    if (!grantorUser) {
      return res.status(404).json({ error: 'Grantor user not found' });
    }

    // Check if users are in the same company/branch
    if (grantorUser.companyId !== currentUser.companyId) {
      return res.status(403).json({ error: 'Cannot grant access to users from different companies' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { companyId: true, branchId: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    if (targetUser.companyId !== currentUser.companyId) {
      return res.status(403).json({ error: 'Cannot grant access to users from different companies' });
    }

    const where: any = {
      userId: grantorUserId,
      targetUserId: targetUserId
    };
    if (currentUser.companyId) {
      where.companyId = currentUser.companyId;
    }
    if (currentUser.branchId) {
      where.branchId = currentUser.branchId;
    } else if (currentUser.companyId) {
      where.branchId = null;
    }

    // Check if access already exists
    const existing = await prisma.chatAccess.findFirst({
      where
    });

    if (existing) {
      return res.status(400).json({ error: 'Chat access already granted' });
    }

    // Create chat access
    const chatAccess = await prisma.chatAccess.create({
      data: {
        userId: grantorUserId,
        targetUserId: targetUserId,
        companyId: currentUser.companyId || undefined,
        branchId: currentUser.branchId || undefined
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(chatAccess);
  } catch (error: any) {
    console.error('Error granting chat access:', error);
    res.status(500).json({ error: error.message || 'Failed to grant chat access' });
  }
};

// Admin: Revoke chat access between two users
export const adminRevokeChatAccess = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { userId: grantorUserId, targetUserId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!grantorUserId || !targetUserId) {
      return res.status(400).json({ error: 'userId and targetUserId are required' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, companyId: true, branchId: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const where: any = {
      userId: grantorUserId,
      targetUserId: targetUserId
    };
    if (currentUser.companyId) {
      where.companyId = currentUser.companyId;
    }
    if (currentUser.branchId) {
      where.branchId = currentUser.branchId;
    } else if (currentUser.companyId) {
      where.branchId = null;
    }

    // Delete chat access
    await prisma.chatAccess.deleteMany({
      where
    });

    res.json({ message: 'Chat access revoked successfully' });
  } catch (error: any) {
    console.error('Error revoking chat access:', error);
    res.status(500).json({ error: error.message || 'Failed to revoke chat access' });
  }
};

