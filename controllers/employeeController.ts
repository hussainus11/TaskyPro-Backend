import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all employees for a company/branch
export const getEmployees = async (req: AuthRequest, res: Response) => {
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
      // If company but no branch, get company-wide employees
      where.branchId = null;
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { order: 'asc' }
    });

    res.json(employees);
  } catch (error: any) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees', details: error.message });
  }
};

// Create an employee
export const createEmployee = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, color, order } = req.body;
    const userId = req.userId;

    if (!name || !color || order === undefined) {
      return res.status(400).json({ error: 'Name, color, and order are required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        color,
        order: parseInt(order),
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    res.status(201).json(employee);
  } catch (error: any) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee', details: error.message });
  }
};

// Update an employee
export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee belongs to user's company/branch
    if (employee.companyId !== user.companyId || 
        (employee.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(order !== undefined && { order: parseInt(order) })
      }
    });

    res.json(updatedEmployee);
  } catch (error: any) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee', details: error.message });
  }
};

// Delete an employee
export const deleteEmployee = async (req: AuthRequest, res: Response) => {
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

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee belongs to user's company/branch
    if (employee.companyId !== user.companyId || 
        (employee.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.employee.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee', details: error.message });
  }
};

// Reorder employees
export const reorderEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const { employees: reorderedEmployees } = req.body; // Expects [{ id: number, order: number }]
    const userId = req.userId;

    if (!Array.isArray(reorderedEmployees)) {
      return res.status(400).json({ error: 'Invalid employees data provided' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.$transaction(
      reorderedEmployees.map((employee: { id: number; order: number }) =>
        prisma.employee.updateMany({
          where: {
            id: employee.id,
            companyId: user.companyId,
            branchId: user.branchId || null
          },
          data: { order: employee.order }
        })
      )
    );

    res.status(200).json({ message: 'Employees reordered successfully' });
  } catch (error: any) {
    console.error('Reorder employees error:', error);
    res.status(500).json({ error: 'Failed to reorder employees', details: error.message });
  }
};











































































