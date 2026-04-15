import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Products image directory
const PRODUCTS_IMAGE_DIR = path.join(process.cwd(), 'files', 'IMAGE', 'products');

// Ensure products directory exists
if (!fs.existsSync(PRODUCTS_IMAGE_DIR)) {
  fs.mkdirSync(PRODUCTS_IMAGE_DIR, { recursive: true });
}

// Configure multer storage for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PRODUCTS_IMAGE_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${uniqueSuffix}-${sanitizedName}${ext}`;
    cb(null, filename);
  },
});

// File filter - only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Create multer instance for product images
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Upload single product image
router.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    // Return the relative path that can be used in the database
    const relativePath = `files/IMAGE/products/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      path: relativePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error: any) {
    console.error("Error uploading product image:", error);
    res.status(500).json({ error: "Failed to upload product image", details: error.message });
  }
});

// Upload multiple product images
router.post("/multiple", upload.array("images", 5), (req, res) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: "No image files uploaded" });
    }

    const files = req.files as Express.Multer.File[];
    const uploadedFiles = files.map((file) => ({
      path: `files/IMAGE/products/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.status(200).json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error: any) {
    console.error("Error uploading product images:", error);
    res.status(500).json({ error: "Failed to upload product images", details: error.message });
  }
});

export default router;

















































