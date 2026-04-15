import express from "express";
import {
  getProductCategories,
  getProductCategoryById,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from "../controllers/productCategoryController";

const router = express.Router();

router.get("/", getProductCategories);
router.get("/:id", getProductCategoryById);
router.post("/", createProductCategory);
router.put("/:id", updateProductCategory);
router.delete("/:id", deleteProductCategory);

export default router;


















































