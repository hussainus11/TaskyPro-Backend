import express from 'express';
import {
  getUnitsOfMeasurement,
  createUnitOfMeasurement,
  updateUnitOfMeasurement,
  deleteUnitOfMeasurement
} from '../controllers/unitOfMeasurementController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getUnitsOfMeasurement);
router.post('/', createUnitOfMeasurement);
router.put('/:id', updateUnitOfMeasurement);
router.delete('/:id', deleteUnitOfMeasurement);

export default router;








































































