import { Router } from 'express';
import {
  getPricingPlans,
  getPricingPlansByIndustry,
  getPricingPlanById,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan
} from '../controllers/pricingPlanController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getPricingPlans);
router.get('/industry/:industry', getPricingPlansByIndustry);
router.get('/:id', getPricingPlanById);
router.post('/', createPricingPlan);
router.put('/:id', updatePricingPlan);
router.delete('/:id', deletePricingPlan);

export default router;



















































