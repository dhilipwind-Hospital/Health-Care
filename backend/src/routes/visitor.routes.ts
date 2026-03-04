import { Router } from 'express';
import { VisitorController } from '../controllers/visitor.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/active', authenticate, VisitorController.getActive);
router.get('/patient/:patientId', authenticate, VisitorController.getByPatient);
router.get('/', authenticate, VisitorController.list);
router.post('/', authenticate, VisitorController.create);
router.patch('/:id/check-in', authenticate, VisitorController.checkIn);
router.patch('/:id/check-out', authenticate, VisitorController.checkOut);

export default router;
