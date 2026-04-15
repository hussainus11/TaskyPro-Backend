import { Router } from 'express';
import {
  getFields,
  getFieldById,
  createField,
  updateField,
  deleteField,
  reorderFields
} from '../controllers/formFieldController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getFields);
router.get('/:id', authenticate, getFieldById);
router.post('/', authenticate, createField);
router.put('/:id', authenticate, updateField);
router.delete('/:id', authenticate, deleteField);
router.post('/reorder', authenticate, reorderFields);

export default router;


