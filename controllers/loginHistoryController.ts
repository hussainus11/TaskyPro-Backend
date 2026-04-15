import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const getLoginHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user to check company and branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build where clause based on user's company and branch
    const where: any = {};
    
    // If user has companyId, filter by company
    if (user.companyId) {
      where.companyId = user.companyId;
    }
    
    // If user has branchId, filter by branch
    if (user.branchId) {
      where.branchId = user.branchId;
    }

    // Get login history with user information
    const loginHistory = await prisma.loginHistory.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        loginAt: 'desc',
      },
    });

    res.json(loginHistory);
  } catch (error: any) {
    console.error('Get login history error:', error);
    res.status(500).json({ error: 'Failed to fetch login history', details: error.message });
  }
};



















