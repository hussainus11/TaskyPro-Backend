import { Router } from 'express';
import {
  getCompanies,
  getCompanyById,
  getCompanyBySlug,
  createCompany,
  updateCompany,
  deleteCompany
} from '../controllers/companyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getCompanies);
router.get('/slug/:slug', getCompanyBySlug);
router.get('/:id', getCompanyById);
router.post('/', createCompany); // open: self-service tenant signup / onboarding
router.put('/:id', authenticate, updateCompany);
router.delete('/:id', authenticate, deleteCompany);

export default router;