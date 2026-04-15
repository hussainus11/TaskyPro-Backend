import { Router } from 'express';
import { startCall, joinCall, getCallInfo } from '../controllers/callController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All call routes require authentication
router.post('/start', authenticate, startCall);
router.get('/join/:callId', authenticate, joinCall);
router.get('/:callId', authenticate, getCallInfo);

export default router;


















































