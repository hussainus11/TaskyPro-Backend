import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get exception logs
export const getExceptionLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, branchId, severity, resolved, search, startDate, endDate } = req.query;
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
    if (filterCompanyId !== null && filterCompanyId !== undefined) {
      where.companyId = filterCompanyId;
    }
    if (filterBranchId !== null && filterBranchId !== undefined) {
      where.branchId = filterBranchId;
    } else if (filterCompanyId !== null && filterCompanyId !== undefined) {
      where.branchId = null;
    }

    if (severity && severity !== 'all') {
      where.severity = severity;
    }

    if (resolved !== undefined && resolved !== 'all') {
      where.resolved = resolved === 'resolved';
    }

    if (search) {
      where.OR = [
        { message: { contains: search as string, mode: 'insensitive' } },
        { type: { contains: search as string, mode: 'insensitive' } },
        { source: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const exceptions = await prisma.exceptionLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limit to prevent huge responses
    });

    res.json(exceptions);
  } catch (error: any) {
    console.error('Get exception logs error:', error);
    res.status(500).json({ error: 'Failed to fetch exception logs', details: error.message });
  }
};

// Create exception log (used by error handler)
export const createExceptionLog = async (
  type: string,
  severity: string,
  message: string,
  stack: string | null,
  source: string,
  userId: number | null,
  companyId: number | null,
  branchId: number | null,
  requestUrl?: string,
  requestMethod?: string,
  userAgent?: string,
  ipAddress?: string,
  metadata?: any
) => {
  try {
    await prisma.exceptionLog.create({
      data: {
        type,
        severity,
        message,
        stack,
        source,
        userId,
        companyId,
        branchId,
        requestUrl,
        requestMethod,
        userAgent,
        ipAddress,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
      }
    });
  } catch (error) {
    console.error('Failed to log exception:', error);
    // Don't throw - we don't want exception logging to break the app
  }
};

// Update exception log (mark as resolved)
export const updateExceptionLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { resolved, notes } = req.body;
    const userId = req.userId;

    const exception = await prisma.exceptionLog.findUnique({
      where: { id: parseInt(id) }
    });

    if (!exception) {
      return res.status(404).json({ error: 'Exception not found' });
    }

    const updateData: any = {};
    if (resolved !== undefined) {
      updateData.resolved = resolved;
      if (resolved) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = userId;
      } else {
        updateData.resolvedAt = null;
        updateData.resolvedBy = null;
      }
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prisma.exceptionLog.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update exception log error:', error);
    res.status(500).json({ error: 'Failed to update exception log', details: error.message });
  }
};

// Delete exception log
export const deleteExceptionLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.exceptionLog.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete exception log error:', error);
    res.status(500).json({ error: 'Failed to delete exception log', details: error.message });
  }
};


















