import express from 'express';
import {
  getTaxes,
  createTax,
  updateTax,
  deleteTax
} from '../controllers/taxController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getTaxes);
router.post('/', createTax);
router.put('/:id', updateTax);
router.delete('/:id', deleteTax);

export default router;










































































