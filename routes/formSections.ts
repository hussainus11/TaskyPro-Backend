import { Router } from 'express';
import {
  getSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection
} from '../controllers/formSectionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getSections);
router.get('/:id', authenticate, getSectionById);
router.post('/', authenticate, createSection);
router.put('/:id', authenticate, updateSection);
router.delete('/:id', authenticate, deleteSection);

export default router;


