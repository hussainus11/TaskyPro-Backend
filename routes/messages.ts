import { Router } from 'express';
import {
  getMessages,
  getMessageById,
  createMessage,
  deleteMessage
} from '../controllers/messageController';

const router = Router();

router.get('/', getMessages);
router.get('/:id', getMessageById);
router.post('/', createMessage);
router.delete('/:id', deleteMessage);

export default router;




