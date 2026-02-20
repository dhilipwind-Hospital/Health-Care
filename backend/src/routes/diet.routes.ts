import { Router } from 'express';
import { DietController } from '../controllers/diet.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/types', authenticate, DietController.getDietTypes);
router.get('/meal-types', authenticate, DietController.getMealTypes);
router.get('/', authenticate, DietController.list);
router.post('/', authenticate, DietController.create);
router.put('/:id', authenticate, DietController.update);

export default router;
