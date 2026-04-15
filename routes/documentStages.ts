import express from 'express';
import {
  getDocumentStages,
  createDocumentStage,
  updateDocumentStage,
  deleteDocumentStage,
  reorderDocumentStages
} from '../controllers/documentStageController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getDocumentStages);
router.post('/', createDocumentStage);
router.put('/:id', updateDocumentStage);
router.delete('/:id', deleteDocumentStage);
router.post('/reorder', reorderDocumentStages);

export default router;

