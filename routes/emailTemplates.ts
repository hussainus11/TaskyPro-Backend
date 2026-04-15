import express from "express";
import {
  getEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  toggleEmailTemplate,
  duplicateEmailTemplate
} from "../controllers/emailTemplateController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/", getEmailTemplates);
router.get("/:id", getEmailTemplate);
router.post("/", createEmailTemplate);
router.put("/:id", updateEmailTemplate);
router.delete("/:id", deleteEmailTemplate);
router.patch("/:id/toggle", toggleEmailTemplate);
router.post("/:id/duplicate", duplicateEmailTemplate);

export default router;

