import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all customer payments
export const getCustomerPayments = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const { status, customerId, orderId, startDate, endDate } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (status) where.status = status;
    if (customerId) where.customerId = parseInt(customerId as string);
    if (orderId) where.orderId = parseInt(orderId as string);
    
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    const payments = await prisma.customerPayment.findMany({
      where,
      include: {
        customer: true,
        order: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching customer payments:", error);
    res.status(500).json({ error: "Failed to fetch customer payments" });
  }
};

// Get customer payment by ID
export const getCustomerPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await prisma.customerPayment.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        order: {
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Customer payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error fetching customer payment:", error);
    res.status(500).json({ error: "Failed to fetch customer payment" });
  }
};

// Create customer payment
export const createCustomerPayment = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId } = req.query;
    const {
      customerId,
      orderId,
      amount,
      paymentMethod,
      status,
      paymentDate,
      reference,
      notes,
    } = req.body;

    // Generate payment number
    const paymentNumber = `CP-${Date.now()}`;

    const payment = await prisma.customerPayment.create({
      data: {
        paymentNumber,
        customerId,
        orderId: orderId || null,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod || "CASH",
        status: status || "PENDING",
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        reference,
        notes,
        companyId: queryCompanyId ? parseInt(queryCompanyId as string) : null,
        branchId: queryBranchId ? parseInt(queryBranchId as string) : null,
      },
      include: {
        customer: true,
        order: true,
      },
    });

    // Update order payment status if orderId is provided
    if (orderId && status === "COMPLETED") {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "paid" },
      });
    }

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'customer_payment_created',
          message: `${userContext.name || 'User'} created customer payment ${paymentNumber}`,
          userId: userContext.id,
          companyId: payment.companyId || userContext.companyId || undefined,
          branchId: payment.branchId || userContext.branchId || undefined,
          entityType: 'CUSTOMER_PAYMENT',
          entityId: payment.id,
        });
      }
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error("Error creating customer payment:", error);
    res.status(500).json({ error: "Failed to create customer payment" });
  }
};

// Update customer payment
export const updateCustomerPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      amount,
      paymentMethod,
      status,
      paymentDate,
      reference,
      notes,
    } = req.body;

    const existingPayment = await prisma.customerPayment.findUnique({
      where: { id: parseInt(id) },
      include: { order: true },
    });

    if (!existingPayment) {
      return res.status(404).json({ error: "Customer payment not found" });
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (status !== undefined) updateData.status = status;
    if (paymentDate !== undefined) updateData.paymentDate = new Date(paymentDate);
    if (reference !== undefined) updateData.reference = reference;
    if (notes !== undefined) updateData.notes = notes;

    const payment = await prisma.customerPayment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        customer: true,
        order: true,
      },
    });

    // Update order payment status if orderId exists and status changed to COMPLETED
    if (payment.orderId && status === "COMPLETED" && existingPayment.status !== "COMPLETED") {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "paid" },
      });
    }

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'customer_payment_updated',
          message: `${userContext.name || 'User'} updated customer payment ${payment.paymentNumber}`,
          userId: userContext.id,
          companyId: payment.companyId || userContext.companyId || undefined,
          branchId: payment.branchId || userContext.branchId || undefined,
          entityType: 'CUSTOMER_PAYMENT',
          entityId: payment.id,
        });
      }
    }

    res.json(payment);
  } catch (error) {
    console.error("Error updating customer payment:", error);
    res.status(500).json({ error: "Failed to update customer payment" });
  }
};

// Delete customer payment
export const deleteCustomerPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.customerPayment.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, paymentNumber: true, companyId: true, branchId: true, orderId: true },
    });

    if (!payment) {
      return res.status(404).json({ error: "Customer payment not found" });
    }

    await prisma.customerPayment.delete({
      where: { id: parseInt(id) },
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'customer_payment_deleted',
          message: `${userContext.name || 'User'} deleted customer payment ${payment.paymentNumber}`,
          userId: userContext.id,
          companyId: payment.companyId || userContext.companyId || undefined,
          branchId: payment.branchId || userContext.branchId || undefined,
          entityType: 'CUSTOMER_PAYMENT',
          entityId: parseInt(id),
        });
      }
    }

    res.json({ message: "Customer payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer payment:", error);
    res.status(500).json({ error: "Failed to delete customer payment" });
  }
};























