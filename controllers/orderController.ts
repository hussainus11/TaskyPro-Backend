import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all orders
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const { status, type, limit } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (status) where.status = status;
    if (type) where.type = type;

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { orderDate: "desc" },
      take: limit ? parseInt(limit as string) : undefined,
    });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// Get recent orders
export const getRecentOrders = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const { limit = 20 } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
          take: 1, // Get first product for display
        },
      },
      orderBy: { orderDate: "desc" },
      take: parseInt(limit as string),
    });

    // Transform to match frontend format
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      customer: {
        name: order.customer.name,
        image: `/images/avatars/${(order.id % 10) + 1}.png`, // Placeholder image
      },
      product: {
        name: order.items[0]?.product?.name || "N/A",
      },
      amount: order.totalAmount,
      status: order.status.toLowerCase(),
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({ error: "Failed to fetch recent orders" });
  }
};

// Get order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

// Get order statistics
export const getOrderStats = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(startDate as string);
      if (endDate) where.orderDate.lte = new Date(endDate as string);
    }

    const orders = await prisma.order.findMany({
      where,
    });

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      pendingOrders: orders.filter((o) => o.status === "PENDING").length,
      completedOrders: orders.filter((o) => o.status === "COMPLETED").length,
      averageOrderValue:
        orders.length > 0
          ? orders.reduce((sum, order) => sum + order.totalAmount, 0) /
            orders.length
          : 0,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({ error: "Failed to fetch order stats" });
  }
};

// Create order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { companyId: queryCompanyId, branchId: queryBranchId } = req.query;
    const {
      orderNumber,
      customerId,
      status,
      type,
      subtotal,
      tax,
      discount,
      shippingCost,
      totalAmount,
      currency,
      paymentMethod,
      paymentStatus,
      shippingAddress,
      notes,
      items,
    } = req.body;

    // Generate order number if not provided
    const finalOrderNumber =
      orderNumber || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber: finalOrderNumber,
        customerId: parseInt(customerId),
        status: status || "PENDING",
        type: type || "SALE",
        subtotal: parseFloat(subtotal),
        tax: tax ? parseFloat(tax) : 0,
        discount: discount ? parseFloat(discount) : 0,
        shippingCost: shippingCost ? parseFloat(shippingCost) : 0,
        totalAmount: parseFloat(totalAmount),
        currency: currency || "USD",
        paymentMethod,
        paymentStatus,
        shippingAddress,
        notes,
        companyId: queryCompanyId ? parseInt(queryCompanyId as string) : null,
        branchId: queryBranchId ? parseInt(queryBranchId as string) : null,
        items: {
          create: items.map((item: any) => ({
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
            discount: item.discount ? parseFloat(item.discount) : 0,
            subtotal: parseFloat(item.subtotal),
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Log activity for order creation
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'order_created',
          message: `${userContext.name || 'User'} created order "${finalOrderNumber}"`,
          userId: userContext.id,
          companyId: order.companyId || userContext.companyId || undefined,
          branchId: order.branchId || userContext.branchId || undefined,
          entityType: 'ORDER',
          entityId: order.id,
        });
      }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Update order
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: any = {};

    const allowedFields = [
      "status",
      "type",
      "subtotal",
      "tax",
      "discount",
      "shippingCost",
      "totalAmount",
      "paymentMethod",
      "paymentStatus",
      "shippingAddress",
      "notes",
      "shippedDate",
      "deliveredDate",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field.includes("Date")) {
          updateData[field] = req.body[field]
            ? new Date(req.body[field])
            : null;
        } else if (typeof req.body[field] === "number") {
          updateData[field] = parseFloat(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Log activity for order update
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'order_updated',
          message: `${userContext.name || 'User'} updated order "${order.orderNumber}"`,
          userId: userContext.id,
          companyId: order.companyId || userContext.companyId || undefined,
          branchId: order.branchId || userContext.branchId || undefined,
          entityType: 'ORDER',
          entityId: order.id,
        });
      }
    }

    res.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
};

// Delete order
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get order details before deleting for activity logging
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, orderNumber: true, companyId: true, branchId: true }
    });

    if (order) {
      // Log activity for order deletion
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
      if (userId) {
        const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
        if (userContext) {
          await logActivity({
            type: 'order_deleted',
            message: `${userContext.name || 'User'} deleted order "${order.orderNumber}"`,
            userId: userContext.id,
            companyId: order.companyId || userContext.companyId || undefined,
            branchId: order.branchId || userContext.branchId || undefined,
            entityType: 'ORDER',
            entityId: parseInt(id),
          });
        }
      }
    }

    await prisma.order.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
};

