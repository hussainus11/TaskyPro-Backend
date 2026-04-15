import express from 'express';
import {
  getLeadStages,
  createLeadStage,
  updateLeadStage,
  deleteLeadStage,
  reorderLeadStages
} from '../controllers/leadStageController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getLeadStages);
router.post('/', createLeadStage);
router.put('/:id', updateLeadStage);
router.delete('/:id', deleteLeadStage);
router.post('/reorder', reorderLeadStages);

export default router;

