import express from 'express';
import { authenticate } from '../middleware/auth';
import { getDriveUsage } from '../controllers/driveUsageController';

const router = express.Router();

router.get('/', authenticate, getDriveUsage);

export default router;





















