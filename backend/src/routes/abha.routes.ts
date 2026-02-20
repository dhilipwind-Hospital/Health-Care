import { Router } from 'express';
import { AbhaController } from '../controllers/abha.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', authenticate, AbhaController.getDashboard);
router.get('/', authenticate, AbhaController.list);
router.get('/patient/:patientId', authenticate, AbhaController.getByPatient);
router.post('/', authenticate, AbhaController.create);
router.post('/:id/verify', authenticate, AbhaController.verify);
router.post('/:id/link', authenticate, AbhaController.link);
router.post('/:id/consent', authenticate, AbhaController.recordConsent);

export default router;
