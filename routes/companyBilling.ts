import { Router } from 'express';
import { getPlatformBillingTransactions, getPlatformBillingSummary } from '../controllers/companyBillingController';
import { authenticate, requirePlatformOwner } from '../middleware/auth';

const router = Router();

router.get('/transactions', authenticate, requirePlatformOwner, getPlatformBillingTransactions);
router.get('/summary', authenticate, requirePlatformOwner, getPlatformBillingSummary);

export default router;
