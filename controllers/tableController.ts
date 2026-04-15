import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Table Categories
export const getTableCategories = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    
    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    
    const categories = await prisma.tableCategory.findMany({
      where,
      include: { tables: true },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching table categories:', error);
    res.status(500).json({ error: 'Failed to fetch table categories' });
  }
};

export const getTableCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await prisma.tableCategory.findUnique({
      where: { id: parseInt(id) },
      include: { tables: true }
    });
    if (category) {
      res.json(category);
    } else {
      res.status(404).json({ error: 'Table category not found' });
    }
  } catch (error) {
    console.error('Error fetching table category:', error);
    res.status(500).json({ error: 'Failed to fetch table category' });
  }
};

export const createTableCategory = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId } = req.query;
    const { name } = req.body;
    
    const category = await prisma.tableCategory.create({
      data: {
        name,
        companyId: queryCompanyId ? parseInt(queryCompanyId as string) : null,
        branchId: queryBranchId ? parseInt(queryBranchId as string) : null
      }
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'table_category_created',
          message: `${userContext.name || 'User'} created table category "${name}"`,
          userId: userContext.id,
          companyId: category.companyId || userContext.companyId || undefined,
          branchId: category.branchId || userContext.branchId || undefined,
          entityType: 'TABLE_CATEGORY',
          entityId: category.id,
        });
      }
    }

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating table category:', error);
    res.status(500).json({ error: 'Failed to create table category' });
  }
};

export const updateTableCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await prisma.tableCategory.update({
      where: { id: parseInt(id) },
      data: { name }
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'table_category_updated',
          message: `${userContext.name || 'User'} updated table category "${name}"`,
          userId: userContext.id,
          companyId: category.companyId || userContext.companyId || undefined,
          branchId: category.branchId || userContext.branchId || undefined,
          entityType: 'TABLE_CATEGORY',
          entityId: category.id,
        });
      }
    }

    res.json(category);
  } catch (error) {
    console.error('Error updating table category:', error);
    res.status(500).json({ error: 'Failed to update table category' });
  }
};

export const deleteTableCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if category has tables
    const category = await prisma.tableCategory.findUnique({
      where: { id: parseInt(id) },
      include: { tables: true }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Table category not found' });
    }
    
    if (category.tables.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing tables' });
    }

    await prisma.tableCategory.delete({
      where: { id: parseInt(id) }
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'table_category_deleted',
          message: `${userContext.name || 'User'} deleted table category "${category.name}"`,
          userId: userContext.id,
          companyId: category.companyId || userContext.companyId || undefined,
          branchId: category.branchId || userContext.branchId || undefined,
          entityType: 'TABLE_CATEGORY',
          entityId: parseInt(id),
        });
      }
    }

    res.json({ message: 'Table category deleted successfully' });
  } catch (error) {
    console.error('Error deleting table category:', error);
    res.status(500).json({ error: 'Failed to delete table category' });
  }
};

// Tables
export const getTables = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId, categoryId, status } = req.query;
    
    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (categoryId) where.categoryId = parseInt(categoryId as string);
    if (status) where.status = status;
    
    const tables = await prisma.table.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' }
    });
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
};

export const getTableById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const table = await prisma.table.findUnique({
      where: { id: parseInt(id) },
      include: { category: true }
    });
    if (table) {
      res.json(table);
    } else {
      res.status(404).json({ error: 'Table not found' });
    }
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ error: 'Failed to fetch table' });
  }
};

export const createTable = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId } = req.query;
    const { name, status, categoryId } = req.body;
    
    const table = await prisma.table.create({
      data: {
        name,
        status: status || 'available',
        categoryId: parseInt(categoryId),
        companyId: queryCompanyId ? parseInt(queryCompanyId as string) : null,
        branchId: queryBranchId ? parseInt(queryBranchId as string) : null
      },
      include: { category: true }
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'table_created',
          message: `${userContext.name || 'User'} created table "${name}"`,
          userId: userContext.id,
          companyId: table.companyId || userContext.companyId || undefined,
          branchId: table.branchId || userContext.branchId || undefined,
          entityType: 'TABLE',
          entityId: table.id,
        });
      }
    }

    res.status(201).json(table);
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status, categoryId } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);

    const table = await prisma.table.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { category: true }
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'table_updated',
          message: `${userContext.name || 'User'} updated table "${table.name}"`,
          userId: userContext.id,
          companyId: table.companyId || userContext.companyId || undefined,
          branchId: table.branchId || userContext.branchId || undefined,
          entityType: 'TABLE',
          entityId: table.id,
        });
      }
    }

    res.json(table);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const table = await prisma.table.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    await prisma.table.delete({
      where: { id: parseInt(id) }
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'table_deleted',
          message: `${userContext.name || 'User'} deleted table "${table.name}"`,
          userId: userContext.id,
          companyId: table.companyId || userContext.companyId || undefined,
          branchId: table.branchId || userContext.branchId || undefined,
          entityType: 'TABLE',
          entityId: parseInt(id),
        });
      }
    }

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
};









