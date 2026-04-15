import { Router } from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getNoteLabels,
  createNoteLabel,
  updateNoteLabel,
  deleteNoteLabel
} from '../controllers/noteController';

const router = Router();

// Note label routes (more specific routes must come before /:id)
router.get('/note-labels', getNoteLabels);
router.post('/note-labels', createNoteLabel);
router.put('/note-labels/:id', updateNoteLabel);
router.delete('/note-labels/:id', deleteNoteLabel);

// Note routes
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;