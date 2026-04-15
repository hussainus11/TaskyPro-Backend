import express from 'express';
import {
  getSecurities,
  createSecurity,
  updateSecurity,
  deleteSecurity
} from '../controllers/securityController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getSecurities);
router.post('/', createSecurity);
router.put('/:id', updateSecurity);
router.delete('/:id', deleteSecurity);

export default router;








































































