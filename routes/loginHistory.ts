import { Router } from 'express';
import { getLoginHistory } from '../controllers/loginHistoryController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getLoginHistory);

export default router;





















