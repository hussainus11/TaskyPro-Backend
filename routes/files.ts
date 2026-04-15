import express from "express";
import {
  getFiles,
  getRecentFiles,
  getFileById,
  getFileStats,
  createFile,
  updateFile,
  deleteFile,
} from "../controllers/fileController";

const router = express.Router();

router.get("/", getFiles);
router.get("/recent", getRecentFiles);
router.get("/stats", getFileStats);
router.get("/:id", getFileById);
router.post("/", createFile);
router.put("/:id", updateFile);
router.delete("/:id", deleteFile);

export default router;






























































