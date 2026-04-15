import express from "express";
import {
  getProducts,
  getProductById,
  getBestSellingProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";

const router = express.Router();

router.get("/", getProducts);
router.get("/bestselling", getBestSellingProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
































































