import express from "express";
import {
  getProductSubCategories,
  getProductSubCategoryById,
  createProductSubCategory,
  updateProductSubCategory,
  deleteProductSubCategory,
} from "../controllers/productSubCategoryController";

const router = express.Router();

router.get("/", getProductSubCategories);
router.get("/:id", getProductSubCategoryById);
router.post("/", createProductSubCategory);
router.put("/:id", updateProductSubCategory);
router.delete("/:id", deleteProductSubCategory);

export default router;


















































