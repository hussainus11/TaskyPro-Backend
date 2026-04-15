import express from "express";
import {
  getFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
} from "../controllers/folderController";

const router = express.Router();

router.get("/", getFolders);
router.get("/:id", getFolderById);
router.post("/", createFolder);
router.put("/:id", updateFolder);
router.delete("/:id", deleteFolder);

export default router;
































































