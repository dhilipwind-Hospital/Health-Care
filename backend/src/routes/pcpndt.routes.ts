import { Router } from 'express';
import { PcpndtController } from '../controllers/pcpndt.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/indications', authenticate, PcpndtController.getIndications);
router.get('/monthly-report', authenticate, PcpndtController.getMonthlyReport);
router.get('/', authenticate, PcpndtController.list);
router.get('/:id', authenticate, PcpndtController.getById);
router.post('/', authenticate, PcpndtController.create);
router.put('/:id', authenticate, PcpndtController.update);
router.post('/:id/sign', authenticate, PcpndtController.signDeclaration);

export default router;
