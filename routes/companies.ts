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
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;