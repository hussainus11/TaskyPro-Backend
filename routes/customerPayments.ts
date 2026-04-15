import express from "express";
import {
  getCustomerPayments,
  getCustomerPaymentById,
  createCustomerPayment,
  updateCustomerPayment,
  deleteCustomerPayment,
} from "../controllers/customerPaymentController";

const router = express.Router();

router.get("/", getCustomerPayments);
router.get("/:id", getCustomerPaymentById);
router.post("/", createCustomerPayment);
router.put("/:id", updateCustomerPayment);
router.delete("/:id", deleteCustomerPayment);

export default router;























