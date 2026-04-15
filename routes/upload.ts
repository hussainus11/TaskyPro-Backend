import express from "express";
import { upload, getRelativeFilePath, getFileTypeFromMime } from "../utils/fileUpload";
import { prisma } from "../lib/prisma";
import path from "path";

const router = express.Router();

// Upload single file
router.post("/single", (req, res, next) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "File size should be up to 3MB" });
      }
      return res.status(400).json({ error: err.message || "File upload failed" });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { companyId, branchId, userId, folderId, deviceType } = req.body;

    const fileType = getFileTypeFromMime(req.file.mimetype);
    const relativePath = getRelativeFilePath(fileType, req.file.filename);

    // Detect device type from user agent if not provided
    let detectedDeviceType = deviceType || "desktop";
    if (!deviceType && req.headers['user-agent']) {
      const userAgent = req.headers['user-agent'].toLowerCase();
      if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        detectedDeviceType = "mobile";
      }
    }

    // Create file record in database
    const file = await prisma.file.create({
      data: {
        name: req.file.originalname,
        originalName: req.file.originalname,
        type: fileType,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: relativePath,
        deviceType: detectedDeviceType,
        folderId: folderId ? parseInt(folderId) : null,
        starred: false,
        userId: userId ? parseInt(userId) : null,
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null,
      },
    });

    res.status(201).json({
      ...file,
      relativePath,
    });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file", details: error.message });
  }
});

// Upload multiple files
router.post("/multiple", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const { companyId, branchId, userId, folderId, deviceType } = req.body;
    const files = req.files as Express.Multer.File[];

    // Detect device type from user agent if not provided
    let detectedDeviceType = deviceType || "desktop";
    if (!deviceType && req.headers['user-agent']) {
      const userAgent = req.headers['user-agent'].toLowerCase();
      if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        detectedDeviceType = "mobile";
      }
    }

    const uploadedFiles = [];

    for (const file of files) {
      const fileType = getFileTypeFromMime(file.mimetype);
      const relativePath = getRelativeFilePath(fileType, file.filename);

      // Create file record in database
      const fileRecord = await prisma.file.create({
        data: {
          name: file.originalname,
          originalName: file.originalname,
          type: fileType,
          mimeType: file.mimetype,
          size: file.size,
          url: relativePath,
          deviceType: detectedDeviceType,
          folderId: folderId ? parseInt(folderId) : null,
          starred: false,
          userId: userId ? parseInt(userId) : null,
          companyId: companyId ? parseInt(companyId) : null,
          branchId: branchId ? parseInt(branchId) : null,
        },
      });

      uploadedFiles.push({
        ...fileRecord,
        relativePath,
      });
    }

    res.status(201).json({ files: uploadedFiles });
  } catch (error: any) {
    console.error("Error uploading files:", error);
    res.status(500).json({ error: "Failed to upload files", details: error.message });
  }
});

export default router;

