import { Router } from 'express';
import { TelemedicineController } from '../controllers/telemedicine.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/types', authenticate, TelemedicineController.getTypes);
router.get('/today', authenticate, TelemedicineController.getTodaySchedule);
router.get('/', authenticate, TelemedicineController.list);
router.get('/:id', authenticate, TelemedicineController.getById);
router.post('/', authenticate, TelemedicineController.create);
router.put('/:id', authenticate, TelemedicineController.update);
router.post('/:id/start', authenticate, TelemedicineController.startConsultation);
router.post('/:id/end', authenticate, TelemedicineController.endConsultation);
router.post('/:id/consent', authenticate, TelemedicineController.recordConsent);

export default router;
