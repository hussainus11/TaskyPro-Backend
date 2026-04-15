import { Router } from 'express';
import {
  getUserSettings,
  updateProfileSettings,
  updateAccountSettings,
  updateBillingSettings,
  getBillingTransactions,
  updateAppearanceSettings,
  updateNotificationSettings,
  updateDisplaySettings,
  updateTablePreferences
} from '../controllers/settingsController';

const router = Router();

// Get user settings
router.get('/:userId', getUserSettings);

// Update profile settings
router.put('/:userId/profile', updateProfileSettings);

// Update account settings
router.put('/:userId/account', updateAccountSettings);

// Update billing settings
router.put('/:userId/billing', updateBillingSettings);
router.get('/:userId/billing/transactions', getBillingTransactions);

// Update appearance settings
router.put('/:userId/appearance', updateAppearanceSettings);

// Update notification settings
router.put('/:userId/notifications', updateNotificationSettings);

// Update display settings
router.put('/:userId/display', updateDisplaySettings);

// Update table preferences
router.put('/:userId/table-preferences', updateTablePreferences);

export default router;



