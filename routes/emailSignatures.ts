import express from "express";
import {
  getEmailSignatures,
  getEmailSignature,
  createEmailSignature,
  updateEmailSignature,
  deleteEmailSignature,
  toggleEmailSignature,
  duplicateEmailSignature
} from "../controllers/emailSignatureController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/", getEmailSignatures);
router.get("/:id", getEmailSignature);
router.post("/", createEmailSignature);
router.put("/:id", updateEmailSignature);
router.delete("/:id", deleteEmailSignature);
router.patch("/:id/toggle", toggleEmailSignature);
router.post("/:id/duplicate", duplicateEmailSignature);

export default router;








































































