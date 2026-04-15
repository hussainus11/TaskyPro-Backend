import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all supplier payments
export const getSupplierPayments = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const { status, supplierId, startDate, endDate } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (status) where.status = status;
    if (supplierId) where.supplierId = parseInt(supplierId as string);
    
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    const payments = await prisma.supplierPayment.findMany({
      where,
      include: {
        supplier: true,
      },
      orderBy: { paymentDate: "desc" },
    });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching supplier payments:", error);
    res.status(500).json({ error: "Failed to fetch supplier payments" });
  }
};

// Get supplier payment by ID
export const getSupplierPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await prisma.supplierPayment.findUnique({
      where: { id: parseInt(id) },
      include: {
        supplier: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Supplier payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error fetching supplier payment:", error);
    res.status(500).json({ error: "Failed to fetch supplier payment" });
  }
};

// Create supplier payment
export const createSupplierPayment = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId } = req.query;
    const {
      supplierId,
      amount,
      paymentMethod,
      status,
      paymentDate,
      reference,
      notes,
    } = req.body;

    // Generate payment number
    const paymentNumber = `SP-${Date.now()}`;

    const payment = await prisma.supplierPayment.create({
      data: {
        paymentNumber,
        supplierId,
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
        supplier: true,
      },
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'supplier_payment_created',
          message: `${userContext.name || 'User'} created supplier payment ${paymentNumber}`,
          userId: userContext.id,
          companyId: payment.companyId || userContext.companyId || undefined,
          branchId: payment.branchId || userContext.branchId || undefined,
          entityType: 'SUPPLIER_PAYMENT',
          entityId: payment.id,
        });
      }
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error("Error creating supplier payment:", error);
    res.status(500).json({ error: "Failed to create supplier payment" });
  }
};

// Update supplier payment
export const updateSupplierPayment = async (req: Request, res: Response) => {
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

    const existingPayment = await prisma.supplierPayment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPayment) {
      return res.status(404).json({ error: "Supplier payment not found" });
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (status !== undefined) updateData.status = status;
    if (paymentDate !== undefined) updateData.paymentDate = new Date(paymentDate);
    if (reference !== undefined) updateData.reference = reference;
    if (notes !== undefined) updateData.notes = notes;

    const payment = await prisma.supplierPayment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        supplier: true,
      },
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'supplier_payment_updated',
          message: `${userContext.name || 'User'} updated supplier payment ${payment.paymentNumber}`,
          userId: userContext.id,
          companyId: payment.companyId || userContext.companyId || undefined,
          branchId: payment.branchId || userContext.branchId || undefined,
          entityType: 'SUPPLIER_PAYMENT',
          entityId: payment.id,
        });
      }
    }

    res.json(payment);
  } catch (error) {
    console.error("Error updating supplier payment:", error);
    res.status(500).json({ error: "Failed to update supplier payment" });
  }
};

// Delete supplier payment
export const deleteSupplierPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await prisma.supplierPayment.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, paymentNumber: true, companyId: true, branchId: true },
    });

    if (!payment) {
      return res.status(404).json({ error: "Supplier payment not found" });
    }

    await prisma.supplierPayment.delete({
      where: { id: parseInt(id) },
    });

    // Log activity
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'supplier_payment_deleted',
          message: `${userContext.name || 'User'} deleted supplier payment ${payment.paymentNumber}`,
          userId: userContext.id,
          companyId: payment.companyId || userContext.companyId || undefined,
          branchId: payment.branchId || userContext.branchId || undefined,
          entityType: 'SUPPLIER_PAYMENT',
          entityId: parseInt(id),
        });
      }
    }

    res.json({ message: "Supplier payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier payment:", error);
    res.status(500).json({ error: "Failed to delete supplier payment" });
  }
};























