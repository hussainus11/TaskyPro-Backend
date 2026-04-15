import express from 'express';
import {
  getEstimateStages,
  createEstimateStage,
  updateEstimateStage,
  deleteEstimateStage,
  reorderEstimateStages
} from '../controllers/estimateStageController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getEstimateStages);
router.post('/', createEstimateStage);
router.put('/:id', updateEstimateStage);
router.delete('/:id', deleteEstimateStage);
router.post('/reorder', reorderEstimateStages);

export default router;


