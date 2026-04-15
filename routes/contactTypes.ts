import express from 'express';
import {
  getContactTypes,
  createContactType,
  updateContactType,
  deleteContactType,
  reorderContactTypes
} from '../controllers/contactTypeController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getContactTypes);
router.post('/', createContactType);
router.put('/:id', updateContactType);
router.delete('/:id', deleteContactType);
router.post('/reorder', reorderContactTypes);

export default router;














































































