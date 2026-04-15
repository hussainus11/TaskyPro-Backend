import { Router } from 'express';
import {
  getNutritionEntries,
  getNutritionEntry,
  getTodayNutrition,
  upsertNutritionEntry,
  updateNutritionEntry,
  deleteNutritionEntry
} from '../controllers/nutritionController';

const router = Router();

// Get today's nutrition (must come before /:id)
router.get('/today', getTodayNutrition);

// CRUD routes
router.get('/', getNutritionEntries);
router.get('/:id', getNutritionEntry);
router.post('/', upsertNutritionEntry);
router.put('/:id', updateNutritionEntry);
router.delete('/:id', deleteNutritionEntry);

export default router;
































































