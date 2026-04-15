import express from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getRecentProjects
} from "../controllers/projectController";

const router = express.Router();

router.get("/", getProjects);
router.get("/stats", getProjectStats);
router.get("/recent", getRecentProjects);
router.get("/:id", getProject);
router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;






























































