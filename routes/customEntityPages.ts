import { Router } from 'express';
import {
  getCustomEntityPages,
  getCustomEntityPageBySlug
} from '../controllers/customEntityPageController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getCustomEntityPages);
router.get('/:slug', getCustomEntityPageBySlug);

export default router;

