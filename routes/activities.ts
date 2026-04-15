import { Router } from 'express';
import {
  getActivities,
  getActivityById,
  createActivity,
  deleteActivity
} from '../controllers/activityController';

const router = Router();

router.get('/', getActivities);
router.get('/:id', getActivityById);
router.post('/', createActivity);
router.delete('/:id', deleteActivity);

export default router;




