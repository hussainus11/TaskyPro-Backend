import express from 'express';
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation
} from '../controllers/locationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getLocations);
router.post('/', createLocation);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);

export default router;








































































