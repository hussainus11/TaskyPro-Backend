import express from "express";
import {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder
} from "../controllers/reminderController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.get("/", authenticate, getReminders);
router.get("/:id", authenticate, getReminder);
router.post("/", authenticate, createReminder);
router.put("/:id", authenticate, updateReminder);
router.delete("/:id", authenticate, deleteReminder);

export default router;
























