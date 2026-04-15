import express from 'express';
import {
  getBusinessProcesses,
  getBusinessProcess,
  createBusinessProcess,
  updateBusinessProcess,
  deleteBusinessProcess,
  toggleBusinessProcess
} from '../controllers/businessProcessController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getBusinessProcesses);
router.get('/:id', getBusinessProcess);
router.post('/', createBusinessProcess);
router.put('/:id', updateBusinessProcess);
router.put('/:id/toggle', toggleBusinessProcess);
router.delete('/:id', deleteBusinessProcess);

export default router;








































































