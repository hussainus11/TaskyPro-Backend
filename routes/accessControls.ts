import express from 'express';
import {
  getAccessControls,
  createAccessControl,
  updateAccessControl,
  deleteAccessControl,
  checkDragDropPermission
} from '../controllers/accessControlController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getAccessControls);
router.post('/', createAccessControl);
router.put('/:id', updateAccessControl);
router.delete('/:id', deleteAccessControl);
router.post('/check-drag-drop', checkDragDropPermission);

export default router;















































