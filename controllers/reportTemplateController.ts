import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all report templates
export const getReportTemplates = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId, entityType } = req.query;
    
    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (entityType) where.entityType = entityType;
    
    const templates = await prisma.reportTemplate.findMany({
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
    
    res.json(templates);
  } catch (error: any) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({ error: 'Failed to fetch report templates', details: error.message });
  }
};

// Get report template by ID
export const getReportTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await prisma.reportTemplate.findUnique({
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
    
    if (!template) {
      return res.status(404).json({ error: 'Report template not found' });
    }
    
    res.json(template);
  } catch (error: any) {
    console.error('Error fetching report template:', error);
    res.status(500).json({ error: 'Failed to fetch report template', details: error.message });
  }
};

// Create report template
export const createReportTemplate = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId } = req.query;
    const { name, description, entityType, columns, filters, sorting } = req.body;
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    
    if (!name || !entityType || !columns || !Array.isArray(columns)) {
      return res.status(400).json({ error: 'Name, entityType, and columns array are required' });
    }
    
    const template = await prisma.reportTemplate.create({
      data: {
        name,
        description: description || null,
        entityType,
        columns: columns,
        filters: filters || null,
        sorting: sorting || null,
        companyId: queryCompanyId ? parseInt(queryCompanyId as string) : null,
        branchId: queryBranchId ? parseInt(queryBranchId as string) : null,
        createdById: userId ? parseInt(userId as string) : null,
        updatedById: userId ? parseInt(userId as string) : null
      }
    });
    
    // Log activity
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'report_template_created',
          message: `${userContext.name || 'User'} created report template "${name}"`,
          userId: userContext.id,
          companyId: template.companyId || userContext.companyId || undefined,
          branchId: template.branchId || userContext.branchId || undefined,
          entityType: 'REPORT_TEMPLATE',
          entityId: template.id,
        });
      }
    }
    
    res.status(201).json(template);
  } catch (error: any) {
    console.error('Error creating report template:', error);
    res.status(500).json({ error: 'Failed to create report template', details: error.message });
  }
};

// Update report template
export const updateReportTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, entityType, columns, filters, sorting } = req.body;
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (entityType !== undefined) updateData.entityType = entityType;
    if (columns !== undefined) updateData.columns = columns;
    if (filters !== undefined) updateData.filters = filters || null;
    if (sorting !== undefined) updateData.sorting = sorting || null;
    if (userId) updateData.updatedById = parseInt(userId as string);
    
    const template = await prisma.reportTemplate.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    // Log activity
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'report_template_updated',
          message: `${userContext.name || 'User'} updated report template "${template.name}"`,
          userId: userContext.id,
          companyId: template.companyId || userContext.companyId || undefined,
          branchId: template.branchId || userContext.branchId || undefined,
          entityType: 'REPORT_TEMPLATE',
          entityId: template.id,
        });
      }
    }
    
    res.json(template);
  } catch (error: any) {
    console.error('Error updating report template:', error);
    res.status(500).json({ error: 'Failed to update report template', details: error.message });
  }
};

// Delete report template
export const deleteReportTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    
    const template = await prisma.reportTemplate.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Report template not found' });
    }
    
    await prisma.reportTemplate.delete({
      where: { id: parseInt(id) }
    });
    
    // Log activity
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'report_template_deleted',
          message: `${userContext.name || 'User'} deleted report template "${template.name}"`,
          userId: userContext.id,
          companyId: template.companyId || userContext.companyId || undefined,
          branchId: template.branchId || userContext.branchId || undefined,
          entityType: 'REPORT_TEMPLATE',
          entityId: parseInt(id),
        });
      }
    }
    
    res.json({ message: 'Report template deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting report template:', error);
    res.status(500).json({ error: 'Failed to delete report template', details: error.message });
  }
};









