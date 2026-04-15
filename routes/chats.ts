import { Router } from 'express';
import {
  getChats,
  getChatById,
  createChat,
  updateChat,
  addUsersToGroup,
} from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getChats);
router.get('/:id', authenticate, getChatById);
router.post('/', authenticate, createChat);
router.put('/:id', authenticate, updateChat);
router.post('/:id/add-users', authenticate, addUsersToGroup);

export default router;








