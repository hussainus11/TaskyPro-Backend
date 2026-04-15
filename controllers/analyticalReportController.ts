import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all analytical reports for a company/branch
export const getAnalyticalReports = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide reports
      where.branchId = null;
    }

    const reports = await prisma.analyticalReport.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    res.json(reports);
  } catch (error: any) {
    console.error('Get analytical reports error:', error);
    res.status(500).json({ error: 'Failed to fetch analytical reports', details: error.message });
  }
};

// Create an analytical report
export const createAnalyticalReport = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, description, customFieldIds } = req.body;
    const userId = req.userId;

    if (!name || !customFieldIds || !Array.isArray(customFieldIds)) {
      return res.status(400).json({ error: 'Name and customFieldIds array are required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const report = await prisma.analyticalReport.create({
      data: {
        name,
        description: description || null,
        customFieldIds: customFieldIds,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    // Log activity for report creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'analytical_report_created',
        message: `${userContext.name || 'User'} created analytical report "${name}"`,
        userId: userContext.id,
        companyId: report.companyId || userContext.companyId || undefined,
        branchId: report.branchId || userContext.branchId || undefined,
        entityType: 'ANALYTICAL_REPORT',
        entityId: report.id,
      });
    }

    res.status(201).json(report);
  } catch (error: any) {
    console.error('Create analytical report error:', error);
    res.status(500).json({ error: 'Failed to create analytical report', details: error.message });
  }
};

// Update an analytical report
export const updateAnalyticalReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, customFieldIds } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const report = await prisma.analyticalReport.findUnique({
      where: { id: parseInt(id) }
    });

    if (!report) {
      return res.status(404).json({ error: 'Analytical report not found' });
    }

    // Check if report belongs to user's company/branch
    if (report.companyId !== user.companyId || 
        (report.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (customFieldIds !== undefined) updateData.customFieldIds = customFieldIds;

    const updatedReport = await prisma.analyticalReport.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Log activity for report update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'analytical_report_updated',
        message: `${userContext.name || 'User'} updated analytical report "${updatedReport.name}"`,
        userId: userContext.id,
        companyId: updatedReport.companyId || userContext.companyId || undefined,
        branchId: updatedReport.branchId || userContext.branchId || undefined,
        entityType: 'ANALYTICAL_REPORT',
        entityId: updatedReport.id,
      });
    }

    res.json(updatedReport);
  } catch (error: any) {
    console.error('Update analytical report error:', error);
    res.status(500).json({ error: 'Failed to update analytical report', details: error.message });
  }
};

// Delete an analytical report
export const deleteAnalyticalReport = async (req: AuthRequest, res: Response) => {
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

    const report = await prisma.analyticalReport.findUnique({
      where: { id: parseInt(id) }
    });

    if (!report) {
      return res.status(404).json({ error: 'Analytical report not found' });
    }

    // Check if report belongs to user's company/branch
    if (report.companyId !== user.companyId || 
        (report.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Log activity for report deletion
    const userContext = await getUserContext(userId);
    if (userContext && report) {
      await logActivity({
        type: 'analytical_report_deleted',
        message: `${userContext.name || 'User'} deleted analytical report "${report.name}"`,
        userId: userContext.id,
        companyId: report.companyId || userContext.companyId || undefined,
        branchId: report.branchId || userContext.branchId || undefined,
        entityType: 'ANALYTICAL_REPORT',
        entityId: parseInt(id),
      });
    }

    await prisma.analyticalReport.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete analytical report error:', error);
    res.status(500).json({ error: 'Failed to delete analytical report', details: error.message });
  }
};

























