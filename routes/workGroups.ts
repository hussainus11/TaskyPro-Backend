import { Router } from 'express';
import {
  getWorkGroups,
  getWorkGroupById,
  createWorkGroup,
  updateWorkGroup,
  deleteWorkGroup,
  addWorkGroupMember,
  updateWorkGroupMember,
  removeWorkGroupMember,
  getAvailableUsers
} from '../controllers/workGroupController';

const router = Router();

// Work group routes
router.get('/', getWorkGroups);
router.get('/:id', getWorkGroupById);
router.post('/', createWorkGroup);
router.put('/:id', updateWorkGroup);
router.delete('/:id', deleteWorkGroup);

// Member routes
router.get('/:workGroupId/available-users', getAvailableUsers);
router.post('/:workGroupId/members', addWorkGroupMember);
router.put('/members/:id', updateWorkGroupMember);
router.delete('/members/:id', removeWorkGroupMember);

export default router;

































































