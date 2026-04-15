import express from "express";
import {
  getCustomers,
  getNewCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController";

const router = express.Router();

router.get("/", getCustomers);
router.get("/new", getNewCustomers);
router.get("/:id", getCustomerById);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
































































