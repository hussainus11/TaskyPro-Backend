import express from 'express';
import {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency
} from '../controllers/currencyController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getCurrencies);
router.post('/', createCurrency);
router.put('/:id', updateCurrency);
router.delete('/:id', deleteCurrency);

export default router;

