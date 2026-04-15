import express from 'express';
import {
  getProductProperties,
  createProductProperty,
  updateProductProperty,
  deleteProductProperty
} from '../controllers/productPropertyController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getProductProperties);
router.post('/', createProductProperty);
router.put('/:id', updateProductProperty);
router.delete('/:id', deleteProductProperty);

export default router;








































































