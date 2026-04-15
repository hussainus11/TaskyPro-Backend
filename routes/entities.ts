import express from "express";
import {
  getEntityActivities,
  createEntityActivity
} from "../controllers/entityActivityController";
import {
  getEntityComments,
  createEntityComment,
  deleteEntityComment
} from "../controllers/entityCommentController";
import {
  createEntityData,
  updateEntityData,
  getEntityData,
  getEntityDataByType,
  deleteEntityData
} from "../controllers/entityDataController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Entity data routes (for form submissions)
// POST /api/entities/data - Create entity data
// GET /api/entities/data/:id - Get entity data by ID
// PUT /api/entities/data/:id - Update entity data
// DELETE /api/entities/data/:id - Delete entity data
// GET /api/entities/data/type/:entityType - Get all entity data by type
router.post("/data", createEntityData);
router.get("/data/:id", getEntityData);
router.put("/data/:id", updateEntityData);
router.delete("/data/:id", deleteEntityData);
router.get("/data/type/:entityType", getEntityDataByType);

// Entity activities routes
// GET /api/entities/:entityType/:entityId/activities
// POST /api/entities/:entityType/:entityId/activities
router.get("/:entityType/:entityId/activities", getEntityActivities);
router.post("/:entityType/:entityId/activities", createEntityActivity);

// Entity comments routes
// GET /api/entities/:entityType/:entityId/comments
// POST /api/entities/:entityType/:entityId/comments
// DELETE /api/entities/:entityType/:entityId/comments/:commentId
router.get("/:entityType/:entityId/comments", getEntityComments);
router.post("/:entityType/:entityId/comments", createEntityComment);
router.delete("/:entityType/:entityId/comments/:commentId", deleteEntityComment);

export default router;

