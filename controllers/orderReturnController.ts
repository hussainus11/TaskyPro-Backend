import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logActivity, getUserContext } from '../utils/activityLogger';
import { AuthRequest } from '../middleware/auth';

// Create order return
export const createOrderReturn = async (req: AuthRequest, res: Response) => {
  try {
    const {
      orderId,
      returnReason,
      returnReasonNote,
      items, // Array of { orderItemId, quantity, reason, reasonNote, condition }
      refundMethod,
      notes,
    } = req.body;

    const userId = req.userId;

    if (!orderId || !returnReason || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order ID, return reason, and items are required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the order with items
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate that order belongs to user's company/branch
    if (order.companyId !== user.companyId || 
        (order.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Validate return items
    let totalRefundAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const orderItem = order.items.find(oi => oi.id === parseInt(item.orderItemId));
      if (!orderItem) {
        return res.status(400).json({ error: `Order item ${item.orderItemId} not found` });
      }

      const returnQuantity = parseInt(item.quantity);
      if (returnQuantity <= 0) {
        return res.status(400).json({ error: `Return quantity must be greater than 0 for item ${item.orderItemId}` });
      }

      const alreadyReturned = orderItem.returnedQuantity || 0;
      const availableToReturn = orderItem.quantity - alreadyReturned;
      if (returnQuantity > availableToReturn) {
        return res.status(400).json({ 
          error: `Cannot return ${returnQuantity} items. Only ${availableToReturn} available to return for item ${item.orderItemId}` 
        });
      }

      // Calculate refund amount for this item
      const itemRefundAmount = (orderItem.price * returnQuantity) - (orderItem.discount || 0) * (returnQuantity / orderItem.quantity);
      totalRefundAmount += itemRefundAmount;

      validatedItems.push({
        orderItem,
        returnQuantity,
        itemRefundAmount,
        reason: item.reason,
        reasonNote: item.reasonNote,
        condition: item.condition,
      });
    }

    // Generate return number
    const returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create return transaction
    const orderReturn = await prisma.$transaction(async (tx) => {
      // Create the return record
      const newReturn = await tx.orderReturn.create({
        data: {
          returnNumber,
          orderId: parseInt(orderId),
          customerId: order.customerId,
          status: 'PENDING',
          returnReason: returnReason,
          returnReasonNote: returnReasonNote,
          refundAmount: totalRefundAmount,
          refundMethod: refundMethod || null,
          refundStatus: 'PENDING',
          notes,
          processedById: userId,
          companyId: user.companyId,
          branchId: user.branchId,
          items: {
            create: validatedItems.map(({ orderItem, returnQuantity, itemRefundAmount, reason, reasonNote, condition }) => ({
              orderItemId: orderItem.id,
              productId: orderItem.productId,
              quantity: returnQuantity,
              price: orderItem.price,
              refundAmount: itemRefundAmount,
              reason: reason || null,
              reasonNote: reasonNote || null,
              condition: condition || null,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
              orderItem: true,
            },
          },
          customer: true,
          order: true,
        },
      });

      // Update order items with returned quantities
      for (const { orderItem, returnQuantity } of validatedItems) {
        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: {
            returnedQuantity: (orderItem.returnedQuantity || 0) + returnQuantity,
          },
        });
      }

      return newReturn;
    });

    // Log activity
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'order_return_created',
        message: `${userContext.name || 'User'} created return "${returnNumber}" for order "${order.orderNumber}"`,
        userId: userContext.id,
        companyId: orderReturn.companyId || userContext.companyId || undefined,
        branchId: orderReturn.branchId || userContext.branchId || undefined,
        entityType: 'ORDER_RETURN',
        entityId: orderReturn.id,
      });
    }

    res.status(201).json(orderReturn);
  } catch (error: any) {
    console.error('Error creating order return:', error);
    res.status(500).json({ error: 'Failed to create order return', details: error.message });
  }
};

