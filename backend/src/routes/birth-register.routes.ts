import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';
import { BirthRegisterController } from '../controllers/birth-register.controller';

const router = Router();

const isStaff = authorize({ requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE] });

router.get('/', authenticate, isStaff, BirthRegisterController.list);
router.get('/:id', authenticate, isStaff, BirthRegisterController.getById);
router.post('/', authenticate, isStaff, BirthRegisterController.create);
router.put('/:id', authenticate, isStaff, BirthRegisterController.update);
router.patch('/:id/vaccination', authenticate, isStaff, BirthRegisterController.recordVaccination);

export default router;
