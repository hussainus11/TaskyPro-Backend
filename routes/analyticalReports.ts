import express from 'express';
import {
  getAnalyticalReports,
  createAnalyticalReport,
  updateAnalyticalReport,
  deleteAnalyticalReport
} from '../controllers/analyticalReportController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getAnalyticalReports);
router.post('/', createAnalyticalReport);
router.put('/:id', updateAnalyticalReport);
router.delete('/:id', deleteAnalyticalReport);

export default router;

























