import { Router } from 'express';
import {
  getUserConnections,
  createConnection,
  updateConnection,
  deleteConnection,
  acceptConnection
} from '../controllers/userConnectionController';

const router = Router();

// Get all connections for a user
router.get('/users/:id/connections', getUserConnections);

// Create a connection request
router.post('/users/:id/connections', createConnection);

// Accept a connection
router.post('/connections/:id/accept', acceptConnection);

// Update connection status
router.put('/connections/:id', updateConnection);

// Delete a connection
router.delete('/connections/:id', deleteConnection);

export default router;




























































