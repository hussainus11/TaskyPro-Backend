import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listDealDashboards,
  getDealDashboard,
  createDealDashboard,
  updateDealDashboard,
  deleteDealDashboard,
  updateMyDashboardPrefs,
  reorderMyDashboards,
} from '../controllers/dealDashboardController';

const router = Router();

router.use(authenticate);

router.get('/', listDealDashboards);
router.post('/', createDealDashboard);
router.post('/reorder', reorderMyDashboards);

router.get('/:id', getDealDashboard);
router.put('/:id', updateDealDashboard);
router.delete('/:id', deleteDealDashboard);
router.put('/:id/prefs', updateMyDashboardPrefs);

export default router;
