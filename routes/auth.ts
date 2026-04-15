import { Router } from 'express';
import {
  login,
  register,
  verifyToken,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin
} from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/change-password', changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google', googleLogin);
router.get('/verify', verifyToken);

export default router;

