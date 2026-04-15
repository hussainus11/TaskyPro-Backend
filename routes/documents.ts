import express from 'express';
import {
  createWordDocument,
  createExcelDocument,
  createPowerPointDocument,
  createBoardDocument,
  getDocuments,
  getDocument,
  downloadDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/documentController';

const router = express.Router();

// Create documents
router.post('/word', createWordDocument);
router.post('/excel', createExcelDocument);
router.post('/powerpoint', createPowerPointDocument);
router.post('/board', createBoardDocument);

// Get all documents
router.get('/', getDocuments);

// Download document (must be before /:id route)
router.get('/:id/download', downloadDocument);

// Get a single document
router.get('/:id', getDocument);

// Update document
router.put('/:id', updateDocument);

// Delete document
router.delete('/:id', deleteDocument);

export default router;

