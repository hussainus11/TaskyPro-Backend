import { Router } from 'express';
import {
  getUsers,
  getUserById,
  getUserProfile,
  createUser,
  updateUser,
  deleteUser,
  setUserPassword
} from '../controllers/userController';
import {
  getNotesForUser,
  createNoteForUser,
  getNoteLabelsForUser
} from '../controllers/noteController';
import {
  getTodosForUser
} from '../controllers/todoController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getUsers);
router.post('/', createUser);
// More specific routes must come before /:id routes
router.post('/set-password/:id', setUserPassword);
// User-specific notes routes
router.get('/:id/notes', getNotesForUser);
router.post('/:id/notes', createNoteForUser);
// User-specific note labels routes
router.get('/:id/note-labels', getNoteLabelsForUser);
// User-specific todos routes
router.get('/:id/todos', getTodosForUser);
// User profile with enriched data (must come before /:id route)
router.get('/:id/profile', getUserProfile);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;