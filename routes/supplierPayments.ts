import express from "express";
import {
  getSupplierPayments,
  getSupplierPaymentById,
  createSupplierPayment,
  updateSupplierPayment,
  deleteSupplierPayment,
} from "../controllers/supplierPaymentController";

const router = express.Router();

router.get("/", getSupplierPayments);
router.get("/:id", getSupplierPaymentById);
router.post("/", createSupplierPayment);
router.put("/:id", updateSupplierPayment);
router.delete("/:id", deleteSupplierPayment);

export default router;























