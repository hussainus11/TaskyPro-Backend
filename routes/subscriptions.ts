import { Router } from 'express';
import {
  getCompanyPlan,
  updateCompanyPlan,
  activateSubscription
} from '../controllers/subscriptionController';

const router = Router();

router.get('/company/:companyId', getCompanyPlan);
router.put('/company/:companyId/plan', updateCompanyPlan);
router.post('/company/:companyId/activate', activateSubscription);

export default router;


