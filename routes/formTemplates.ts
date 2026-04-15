import express from "express";
import {
  getFormTemplates,
  getFormTemplate,
  getFormTemplateByPath,
  createFormTemplate,
  updateFormTemplate,
  deleteFormTemplate,
  toggleFormTemplate,
  duplicateFormTemplate,
  getDatabaseModels,
  getModelData,
  getCustomEntities
} from "../controllers/formTemplateController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/", getFormTemplates);
router.get("/custom-entities", getCustomEntities);
router.get("/models", getDatabaseModels);
router.get("/models/:modelName/data", getModelData);
router.get("/path/:path", getFormTemplateByPath);
router.get("/:id", getFormTemplate);
router.post("/", createFormTemplate);
router.put("/:id", updateFormTemplate);
router.delete("/:id", deleteFormTemplate);
router.patch("/:id/toggle", toggleFormTemplate);
router.post("/:id/duplicate", duplicateFormTemplate);

export default router;



