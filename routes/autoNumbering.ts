import express from 'express';
import {
  getAutoNumberings,
  createAutoNumbering,
  updateAutoNumbering,
  deleteAutoNumbering,
  getNextNumber
} from '../controllers/autoNumberingController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getAutoNumberings);
router.post('/', createAutoNumbering);
router.put('/:id', updateAutoNumbering);
router.delete('/:id', deleteAutoNumbering);
router.get('/next/:entity', getNextNumber);

export default router;

























