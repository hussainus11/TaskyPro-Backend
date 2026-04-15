import express from 'express';
import {
  getDealTypes,
  createDealType,
  updateDealType,
  deleteDealType,
  reorderDealTypes
} from '../controllers/dealTypeController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getDealTypes);
router.post('/', createDealType);
router.put('/:id', updateDealType);
router.delete('/:id', deleteDealType);
router.post('/reorder', reorderDealTypes);

export default router;



