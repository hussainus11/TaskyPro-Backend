import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Platform-owner-only: every tenant company's billing transaction history.
// Access is gated by the requirePlatformOwner middleware on the route.
export const getPlatformBillingTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await prisma.companyBillingTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: { id: true, name: true, plan: true, subscriptionStatus: true }
        }
      }
    });

    res.json(transactions);
  } catch (error: any) {
    console.error('Get platform billing transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch billing transactions', details: error.message });
  }
};

// Summary numbers for the platform billing page header.
export const getPlatformBillingSummary = async (req: AuthRequest, res: Response) => {
  try {
    const [paidTransactions, payingCompanies, totalCompanies] = await Promise.all([
      prisma.companyBillingTransaction.findMany({ where: { status: 'paid' } }),
      prisma.company.count({ where: { plan: { not: 'Free' }, subscriptionStatus: 'Active' } }),
      prisma.company.count()
    ]);

    const totalRevenue = paidTransactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({ totalRevenue, payingCompanies, totalCompanies });
  } catch (error: any) {
    console.error('Get platform billing summary error:', error);
    res.status(500).json({ error: 'Failed to fetch billing summary', details: error.message });
  }
};
