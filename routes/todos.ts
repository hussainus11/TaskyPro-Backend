import { Router } from 'express';
import {
  getTodos,
  getTodosForUser,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  reorderTodos,
  addComment,
  deleteComment,
  addFile,
  removeFile,
  addSubTask,
  updateSubTask,
  removeSubTask
} from '../controllers/todoController';

const router = Router();

// Todo routes - specific routes must come before parameterized routes
router.get('/', getTodos);
router.post('/', createTodo);
router.post('/reorder', reorderTodos);
router.get('/:id', getTodoById);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);

// Todo comment routes
router.post('/:id/comments', addComment);
router.delete('/:id/comments/:commentId', deleteComment);

// Todo file routes
router.post('/:id/files', addFile);
router.delete('/:id/files/:fileId', removeFile);

// Todo subtask routes
router.post('/:id/subtasks', addSubTask);
router.put('/:id/subtasks/:subTaskId', updateSubTask);
router.delete('/:id/subtasks/:subTaskId', removeSubTask);

export default router;

