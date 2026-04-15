import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the files directory exists
const FILES_DIR = path.join(process.cwd(), 'files');

// Create files directory and subdirectories if they don't exist
const FILE_TYPE_DIRS = {
  DOCUMENT: path.join(FILES_DIR, 'DOCUMENT'),
  IMAGE: path.join(FILES_DIR, 'IMAGE'),
  VIDEO: path.join(FILES_DIR, 'VIDEO'),
  AUDIO: path.join(FILES_DIR, 'AUDIO'),
  ARCHIVE: path.join(FILES_DIR, 'ARCHIVE'),
  OTHER: path.join(FILES_DIR, 'OTHER'),
};

// Product images directory
const PRODUCTS_IMAGE_DIR = path.join(FILES_DIR, 'IMAGE', 'products');

// Initialize directories
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

Object.values(FILE_TYPE_DIRS).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create products subdirectory
if (!fs.existsSync(PRODUCTS_IMAGE_DIR)) {
  fs.mkdirSync(PRODUCTS_IMAGE_DIR, { recursive: true });
}

// Determine file type from MIME type
function getFileType(mimeType: string): 'DOCUMENT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'ARCHIVE' | 'OTHER' {
  if (mimeType.startsWith('image/')) {
    return 'IMAGE';
  } else if (mimeType.startsWith('video/')) {
    return 'VIDEO';
  } else if (mimeType.startsWith('audio/')) {
    return 'AUDIO';
  } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) {
    return 'ARCHIVE';
  } else if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text') ||
    mimeType.includes('msword') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType.includes('excel') ||
    mimeType.includes('word')
  ) {
    return 'DOCUMENT';
  }
  return 'OTHER';
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check if this is a product image upload
    if (req.body?.uploadType === 'product' || req.path?.includes('product')) {
      cb(null, PRODUCTS_IMAGE_DIR);
    } else {
      const fileType = getFileType(file.mimetype);
      const destDir = FILE_TYPE_DIRS[fileType];
      cb(null, destDir);
    }
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

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept all file types
  cb(null, true);
};

// Create multer instance
// For chat files, limit to 3MB
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB limit for chat files
  },
});

// Helper function to get relative file path
export function getRelativeFilePath(fileType: string, filename: string, isProduct: boolean = false): string {
  if (isProduct) {
    return `files/IMAGE/products/${filename}`;
  }
  return `files/${fileType}/${filename}`;
}

// Helper function to get file type from mime type
export function getFileTypeFromMime(mimeType: string): string {
  return getFileType(mimeType);
}

// Export files directory for serving static files
export { FILES_DIR };














