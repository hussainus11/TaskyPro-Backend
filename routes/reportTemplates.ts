import { Router } from 'express';
import {
  getReportTemplates,
  getReportTemplateById,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate
} from '../controllers/reportTemplateController';

const router = Router();

router.get('/', getReportTemplates);
router.get('/:id', getReportTemplateById);
router.post('/', createReportTemplate);
router.put('/:id', updateReportTemplate);
router.delete('/:id', deleteReportTemplate);

export default router;











