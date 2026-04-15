import express from 'express';
import {
  getCallStatuses,
  createCallStatus,
  updateCallStatus,
  deleteCallStatus,
  reorderCallStatuses
} from '../controllers/callStatusController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getCallStatuses);
router.post('/', createCallStatus);
router.put('/:id', updateCallStatus);
router.delete('/:id', deleteCallStatus);
router.post('/reorder', reorderCallStatuses);

export default router;

