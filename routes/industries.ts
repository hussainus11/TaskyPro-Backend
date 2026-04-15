import express from 'express';
import {
  getIndustries,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  reorderIndustries
} from '../controllers/industryController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getIndustries);
router.post('/', createIndustry);
router.put('/:id', updateIndustry);
router.delete('/:id', deleteIndustry);
router.post('/reorder', reorderIndustries);

export default router;













































































