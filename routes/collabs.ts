import { Router } from 'express';
import {
  getCollabs,
  getCollabById,
  createCollab,
  updateCollab,
  deleteCollab,
  addCollabMember,
  updateCollabMember,
  removeCollabMember,
  sendInvitation,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  resendInvitation
} from '../controllers/collabController';

const router = Router();

// Collab routes
router.get('/', getCollabs);
router.get('/:id', getCollabById);
router.post('/', createCollab);
router.put('/:id', updateCollab);
router.delete('/:id', deleteCollab);

// Member routes
router.post('/:collabId/members', addCollabMember);
router.put('/members/:id', updateCollabMember);
router.delete('/members/:id', removeCollabMember);

// Invitation routes
router.post('/:collabId/invitations', sendInvitation);
router.post('/invitations/accept', acceptInvitation);
router.post('/invitations/reject', rejectInvitation);
router.delete('/invitations/:id', cancelInvitation);
router.post('/invitations/:id/resend', resendInvitation);

export default router;

































































