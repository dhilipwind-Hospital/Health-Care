import { Router } from 'express';
import { MlcController } from '../controllers/mlc.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/register', authenticate, MlcController.getRegister);
router.get('/analytics', authenticate, MlcController.analytics);
router.get('/', authenticate, MlcController.list);
router.get('/:id', authenticate, MlcController.getById);
router.post('/', authenticate, MlcController.create);
router.put('/:id', authenticate, MlcController.update);
router.patch('/:id/status', authenticate, MlcController.updateStatus);
router.post('/:id/police-intimation', authenticate, MlcController.sendPoliceIntimation);
router.post('/:id/body-handover', authenticate, MlcController.recordBodyHandover);

export default router;
