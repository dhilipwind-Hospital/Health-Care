import { Router } from 'express';
import { MortuaryController } from '../controllers/mortuary.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/occupancy', authenticate, MortuaryController.getOccupancy);
router.get('/', authenticate, MortuaryController.list);
router.post('/', authenticate, MortuaryController.create);
router.post('/admit', authenticate, MortuaryController.admit);
router.patch('/:id/release', authenticate, MortuaryController.release);

export default router;
