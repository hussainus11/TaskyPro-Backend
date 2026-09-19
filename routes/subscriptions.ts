import { Router } from 'express';
import {
  getCompanyPlan,
  updateCompanyPlan,
  activateSubscription
} from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/company/:companyId', authenticate, getCompanyPlan);
router.put('/company/:companyId/plan', authenticate, updateCompanyPlan);
router.post('/company/:companyId/activate', authenticate, activateSubscription);

export default router;


