import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all PDF reports
export const getPdfReports = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId, entityType, isActive } = req.query;
    
    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (entityType) where.entityType = entityType;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const reports = await prisma.pdfReport.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(reports);
  } catch (error: any) {
    console.error('Error fetching PDF reports:', error);
    res.status(500).json({ error: 'Failed to fetch PDF reports', details: error.message });
  }
};

// Get PDF report by ID
export const getPdfReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = await prisma.pdfReport.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!report) {
      return res.status(404).json({ error: 'PDF report not found' });
    }
    
    res.json(report);
  } catch (error: any) {
    console.error('Error fetching PDF report:', error);
    res.status(500).json({ error: 'Failed to fetch PDF report', details: error.message });
  }
};

// Create PDF report
export const createPdfReport = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId } = req.query;
    const { name, description, entityType, layout, pageSettings, isActive } = req.body;
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    
    if (!name || !layout || !pageSettings) {
      return res.status(400).json({ error: 'Name, layout, and pageSettings are required' });
    }
    
    const report = await prisma.pdfReport.create({
      data: {
        name,
        description: description || null,
        entityType: entityType || null,
        layout: layout,
        pageSettings: pageSettings,
        isActive: isActive !== undefined ? isActive : true,
        companyId: queryCompanyId ? parseInt(queryCompanyId as string) : null,
        branchId: queryBranchId ? parseInt(queryBranchId as string) : null,
        createdById: userId ? parseInt(userId as string) : null,
        updatedById: userId ? parseInt(userId as string) : null
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Log activity
    const userContext = getUserContext(req);
    if (userContext) {
      await logActivity({
        userId: userContext.userId,
        companyId: userContext.companyId,
        branchId: userContext.branchId,
        action: 'CREATE',
        entityType: 'PDF_REPORT',
        entityId: report.id,
        description: `Created PDF report: ${report.name}`
      });
    }
    
    res.status(201).json(report);
  } catch (error: any) {
    console.error('Error creating PDF report:', error);
    res.status(500).json({ error: 'Failed to create PDF report', details: error.message });
  }
};

// Update PDF report
export const updatePdfReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, entityType, layout, pageSettings, isActive } = req.body;
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    
    const existingReport = await prisma.pdfReport.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingReport) {
      return res.status(404).json({ error: 'PDF report not found' });
    }
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (entityType !== undefined) updateData.entityType = entityType;
    if (layout !== undefined) updateData.layout = layout;
    if (pageSettings !== undefined) updateData.pageSettings = pageSettings;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (userId) updateData.updatedById = parseInt(userId as string);
    
    const report = await prisma.pdfReport.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Log activity
    const userContext = getUserContext(req);
    if (userContext) {
      await logActivity({
        userId: userContext.userId,
        companyId: userContext.companyId,
        branchId: userContext.branchId,
        action: 'UPDATE',
        entityType: 'PDF_REPORT',
        entityId: report.id,
        description: `Updated PDF report: ${report.name}`
      });
    }
    
    res.json(report);
  } catch (error: any) {
    console.error('Error updating PDF report:', error);
    res.status(500).json({ error: 'Failed to update PDF report', details: error.message });
  }
};

// Delete PDF report
export const deletePdfReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingReport = await prisma.pdfReport.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingReport) {
      return res.status(404).json({ error: 'PDF report not found' });
    }
    
    await prisma.pdfReport.delete({
      where: { id: parseInt(id) }
    });
    
    // Log activity
    const userContext = getUserContext(req);
    if (userContext) {
      await logActivity({
        userId: userContext.userId,
        companyId: userContext.companyId,
        branchId: userContext.branchId,
        action: 'DELETE',
        entityType: 'PDF_REPORT',
        entityId: parseInt(id),
        description: `Deleted PDF report: ${existingReport.name}`
      });
    }
    
    res.json({ message: 'PDF report deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting PDF report:', error);
    res.status(500).json({ error: 'Failed to delete PDF report', details: error.message });
  }
};





