import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController';

const router = Router();

// Specific routes must come before dynamic routes
router.get('/unread-count', getUnreadCount);
router.put('/mark-all-read', markAllAsRead);
router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;

