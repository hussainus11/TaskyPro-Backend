import { Router } from 'express';
import {
  getPdfReports,
  getPdfReportById,
  createPdfReport,
  updatePdfReport,
  deletePdfReport
} from '../controllers/pdfReportController';

const router = Router();

router.get('/', getPdfReports);
router.get('/:id', getPdfReportById);
router.post('/', createPdfReport);
router.put('/:id', updatePdfReport);
router.delete('/:id', deletePdfReport);

export default router;







