import express from 'express';
import {
  getSalutations,
  createSalutation,
  updateSalutation,
  deleteSalutation,
  reorderSalutations
} from '../controllers/salutationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getSalutations);
router.post('/', createSalutation);
router.put('/:id', updateSalutation);
router.delete('/:id', deleteSalutation);
router.post('/reorder', reorderSalutations);

export default router;

