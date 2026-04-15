import { Router } from 'express';
import {
    getNoteLabels,
    getNoteLabelById,
    createNoteLabel,
    updateNoteLabel,
    deleteNoteLabel
} from '../controllers/notelabelController';

const router = Router();

router.get('/', getNoteLabels);
router.get('/:id', getNoteLabelById);
router.post('/', createNoteLabel);
router.put('/:id', updateNoteLabel);
router.delete('/:id', deleteNoteLabel);

export default router;