import express from 'express';
import {
  getSources,
  createSource,
  updateSource,
  deleteSource,
  reorderSources
} from '../controllers/sourceController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getSources);
router.post('/', createSource);
router.put('/:id', updateSource);
router.delete('/:id', deleteSource);
router.post('/reorder', reorderSources);

export default router;












































































