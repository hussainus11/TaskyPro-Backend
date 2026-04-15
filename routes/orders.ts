import express from "express";
import {
  getOrders,
  getRecentOrders,
  getOrderById,
  getOrderStats,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController";
import {
  createOrderReturn,
  processOrderReturn,
  getOrderReturns,
  getOrderReturnById,
  updateOrderReturn,
} from "../controllers/orderReturnController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Return routes (must be before /:id route to avoid route conflicts)
router.post("/returns/:id/process", processOrderReturn);
router.get("/returns", getOrderReturns);
router.get("/returns/:id", getOrderReturnById);
router.put("/returns/:id", updateOrderReturn);
router.post("/:id/return", createOrderReturn);

// Order routes
router.get("/", getOrders);
router.get("/recent", getRecentOrders);
router.get("/stats", getOrderStats);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;





















































