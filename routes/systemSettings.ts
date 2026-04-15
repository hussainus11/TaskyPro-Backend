import express from 'express';
import { authenticate } from '../middleware/auth';
import { getSystemSettings, updateSystemSettings } from '../controllers/systemSettingsController';

const router = express.Router();

router.use(authenticate);
router.get('/', getSystemSettings);
router.put('/', updateSystemSettings);

export default router;





















