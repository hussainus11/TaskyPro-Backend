import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

export const getCompanyPlan = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        billingCycle: true,
      }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(company);
  } catch (error: any) {
    console.error('Get company plan error:', error);
    res.status(500).json({ error: 'Failed to fetch company plan', details: error.message });
  }
};

export const updateCompanyPlan = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { plan, billingCycle } = req.body;
    
    // Validate plan
    const validPlans = ['Free', 'Basic', 'Pro', 'Enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan name' });
    }
    
    // Validate billing cycle if provided (not required for Free plan)
    if (plan !== 'Free' && billingCycle && !['Monthly', 'Yearly'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Invalid billing cycle' });
    }
    
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Calculate subscription dates
    const now = new Date();
    const subscriptionStartDate = plan !== 'Free' ? now : null;
    let subscriptionEndDate = null;
    
    if (plan !== 'Free' && billingCycle) {
      const endDate = new Date(now);
      if (billingCycle === 'Monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      subscriptionEndDate = endDate;
    }
    
    // Update company plan
    const updatedCompany = await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: {
        plan,
        subscriptionStatus: plan === 'Free' ? 'Active' : 'Pending',
        subscriptionStartDate,
        subscriptionEndDate,
        billingCycle: plan === 'Free' ? null : (billingCycle || 'Monthly'),
      },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        billingCycle: true,
      }
    });
    
    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'plan_updated',
          message: `${userContext.name || 'Admin'} updated company plan to "${plan}"`,
          userId: userContext.id,
          companyId: updatedCompany.id,
          branchId: userContext.branchId || undefined,
          entityType: 'COMPANY',
          entityId: updatedCompany.id,
        });
      }
    }
    
    res.json(updatedCompany);
  } catch (error: any) {
    console.error('Update company plan error:', error);
    res.status(500).json({ error: 'Failed to update company plan', details: error.message });
  }
};

export const activateSubscription = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Only activate if plan is not Free and status is Pending
    if (company.plan === 'Free') {
      return res.status(400).json({ error: 'Free plan does not require activation' });
    }
    
    if (company.subscriptionStatus !== 'Pending') {
      return res.status(400).json({ error: 'Subscription is not in pending status' });
    }
    
    const updatedCompany = await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: {
        subscriptionStatus: 'Active',
      },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        billingCycle: true,
      }
    });
    
    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'subscription_activated',
          message: `${userContext.name || 'Admin'} activated subscription for "${updatedCompany.plan}" plan`,
          userId: userContext.id,
          companyId: updatedCompany.id,
          branchId: userContext.branchId || undefined,
          entityType: 'COMPANY',
          entityId: updatedCompany.id,
        });
      }
    }
    
    res.json(updatedCompany);
  } catch (error: any) {
    console.error('Activate subscription error:', error);
    res.status(500).json({ error: 'Failed to activate subscription', details: error.message });
  }
};

