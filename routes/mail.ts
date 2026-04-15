import express from "express";
import {
  getMails,
  getMailById,
  sendMail,
  saveDraft,
  deleteMail,
  updateMail,
  bulkUpdateMails,
  getMailAccounts,
  getMailCounts,
  fetchEmails,
  testImapConnection
} from "../controllers/mailController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Mail routes - specific routes must come before parameterized routes
router.get("/accounts", getMailAccounts);
router.get("/counts", getMailCounts);
router.post("/test-imap", testImapConnection);
router.post("/fetch", fetchEmails);
router.get("/", getMails);
router.get("/:id", getMailById);
router.post("/send", sendMail);
router.post("/draft", saveDraft);
router.put("/:id", updateMail);
router.post("/bulk-update", bulkUpdateMails);
router.delete("/:id", deleteMail);

export default router;

