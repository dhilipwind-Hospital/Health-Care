import { Router } from 'express';
import { PhysiotherapyController } from '../controllers/physiotherapy.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/treatment-types', authenticate, PhysiotherapyController.getTreatmentTypes);
router.get('/today-sessions', authenticate, PhysiotherapyController.getTodaySessions);
router.get('/', authenticate, PhysiotherapyController.list);
router.get('/:id', authenticate, PhysiotherapyController.getById);
router.post('/', authenticate, PhysiotherapyController.create);
router.put('/:id', authenticate, PhysiotherapyController.update);
router.get('/:orderId/sessions', authenticate, PhysiotherapyController.listSessions);
router.post('/:orderId/sessions', authenticate, PhysiotherapyController.createSession);
router.post('/sessions/:sessionId/complete', authenticate, PhysiotherapyController.completeSession);

export default router;
