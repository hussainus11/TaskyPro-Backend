import express from 'express';
import {
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField
} from '../controllers/customFieldController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getCustomFields);
router.post('/', createCustomField);
router.put('/:id', updateCustomField);
router.delete('/:id', deleteCustomField);

export default router;



























