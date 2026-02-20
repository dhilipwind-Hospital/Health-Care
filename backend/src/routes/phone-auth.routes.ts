import { Router } from 'express';
import { PhoneAuthController } from '../controllers/phone-auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

// Public route - verify phone and authenticate/register
router.post('/verify', errorHandler(PhoneAuthController.verifyPhoneAndAuth));

// Check if phone auth is configured
router.get('/status', errorHandler(PhoneAuthController.checkPhoneStatus));

// Protected route - link phone to existing user
router.post('/link', authenticate, errorHandler(PhoneAuthController.linkPhoneToUser));

export default router;
