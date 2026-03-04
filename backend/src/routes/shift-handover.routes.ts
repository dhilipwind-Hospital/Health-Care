import { Router } from 'express';
import { ShiftHandoverController } from '../controllers/shift-handover.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/shift', authenticate, ShiftHandoverController.getByShift);
router.get('/ward/:wardId', authenticate, ShiftHandoverController.getByWard);
router.get('/', authenticate, ShiftHandoverController.list);
router.post('/', authenticate, ShiftHandoverController.create);
router.put('/:id', authenticate, ShiftHandoverController.update);
router.patch('/:id/acknowledge', authenticate, ShiftHandoverController.acknowledge);

export default router;
