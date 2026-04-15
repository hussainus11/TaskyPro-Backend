import express from 'express';
import {
  getUserRoles,
  createUserRole,
  updateUserRole,
  deleteUserRole
} from '../controllers/userRoleController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getUserRoles);
router.post('/', createUserRole);
router.put('/:id', updateUserRole);
router.delete('/:id', deleteUserRole);

export default router;








































































