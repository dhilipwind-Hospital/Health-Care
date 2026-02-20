import { Router } from 'express';
import { ConsentController } from '../controllers/consent.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/types', authenticate, ConsentController.listConsentTypes);
router.get('/templates', authenticate, ConsentController.getConsentTemplates);
router.get('/check', authenticate, ConsentController.checkConsent);
router.get('/', authenticate, ConsentController.list);
router.get('/patient/:patientId', authenticate, ConsentController.getByPatient);
router.get('/:id', authenticate, ConsentController.getById);
router.post('/', authenticate, ConsentController.create);
router.put('/:id/withdraw', authenticate, ConsentController.withdraw);

export default router;
