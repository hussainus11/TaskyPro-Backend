import express from "express";
import {
  getEmailNotifications,
  getEmailNotification,
  createEmailNotification,
  updateEmailNotification,
  deleteEmailNotification,
  toggleEmailNotification,
  duplicateEmailNotification
} from "../controllers/emailNotificationController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/", getEmailNotifications);
router.get("/:id", getEmailNotification);
router.post("/", createEmailNotification);
router.put("/:id", updateEmailNotification);
router.delete("/:id", deleteEmailNotification);
router.patch("/:id/toggle", toggleEmailNotification);
router.post("/:id/duplicate", duplicateEmailNotification);

export default router;








































































