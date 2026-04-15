import { Router } from 'express';
import {
  getSleepRecords,
  getSleepRecord,
  getTodaySleep,
  upsertSleepRecord,
  updateSleepRecord,
  deleteSleepRecord
} from '../controllers/sleepController';

const router = Router();

// Get today's sleep (must come before /:id)
router.get('/today', getTodaySleep);

// CRUD routes
router.get('/', getSleepRecords);
router.get('/:id', getSleepRecord);
router.post('/', upsertSleepRecord);
router.put('/:id', updateSleepRecord);
router.delete('/:id', deleteSleepRecord);

export default router;
































































