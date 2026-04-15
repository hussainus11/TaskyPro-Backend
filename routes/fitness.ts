import { Router } from 'express';
import {
  getFitnessActivities,
  getFitnessActivity,
  createFitnessActivity,
  updateFitnessActivity,
  deleteFitnessActivity,
  getTodayWorkouts
} from '../controllers/fitnessController';

const router = Router();

// Get today's workouts (must come before /:id)
router.get('/today', getTodayWorkouts);

// CRUD routes
router.get('/', getFitnessActivities);
router.get('/:id', getFitnessActivity);
router.post('/', createFitnessActivity);
router.put('/:id', updateFitnessActivity);
router.delete('/:id', deleteFitnessActivity);

export default router;
































































