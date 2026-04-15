import { Router } from 'express';
import {
  getChatAccess,
  getUsersWithChatAccess,
  getAvailableUsers,
  grantChatAccess,
  revokeChatAccess,
  bulkGrantChatAccess,
  bulkRevokeChatAccess,
  checkChatAccess,
  getAllUsersWithChatAccess,
  adminGrantChatAccess,
  adminRevokeChatAccess
} from '../controllers/chatAccessController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Admin routes - must come before parameterized routes
router.get('/admin/all-users', authenticate, getAllUsersWithChatAccess);
router.post('/admin/grant', authenticate, adminGrantChatAccess);
router.post('/admin/revoke', authenticate, adminRevokeChatAccess);

// Regular routes
router.get('/', authenticate, getChatAccess);
router.get('/users', authenticate, getUsersWithChatAccess);
router.get('/available', authenticate, getAvailableUsers);
router.post('/grant', authenticate, grantChatAccess);
router.post('/revoke', authenticate, revokeChatAccess);
router.post('/bulk-grant', authenticate, bulkGrantChatAccess);
router.post('/bulk-revoke', authenticate, bulkRevokeChatAccess);
router.get('/check/:targetUserId', authenticate, checkChatAccess);

export default router;

