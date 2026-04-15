import { Router } from 'express';
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  updateMessage,
  deleteMessage,
  starMessage,
  forwardMessage,
} from '../controllers/chatMessageController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/chat/:chatId/messages', authenticate, getMessages);
router.post('/chat/:chatId/messages', authenticate, sendMessage);
router.put('/chat/:chatId/messages/read', authenticate, markMessagesAsRead);

// Message-specific routes (must come after chat routes)
router.put('/:messageId', authenticate, updateMessage);
router.delete('/:messageId', authenticate, deleteMessage);
router.put('/:messageId/star', authenticate, starMessage);
router.post('/:messageId/forward', authenticate, forwardMessage);

export default router;