// Process return (approve and update stock)
export const processOrderReturn = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approve, reject, refundStatus, refundReference } = req.body;

    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the return with items
    const orderReturn = await prisma.orderReturn.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            product: true,
            orderItem: true,
          },
        },
        order: true,
        customer: true,
      },
    });

    if (!orderReturn) {
      return res.status(404).json({ error: 'Order return not found' });
    }

    // Validate that return belongs to user's company/branch
    if (orderReturn.companyId !== user.companyId || 
        (orderReturn.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (orderReturn.status !== 'PENDING' && orderReturn.status !== 'APPROVED') {
      return res.status(400).json({ error: `Cannot process return with status ${orderReturn.status}` });
    }

    // Process return
    const updatedReturn = await prisma.$transaction(async (tx) => {
      let newStatus: 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' = orderReturn.status as any;

      if (reject) {
        newStatus = 'REJECTED';
      } else if (approve) {
        if (orderReturn.status === 'PENDING') {
          newStatus = 'APPROVED';
        } else if (orderReturn.status === 'APPROVED') {
          newStatus = 'PROCESSING';
          
          // Update product stock quantities
          for (const returnItem of orderReturn.items) {
            await tx.product.update({
              where: { id: returnItem.productId },
              data: {
                quantity: {
                  increment: returnItem.quantity, // Add returned items back to stock
                },
              },
            });
          }
        }
      }

      // If refund status is provided, update it
      const updateData: any = {
        status: newStatus,
        processedById: userId,
        processedDate: new Date(),
      };

      if (refundStatus) {
        updateData.refundStatus = refundStatus;
        if (refundStatus === 'COMPLETED') {
          updateData.status = 'COMPLETED';
        }
      }

      if (refundReference) {
        updateData.refundReference = refundReference;
      }

      const updated = await tx.orderReturn.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          items: {
            include: {
              product: true,
              orderItem: true,
            },
          },
          customer: true,
          order: true,
        },
      });

      // Create refund payment record if refund is completed
      if (refundStatus === 'COMPLETED' && orderReturn.refundAmount > 0) {
        const refundPaymentNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await tx.customerPayment.create({
          data: {
            paymentNumber: refundPaymentNumber,
            customerId: orderReturn.customerId,
            orderId: orderReturn.orderId,
            amount: -orderReturn.refundAmount, // Negative amount for refund
            paymentMethod: orderReturn.refundMethod || 'CASH',
            status: 'COMPLETED',
            paymentDate: new Date(),
            reference: refundReference || refundPaymentNumber,
            notes: `Refund for return ${orderReturn.returnNumber}`,
            companyId: user.companyId,
            branchId: user.branchId,
          },
        });
      }

      return updated;
    });

    // Log activity
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'order_return_processed',
        message: `${userContext.name || 'User'} ${approve ? 'approved' : reject ? 'rejected' : 'processed'} return "${orderReturn.returnNumber}"`,
        userId: userContext.id,
        companyId: updatedReturn.companyId || userContext.companyId || undefined,
        branchId: updatedReturn.branchId || userContext.branchId || undefined,
        entityType: 'ORDER_RETURN',
        entityId: updatedReturn.id,
      });
    }

    res.json(updatedReturn);
  } catch (error: any) {
    console.error('Error processing order return:', error);
    res.status(500).json({ error: 'Failed to process order return', details: error.message });
  }
};

// Get all returns
export const getOrderReturns = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, branchId, status, orderId } = req.query;
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
    if (filterCompanyId) where.companyId = filterCompanyId;
    if (filterBranchId) where.branchId = filterBranchId;
    if (status) where.status = status;
    if (orderId) where.orderId = parseInt(orderId as string);

    const returns = await prisma.orderReturn.findMany({
      where,
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        customer: true,
        items: {
          include: {
            product: true,
            orderItem: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { returnDate: 'desc' },
    });

    res.json(returns);
  } catch (error: any) {
    console.error('Error fetching order returns:', error);
    res.status(500).json({ error: 'Failed to fetch order returns', details: error.message });
  }
};

// Get return by ID
export const getOrderReturnById = async (req: AuthRequest, res: Response) => {
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

    const orderReturn = await prisma.orderReturn.findUnique({
      where: { id: parseInt(id) },
      include: {
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
        customer: true,
        items: {
          include: {
            product: true,
            orderItem: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!orderReturn) {
      return res.status(404).json({ error: 'Order return not found' });
    }

    // Validate that return belongs to user's company/branch
    if (orderReturn.companyId !== user.companyId || 
        (orderReturn.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(orderReturn);
  } catch (error: any) {
    console.error('Error fetching order return:', error);
    res.status(500).json({ error: 'Failed to fetch order return', details: error.message });
  }
};

// Update return
export const updateOrderReturn = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, refundStatus, refundReference, notes } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const orderReturn = await prisma.orderReturn.findUnique({
      where: { id: parseInt(id) },
    });

    if (!orderReturn) {
      return res.status(404).json({ error: 'Order return not found' });
    }

    // Validate that return belongs to user's company/branch
    if (orderReturn.companyId !== user.companyId || 
        (orderReturn.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (refundStatus !== undefined) updateData.refundStatus = refundStatus;
    if (refundReference !== undefined) updateData.refundReference = refundReference;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.orderReturn.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        customer: true,
        items: {
          include: {
            product: true,
            orderItem: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'order_return_updated',
        message: `${userContext.name || 'User'} updated return "${orderReturn.returnNumber}"`,
        userId: userContext.id,
        companyId: updated.companyId || userContext.companyId || undefined,
        branchId: updated.branchId || userContext.branchId || undefined,
        entityType: 'ORDER_RETURN',
        entityId: updated.id,
      });
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating order return:', error);
    res.status(500).json({ error: 'Failed to update order return', details: error.message });
  }
};












