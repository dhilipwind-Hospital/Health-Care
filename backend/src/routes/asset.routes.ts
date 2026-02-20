import { Router } from 'express';
import { AssetController } from '../controllers/asset.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/types', authenticate, AssetController.getTypes);
router.get('/due-maintenance', authenticate, AssetController.getDueMaintenance);
router.get('/', authenticate, AssetController.list);
router.post('/', authenticate, AssetController.create);
router.put('/:id', authenticate, AssetController.update);
router.get('/:id/maintenance', authenticate, AssetController.getMaintenanceLogs);
router.post('/:id/maintenance', authenticate, AssetController.addMaintenance);

export default router;
