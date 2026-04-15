import express from "express";
import {
  getSmtpSettings,
  getSmtpSetting,
  createSmtpSetting,
  updateSmtpSetting,
  deleteSmtpSetting,
  toggleSmtpSetting,
  testSmtpConnection
} from "../controllers/smtpSettingController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/", getSmtpSettings);
router.get("/:id", getSmtpSetting);
router.post("/", createSmtpSetting);
router.put("/:id", updateSmtpSetting);
router.delete("/:id", deleteSmtpSetting);
router.patch("/:id/toggle", toggleSmtpSetting);
router.post("/:id/test", testSmtpConnection);

export default router;








































































