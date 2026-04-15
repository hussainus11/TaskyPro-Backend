import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all customers
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const { search } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        { phone: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        orders: {
          take: 5,
          orderBy: { orderDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
};

// Get new customers (created in last 30 days by default)
export const getNewCustomers = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const { days = 30 } = req.query;

    const where: any = {
      createdAt: {
        gte: new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000),
      },
    };
    if (companyId) where.companyId = companyId;
    if (branchId) where.branchId = branchId;

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(customers);
  } catch (error) {
    console.error("Error fetching new customers:", error);
    res.status(500).json({ error: "Failed to fetch new customers" });
  }
};

// Get customer by ID
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { orderDate: "desc" },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
};

// Create customer
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId } = req.query;
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        city,
        state,
        country,
        postalCode,
        companyId: queryCompanyId ? parseInt(queryCompanyId as string) : null,
        branchId: queryBranchId ? parseInt(queryBranchId as string) : null,
      },
    });

    // Log activity for customer creation (get userId from request if available)
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'customer_created',
          message: `${userContext.name || 'User'} created customer "${name}"`,
          userId: userContext.id,
          companyId: customer.companyId || userContext.companyId || undefined,
          branchId: customer.branchId || userContext.branchId || undefined,
          entityType: 'CUSTOMER',
          entityId: customer.id,
        });
      }
    }

    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
    } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (postalCode !== undefined) updateData.postalCode = postalCode;

    // Get customer before updating for activity logging
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      select: { name: true, companyId: true, branchId: true }
    });

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Log activity for customer update
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId && existingCustomer) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'customer_updated',
          message: `${userContext.name || 'User'} updated customer "${customer.name}"`,
          userId: userContext.id,
          companyId: customer.companyId || userContext.companyId || undefined,
          branchId: customer.branchId || userContext.branchId || undefined,
          entityType: 'CUSTOMER',
          entityId: customer.id,
        });
      }
    }

    res.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
};

// Delete customer
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get customer details before deleting for activity logging
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, companyId: true, branchId: true }
    });

    if (customer) {
      // Log activity for customer deletion
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
      if (userId) {
        const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
        if (userContext) {
          await logActivity({
            type: 'customer_deleted',
            message: `${userContext.name || 'User'} deleted customer "${customer.name}"`,
            userId: userContext.id,
            companyId: customer.companyId || userContext.companyId || undefined,
            branchId: customer.branchId || userContext.branchId || undefined,
            entityType: 'CUSTOMER',
            entityId: parseInt(id),
          });
        }
      }
    }

    await prisma.customer.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
};

