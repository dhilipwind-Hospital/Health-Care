import { Router } from 'express';
import { HousekeepingController } from '../controllers/housekeeping.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', authenticate, HousekeepingController.dashboard);
router.get('/', authenticate, HousekeepingController.list);
router.post('/', authenticate, HousekeepingController.create);
router.patch('/:id/assign', authenticate, HousekeepingController.assign);
router.patch('/:id/start', authenticate, HousekeepingController.start);
router.patch('/:id/complete', authenticate, HousekeepingController.complete);
router.patch('/:id/verify', authenticate, HousekeepingController.verify);

export default router;
