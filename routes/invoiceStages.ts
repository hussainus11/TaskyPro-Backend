import express from 'express';
import {
  getInvoiceStages,
  createInvoiceStage,
  updateInvoiceStage,
  deleteInvoiceStage,
  reorderInvoiceStages
} from '../controllers/invoiceStageController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getInvoiceStages);
router.post('/', createInvoiceStage);
router.put('/:id', updateInvoiceStage);
router.delete('/:id', deleteInvoiceStage);
router.post('/reorder', reorderInvoiceStages);

export default router;



