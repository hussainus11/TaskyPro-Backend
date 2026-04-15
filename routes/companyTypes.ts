import express from 'express';
import {
  getCompanyTypes,
  createCompanyType,
  updateCompanyType,
  deleteCompanyType,
  reorderCompanyTypes
} from '../controllers/companyTypeController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getCompanyTypes);
router.post('/', createCompanyType);
router.put('/:id', updateCompanyType);
router.delete('/:id', deleteCompanyType);
router.post('/reorder', reorderCompanyTypes);

export default router;













































































